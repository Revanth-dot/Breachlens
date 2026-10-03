import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportAPI } from '../services/api';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const res = await reportAPI.getReports();
      setReports(res.data);
    } catch (err) {
      setError('Failed to load reports.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (reportId) => {
    setDownloading(reportId);
    try {
      const res = await reportAPI.downloadReport(reportId);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `breachlens_report_${reportId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to download report.');
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <div className="text-center">
          <div className="spinner mx-auto mb-4 w-8 h-8"></div>
          <p className="text-gray-400">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Security Reports</h1>
            <p className="text-gray-400 mt-1">Download and manage your PDF security reports.</p>
          </div>
          <Link to="/scan" className="btn-primary mt-4 sm:mt-0">
            <span className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>New Scan</span>
            </span>
          </Link>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-4">
            {error}
          </div>
        )}

        {/* Reports Grid */}
        {reports.length > 0 ? (
          <div className="grid gap-4">
            {reports.map((report, i) => (
              <div key={report.id} className="glass rounded-xl p-6 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start space-x-4">
                    {/* PDF Icon */}
                    <div className="w-12 h-14 flex-shrink-0 gradient-primary rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">
                        Security Report — {report.scan_url}
                      </h3>
                      <p className="text-gray-400 text-sm mt-1">
                        Generated on {new Date(report.created_at).toLocaleString()}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="px-2 py-0.5 rounded text-xs bg-cyber-card text-gray-300">
                          {report.summary?.total_vulnerabilities || 0} vulnerabilities
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs bg-cyber-card text-gray-300">
                          Risk: {report.summary?.average_risk_score || 0}/100
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs bg-cyber-card text-yellow-400">
                          Loss: {report.summary?.total_financial_loss || '₹0'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs bg-cyber-card text-green-400">
                          Fix: {report.summary?.total_fix_cost || '₹0'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(report.id)}
                    disabled={downloading === report.id}
                    className="btn-primary whitespace-nowrap"
                  >
                    {downloading === report.id ? (
                      <span className="flex items-center space-x-2">
                        <span className="spinner w-4 h-4"></span>
                        <span>Downloading...</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Download PDF</span>
                      </span>
                    )}
                  </button>
                </div>

                {/* Severity Summary */}
                <div className="mt-4 flex items-center space-x-4 text-xs">
                  {report.summary?.critical_count > 0 && (
                    <span className="text-red-400">{report.summary.critical_count} Critical</span>
                  )}
                  {report.summary?.high_count > 0 && (
                    <span className="text-orange-400">{report.summary.high_count} High</span>
                  )}
                  {report.summary?.medium_count > 0 && (
                    <span className="text-yellow-400">{report.summary.medium_count} Medium</span>
                  )}
                  {report.summary?.low_count > 0 && (
                    <span className="text-green-400">{report.summary.low_count} Low</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass rounded-xl p-12 text-center animate-fade-in">
            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-semibold text-white mb-2">No Reports Yet</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Complete a security scan first, then generate and download PDF reports from here.
            </p>
            <Link to="/scan" className="btn-primary">
              Start a Scan
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
