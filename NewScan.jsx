import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { scanAPI } from '../services/api';

export default function NewScan() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!url.trim()) {
      setError('Please enter a website URL.');
      return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setError('URL must start with http:// or https://');
      return;
    }

    setScanning(true);

    // Simulate progress animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 600);

    try {
      const res = await scanAPI.startScan(url.trim());
      clearInterval(progressInterval);
      setProgress(100);

      // Short delay to show 100%
      setTimeout(() => {
        navigate(`/scan-results/${res.data.id}`);
      }, 500);
    } catch (err) {
      clearInterval(progressInterval);
      setProgress(0);
      const msg = err.response?.data?.detail || 'Scan failed. Please try again.';
      setError(msg);
      setScanning(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">New Security Scan</h1>
          <p className="text-gray-400 mb-8">
            Enter a website URL to perform a comprehensive security assessment with risk intelligence.
          </p>
        </div>

        {/* Input Card */}
        <div className="glass rounded-xl p-8 mb-6">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-4">
                {error}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">Website URL</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => { setUrl(e.target.value); setError(''); }}
                  placeholder="https://example.com"
                  className="input-cyber flex-1"
                  disabled={scanning}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={scanning}
                  className="btn-primary whitespace-nowrap glow-blue"
                >
                  {scanning ? (
                    <span className="flex items-center justify-center space-x-2">
                      <span className="spinner w-5 h-5"></span>
                      <span>Scanning...</span>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span>Start Scan</span>
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            {scanning && (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Scan in progress...</span>
                  <span className="text-sm text-cyber-blue font-mono">{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-2 bg-cyber-card rounded-full overflow-hidden">
                  <div
                    className="h-full gradient-primary rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  ></div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <div className={`w-2 h-2 rounded-full ${progress > 10 ? 'bg-green-400' : 'bg-gray-600'}`}></div>
                    <span>Crawling website endpoints...</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <div className={`w-2 h-2 rounded-full ${progress > 30 ? 'bg-green-400' : 'bg-gray-600'}`}></div>
                    <span>Discovering forms and APIs...</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <div className={`w-2 h-2 rounded-full ${progress > 50 ? 'bg-green-400' : 'bg-gray-600'}`}></div>
                    <span>Testing for vulnerabilities...</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <div className={`w-2 h-2 rounded-full ${progress > 70 ? 'bg-green-400' : 'bg-gray-600'}`}></div>
                    <span>Calculating risk scores...</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <div className={`w-2 h-2 rounded-full ${progress > 90 ? 'bg-green-400' : 'bg-gray-600'}`}></div>
                    <span>Generating report...</span>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Info Cards */}
        {!scanning && (
          <div className="grid sm:grid-cols-3 gap-4 animate-fade-in">
            <div className="glass rounded-xl p-4 text-center">
              <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-white font-medium text-sm">Lightning Fast</p>
              <p className="text-gray-500 text-xs mt-1">Results in under 30 seconds</p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <p className="text-white font-medium text-sm">8+ Scan Types</p>
              <p className="text-gray-500 text-xs mt-1">SQLi, XSS, CSRF, IDOR, & more</p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-white font-medium text-sm">PDF Reports</p>
              <p className="text-gray-500 text-xs mt-1">Executive-ready documentation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
