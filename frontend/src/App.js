import React, { useState } from 'react';
import axios from 'axios';

// Read API base URL from environment variable, fallback to a default if not set
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

function App() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [downloadingFormats, setDownloadingFormats] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    if (!url.trim()) {
      setError('Please enter a valid URL');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/extract`, { url });
      setResult(response.data);
    } catch (err) {
      console.error('Extraction error:', err);
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        setError(`Server error: ${err.response.data.error || err.response.statusText}`);
      } else if (err.request) {
        // The request was made but no response was received
        setError('No response from server. Please check your network connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
        setError(`An error occurred: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (format) => {
    setDownloadingFormats(prev => ({ ...prev, [format.format_id]: true }));
    try {
      const response = await axios.post(`${API_BASE_URL}/download`, 
        { 
          url, 
          format_id: format.format_id,
          title: result.title,
          resolution: format.resolution
        },
        { 
          responseType: 'blob',
          headers: { 'Accept': 'application/octet-stream' }
        }
      );
      
      const contentDisposition = response.headers['content-disposition'];
      
      let filename = 'download';
      if (contentDisposition) {
        const filenameRegex = /filename\*=UTF-8''([\w%.-]+)/;
        const matches = filenameRegex.exec(contentDisposition);
        if (matches != null && matches[1]) {
          filename = decodeURIComponent(matches[1]);
        }
      }

      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download error:', err);
      let errorMessage = 'Download failed. Please try again.';
      if (err.response && err.response.data && err.response.data.error) {
        errorMessage = `Download failed: ${err.response.data.error}`;
      } else if (err.message) {
        errorMessage = `Download failed: ${err.message}`;
      }
      setError(errorMessage);
    } finally {
      setDownloadingFormats(prev => ({ ...prev, [format.format_id]: false }));
    }
  };

  const renderMediaContent = () => {
    if (!result) return null;

    switch (result.type) {
      case 'video':
      case 'audio':
        return (
          <div className="overflow-x-auto shadow-md sm:rounded-lg">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-2 py-3 whitespace-nowrap">Format</th>
                  <th scope="col" className="px-2 py-3 whitespace-nowrap">Quality</th>
                  <th scope="col" className="hidden sm:table-cell px-2 py-3 whitespace-nowrap">Size</th>
                  <th scope="col" className="hidden md:table-cell px-2 py-3 whitespace-nowrap">Codec</th>
                  <th scope="col" className="px-2 py-3">
                    <span className="sr-only">Download</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.formats.map((format, index) => (
                  <tr key={format.format_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-2 py-4 whitespace-nowrap">{format.ext}</td>
                    <td className="px-2 py-4 whitespace-nowrap">{result.type === 'video' ? format.resolution : `${format.abr}kbps`}</td>
                    <td className="hidden sm:table-cell px-2 py-4 whitespace-nowrap">{format.filesize}</td>
                    <td className="hidden md:table-cell px-2 py-4 whitespace-nowrap">{result.type === 'video' ? format.vcodec : format.acodec}</td>
                    <td className="px-2 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleDownload(format)}
                        disabled={downloadingFormats[format.format_id]}
                        className="w-24 h-10 text-white bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm px-3 py-2 text-center inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition duration-300 ease-in-out"
                      >
                        {downloadingFormats[format.format_id] ? (
                          <>
                            <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="whitespace-nowrap">Loading</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                            <span className="whitespace-nowrap">Download</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'image':
        return (
          <div className="bg-white shadow-md rounded-lg p-4">
            <p className="text-lg font-semibold mb-2">Image Information:</p>
            <p>File extension: {result.formats[0].ext}</p>
            <p>File size: {result.formats[0].filesize}</p>
            <p>Dimensions: {result.formats[0].width}x{result.formats[0].height}</p>
            <button
              onClick={() => handleDownload(result.formats[0])}
              disabled={downloadingFormats['image']}
              className="mt-4 w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              {downloadingFormats['image'] ? 'Downloading...' : 'Download Image'}
            </button>
          </div>
        );
      case 'playlist':
        return (
          <div className="bg-white shadow-md rounded-lg p-4">
            <p className="text-lg font-semibold mb-2">Playlist: {result.title}</p>
            <ul className="list-disc list-inside">
              {result.entries.map((entry, index) => (
                <li key={index} className="truncate">{entry.title}</li>
              ))}
            </ul>
          </div>
        );
      default:
        return <p>Unsupported media type</p>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 py-6 flex flex-col justify-between sm:py-12">
      <div className="relative py-3 px-4 w-full max-w-xl md:max-w-3xl lg:max-w-4xl xl:max-w-7xl mx-auto flex-grow">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-light-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative bg-white shadow-lg sm:rounded-3xl px-4 py-10 sm:p-20">
          <div className="max-w-full mx-auto">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-center text-gray-900 mb-6">Media Link Extractor</h1>
            </div>
            <div className="divide-y divide-gray-200">
              <form onSubmit={handleSubmit} className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <div className="relative">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Enter media URL"
                    className="peer placeholder-transparent h-10 w-full border-b-2 border-gray-300 text-gray-900 focus:outline-none focus:border-rose-600"
                  />
                  <label className="absolute left-0 -top-3.5 text-gray-600 text-sm peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-440 peer-placeholder-shown:top-2 transition-all peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm">Media URL</label>
                </div>
                <div className="relative">
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full bg-gradient-to-r from-cyan-400 to-light-blue-500 text-white rounded-md px-4 py-2 hover:from-cyan-500 hover:to-light-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50 transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Extracting...' : 'Extract'}
                  </button>
                </div>
              </form>
              {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
                  <p className="font-bold">Error</p>
                  <p>{error}</p>
                </div>
              )}
              {result && (
                <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                  <h2 className="text-xl sm:text-2xl font-bold mb-4 text-center text-gray-800">{result.title}</h2>
                  {renderMediaContent()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <footer className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-3 mt-8 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center text-sm">
            <div className="mb-2 sm:mb-0 text-center sm:text-left">
              <span className="font-semibold bg-clip-text">
                Marco Nie
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <a 
                href="https://niekun.net" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center hover:text-cyan-400 transition duration-300"
              >
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
                </svg>
                niekun.net
              </a>
              <a 
                href="mailto:me@niekun.net" 
                className="flex items-center hover:text-cyan-400 transition duration-300"
              >
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                me@niekun.net
              </a>
              <a 
                href="https://blog.niekun.net/start-page.html" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center hover:text-cyan-400 transition duration-300"
              >
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17C5.06 5.687 5 5.35 5 5zm4 1V5a1 1 0 10-1 1h1zm3 0a1 1 0 10-1-1v1h1z" clipRule="evenodd" />
                  <path d="M9 11H3v5a2 2 0 002 2h4v-7zM11 18h4a2 2 0 002-2v-5h-6v7z" />
                </svg>
                打赏
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;