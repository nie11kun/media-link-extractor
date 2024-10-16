import React, { useState } from 'react';
import axios from 'axios';

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

    try {
      const response = await axios.post('http://localhost:5000/extract', { url });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (format) => {
    setDownloadingFormats(prev => ({ ...prev, [format.format_id]: true }));
    try {
      const response = await axios.post('http://localhost:5000/download', 
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
      setError(err.response?.data?.error || 'Download failed');
    } finally {
      setDownloadingFormats(prev => ({ ...prev, [format.format_id]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 px-4 w-full max-w-7xl mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-light-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative bg-white shadow-lg sm:rounded-3xl px-4 py-10 sm:p-20">
          <div className="max-w-full mx-auto">
            <div>
              <h1 className="text-3xl font-extrabold text-center text-gray-900 mb-6">Media Link Extractor</h1>
            </div>
            <div className="divide-y divide-gray-200">
              <form onSubmit={handleSubmit} className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <div className="relative">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Enter video URL"
                    className="peer placeholder-transparent h-10 w-full border-b-2 border-gray-300 text-gray-900 focus:outline-none focus:border-rose-600"
                  />
                  <label className="absolute left-0 -top-3.5 text-gray-600 text-sm peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-440 peer-placeholder-shown:top-2 transition-all peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm">Video URL</label>
                </div>
                <div className="relative">
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full bg-gradient-to-r from-cyan-400 to-light-blue-500 text-white rounded-md px-4 py-2 hover:from-cyan-500 hover:to-light-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50 transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105"
                  >
                    {loading ? 'Extracting...' : 'Extract'}
                  </button>
                </div>
              </form>
              {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
                  <p>{error}</p>
                </div>
              )}
              {result && (
                <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                  <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">{result.title}</h2>
                  <div className="overflow-x-auto shadow-md sm:rounded-lg">
                    <table className="w-full text-sm text-left text-gray-500">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                          <th scope="col" className="px-2 py-3 whitespace-nowrap">Format</th>
                          <th scope="col" className="px-2 py-3 whitespace-nowrap">Resolution</th>
                          <th scope="col" className="px-2 py-3 whitespace-nowrap">Filesize</th>
                          <th scope="col" className="px-2 py-3 whitespace-nowrap">Video Codec</th>
                          <th scope="col" className="px-2 py-3 whitespace-nowrap">Audio Codec</th>
                          <th scope="col" className="px-2 py-3">
                            <span className="sr-only">Download</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.formats.map((format, index) => (
                          <tr key={format.format_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-2 py-4 whitespace-nowrap">{format.ext}</td>
                            <td className="px-2 py-4 whitespace-nowrap">{format.resolution}</td>
                            <td className="px-2 py-4 whitespace-nowrap">{format.filesize}</td>
                            <td className="px-2 py-4 whitespace-nowrap">{format.vcodec}</td>
                            <td className="px-2 py-4 whitespace-nowrap">{format.acodec}</td>
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
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;