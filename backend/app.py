from flask import Flask, request, jsonify, send_file, make_response
from flask_cors import CORS
import yt_dlp
import os
import re
import tempfile
import uuid
import atexit
import shutil
import logging
import threading
import time
from urllib.parse import quote
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.DEBUG)

# Create a temporary directory for downloads
TEMP_DIR = tempfile.mkdtemp()

# List to keep track of files to be deleted
files_to_delete = []

# Global dictionary to track files and their creation times
file_tracker = {}

def delayed_delete(file_path, retries=5, delay=1):
    for _ in range(retries):
        try:
            os.remove(file_path)
            logging.info(f"Successfully deleted file: {file_path}")
            if file_path in file_tracker:
                del file_tracker[file_path]
            return
        except Exception as e:
            logging.warning(f"Failed to delete file: {file_path}. Retrying... Error: {str(e)}")
            time.sleep(delay)
    
    logging.error(f"Failed to delete file after {retries} attempts: {file_path}")
    files_to_delete.append(file_path)

def cleanup_old_files():
    while True:
        current_time = datetime.now()
        files_to_remove = []
        
        for file_path, creation_time in file_tracker.items():
            if current_time - creation_time > timedelta(hours=1):
                files_to_remove.append(file_path)
        
        for file_path in files_to_remove:
            delayed_delete(file_path)
        
        time.sleep(300)  # Check every 5 minutes

# Start the cleanup thread when the application starts
cleanup_thread = threading.Thread(target=cleanup_old_files, daemon=True)
cleanup_thread.start()

# Cleanup function to remove the temporary directory and any leftover files
def cleanup():
    for file_path in files_to_delete:
        try:
            os.remove(file_path)
        except Exception as e:
            logging.error(f"Failed to delete file during cleanup: {file_path}. Error: {str(e)}")
    
    shutil.rmtree(TEMP_DIR, ignore_errors=True)

# Register the cleanup function to be called when the application exits
atexit.register(cleanup)

def format_filesize(bytes):
    if bytes is None:
        return "unknown"
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if bytes < 1024:
            return f"{bytes:.2f} {unit}"
        bytes /= 1024
    return f"{bytes:.2f} PB"

def sanitize_filename(filename):
    return re.sub(r'[^\w\-_\. ]', '_', filename)

def get_media_type(info):
    if info.get('_type') == 'playlist':
        return 'playlist'
    elif info.get('vcodec') != 'none':
        return 'video'
    elif info.get('acodec') != 'none':
        return 'audio'
    elif info.get('ext') in ['jpg', 'jpeg', 'png', 'gif']:
        return 'image'
    else:
        return 'unknown'

@app.route('/extract', methods=['POST'])
def extract_link():
    url = request.json['url']
    
    ydl_opts = {
        'quiet': True,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            if 'entries' in info:
                # It's a playlist
                return jsonify({
                    'type': 'playlist',
                    'title': info.get('title', 'Untitled Playlist'),
                    'entries': [{'title': entry.get('title', 'Untitled'), 'url': entry['webpage_url']} for entry in info['entries']]
                })
            else:
                # Single media item
                media_type = get_media_type(info)
                
                formats = []
                if media_type in ['video', 'audio']:
                    for f in info['formats']:
                        format_info = {
                            'format_id': f['format_id'],
                            'ext': f['ext'],
                            'filesize': format_filesize(f.get('filesize')),
                            'tbr': f.get('tbr'),
                            'resolution': f.get('resolution', 'audio only'),
                            'vcodec': f.get('vcodec', 'none'),
                            'acodec': f.get('acodec', 'none'),
                            'abr': f.get('abr'),
                        }
                        formats.append(format_info)
                elif media_type == 'image':
                    formats = [{
                        'format_id': 'image',
                        'ext': info.get('ext', 'unknown'),
                        'filesize': format_filesize(info.get('filesize')),
                        'width': info.get('width', 'unknown'),
                        'height': info.get('height', 'unknown'),
                    }]
                
                return jsonify({
                    'type': media_type,
                    'title': info.get('title', 'Untitled'),
                    'formats': formats
                })
    except Exception as e:
        logging.error(f"Error during link extraction: {str(e)}")
        return jsonify({'error': str(e)}), 400

@app.route('/download', methods=['POST'])
def download_media():
    url = request.json['url']
    format_id = request.json.get('format_id', 'best')  # Default to 'best' for images
    title = request.json['title']
    
    sanitized_title = sanitize_filename(title)
    unique_id = uuid.uuid4()
    temp_filename = f"{sanitized_title}_{unique_id}.%(ext)s"
    file_path = os.path.join(TEMP_DIR, temp_filename)
    
    ydl_opts = {
        'format': format_id,
        'outtmpl': file_path,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            
        downloaded_file = [f for f in os.listdir(TEMP_DIR) if str(unique_id) in f][0]
        full_path = os.path.join(TEMP_DIR, downloaded_file)
        
        file_tracker[full_path] = datetime.now()
        
        media_type = get_media_type(info)
        file_extension = os.path.splitext(downloaded_file)[1]
        
        if media_type == 'video':
            resolution = next((f['resolution'] for f in info['formats'] if f['format_id'] == format_id), 'unknown')
            final_filename = f"{sanitized_title}_{resolution}{file_extension}"
        elif media_type == 'audio':
            bitrate = next((f.get('abr', 'unknown') for f in info['formats'] if f['format_id'] == format_id), 'unknown')
            final_filename = f"{sanitized_title}_{bitrate}kbps{file_extension}"
        else:  # image or unknown
            final_filename = f"{sanitized_title}{file_extension}"

        logging.debug(f"Sending file: {final_filename}")

        response = make_response(send_file(full_path, as_attachment=True))
        encoded_filename = quote(final_filename)
        response.headers["Content-Disposition"] = f"attachment; filename*=UTF-8''{encoded_filename}"
        response.headers["Access-Control-Expose-Headers"] = "Content-Disposition"
        
        return response
    except Exception as e:
        logging.error(f"Error during download: {str(e)}")
        if os.path.exists(full_path):
            os.remove(full_path)
        return jsonify({'error': str(e)}), 400

@app.errorhandler(Exception)
def handle_exception(e):
    logging.error(f"Unhandled exception: {str(e)}")
    return jsonify({'error': 'An unexpected error occurred'}), 500

if __name__ == '__main__':
    app.run(debug=True)