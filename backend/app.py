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

app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.DEBUG)

# Create a temporary directory for downloads
TEMP_DIR = tempfile.mkdtemp()

# List to keep track of files to be deleted
files_to_delete = []

def delayed_delete(file_path, retries=5, delay=1):
    for _ in range(retries):
        try:
            os.remove(file_path)
            logging.info(f"Successfully deleted file: {file_path}")
            return
        except Exception as e:
            logging.warning(f"Failed to delete file: {file_path}. Retrying... Error: {str(e)}")
            time.sleep(delay)
    
    logging.error(f"Failed to delete file after {retries} attempts: {file_path}")
    files_to_delete.append(file_path)

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
                video = info['entries'][0]
            else:
                video = info
            
            formats = []
            for f in video['formats']:
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
            
            return jsonify({
                'title': video['title'],
                'formats': formats
            })
    except Exception as e:
        logging.error(f"Error during link extraction: {str(e)}")
        return jsonify({'error': str(e)}), 400

@app.route('/download', methods=['POST'])
def download_media():
    url = request.json['url']
    format_id = request.json['format_id']
    title = request.json['title']
    resolution = request.json['resolution']
    
    sanitized_title = sanitize_filename(title)
    unique_id = uuid.uuid4()
    temp_filename = f"{sanitized_title}_{resolution}_{unique_id}.%(ext)s"
    file_path = os.path.join(TEMP_DIR, temp_filename)
    
    ydl_opts = {
        'format': f'{format_id}/best',  # Fallback to best available if format_id is not available
        'outtmpl': file_path,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            # Get the actual format that was downloaded
            downloaded_format = info['format_id']
            
        downloaded_file = [f for f in os.listdir(TEMP_DIR) if str(unique_id) in f][0]
        full_path = os.path.join(TEMP_DIR, downloaded_file)
        
        # If the downloaded format is different from the requested one, update the resolution
        if downloaded_format != format_id:
            new_resolution = next((f['resolution'] for f in info['formats'] if f['format_id'] == downloaded_format), 'unknown')
        else:
            new_resolution = resolution

        # Create the final filename
        file_extension = os.path.splitext(downloaded_file)[1]
        final_filename = f"{sanitized_title}_{new_resolution}{file_extension}"

        logging.debug(f"Sending file: {final_filename}")

        response = make_response(send_file(full_path, as_attachment=True))
        encoded_filename = quote(final_filename)
        response.headers["Content-Disposition"] = f"attachment; filename*=UTF-8''{encoded_filename}"
        response.headers["Access-Control-Expose-Headers"] = "Content-Disposition"
        
        # Start a new thread to delete the file after sending
        threading.Thread(target=delayed_delete, args=(full_path,)).start()
        
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