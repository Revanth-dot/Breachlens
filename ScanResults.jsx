import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { scanAPI, reportAPI } from '../services/api';

function SeverityBadge({ severity }) {
  const classes = {
    Critical: 'badge-critical',
    High: 'badge-high',
    Medium: 'badge-medium',
    Low: 'badge-low',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${classes[severity] || 'badge-low'}`}>
      {severity}
    </span>
  );
}

function RiskBadge({ score }) {
  let cls = 'badge-low';
  if (score >= 70) cls = 'badge-critical';
  else if (score >= 50) cls = 'badge-high';
  else if (score >= 30) cls = 'badge-medium';
  return <span className={`px-2 py-0.5 rounded text-xs font-mono ${cls}`}>{score}/100</span>;
}

function ProgressBar({ value, label, color }) {
  const barColor = color || (value >= 70 ? '#22c55e' : value >= 40 ? '#f97316' : '#ef4444');
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-300">{label}</span>
        <span className="text-white font-mono">{value}%</span>
      </div>
      <div className="w-full bg-cyber-dark rounded-full h-2.5">
        <div className="h-2.5 rounded-full transition-all duration-500" style={{ width: `${value}%`, backgroundColor: barColor }}></div>
      </div>
    </div>
  );
}

export default function ScanResults() {
  const { scanId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState('');

  useEffect(() => {
    loadScan();
  }, [scanId]);

  const loadScan = async () => {
    try {
      const res = await scanAPI.getScanEnhanced(scanId);
      setData(res.data);
    } catch (err) {
      setError('Failed to load scan results.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setReportLoading(true);
    setReportError('');
    try {
      const res = await reportAPI.generateReport(scanId);
      const dlRes = await reportAPI.downloadReport(res.data.id);
      const blob = new Blob([dlRes.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `breachlens_report_${scanId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setReportError('Failed to generate report. You can retry below.');
    } finally {
      setReportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <div className="text-center">
          <div className="spinner mx-auto mb-4 w-8 h-8"></div>
          <p className="text-gray-400">Loading scan results...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <div className="text-center glass rounded-2xl p-8 max-w-md">
          <p className="text-red-400 mb-4">{error || 'Scan not found'}</p>
          <Link to="/scan" className="btn-primary">Start New Scan</Link>
        </div>
      </div>
    );
  }

  const { scan, executive_summary, security_posture, compliance, breach_scenarios } = data;
  const stats = scan.stats;
  const results = scan.results || [];

  const postureScore = security_posture?.score || 0;
  const postureRating = security_posture?.rating || 'Unknown';
  const postureColor = postureScore >= 70 ? 'text-green-400' : postureScore >= 40 ? 'text-orange-400' : 'text-red-400';

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 animate-fade-in">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Scan Results</h1>
              <span className="px-3 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                {scan.status}
              </span>
            </div>
            <p className="text-gray-400 text-sm break-all">
              Target: <span className="text-gray-300 font-mono">{scan.url}</span>
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Scanned on {new Date(scan.created_at).toLocaleString()}
            </p>
          </div>
          <div className="flex gap-2 mt-4 sm:mt-0">
            <button onClick={handleGenerateReport} disabled={reportLoading} className="btn-primary">
              {reportLoading ? (
                <span className="flex items-center space-x-2">
                  <span className="spinner w-4 h-4"></span>
                  <span>Generating...</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span>Download PDF Report</span>
                </span>
              )}
            </button>
          </div>
        </div>

        {reportError && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-4">
            {reportError}
          </div>
        )}

        {/* ── EXECUTIVE SUMMARY ── */}
        {executive_summary && (
          <div className="glass rounded-xl p-6 mb-6 animate-fade-in glow-purple">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-white">Executive Summary</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-cyber-card/50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Target</p>
                <p className="text-sm text-white font-mono truncate">{scan.url.replace(/https?:\/\//, '')}</p>
              </div>
              <div className="bg-cyber-card/50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Overall Risk</p>
                <p className="text-lg font-bold text-white">{executive_summary.overall_risk_score?.toFixed(1)}/100</p>
              </div>
              <div className="bg-cyber-card/50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Risk Level</p>
                <p className={`text-lg font-bold ${
                  executive_summary.risk_level === 'Critical' ? 'text-red-400' :
                  executive_summary.risk_level === 'High' ? 'text-orange-400' :
                  executive_summary.risk_level === 'Moderate' ? 'text-yellow-400' : 'text-green-400'
                }`}>{executive_summary.risk_level}</p>
              </div>
              <div className="bg-cyber-card/50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">Financial Exposure</p>
                <p className="text-lg font-bold text-yellow-400">{executive_summary.estimated_financial_exposure}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {executive_summary.critical_count > 0 && (
                <span className="px-3 py-1 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-500/30">
                  {executive_summary.critical_count} Critical
                </span>
              )}
              {executive_summary.high_count > 0 && (
                <span className="px-3 py-1 rounded-full text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  {executive_summary.high_count} High
                </span>
              )}
              {executive_summary.medium_count > 0 && (
                <span className="px-3 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                  {executive_summary.medium_count} Medium
                </span>
              )}
              {executive_summary.low_count > 0 && (
                <span className="px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30">
                  {executive_summary.low_count} Low
                </span>
              )}
              <span className="px-3 py-1 rounded-full text-xs bg-cyber-card text-gray-300">
                {executive_summary.total_vulnerabilities} Total
              </span>
            </div>

            <div className="mt-3 p-4 bg-cyber-dark rounded-lg border border-cyber-border">
              <p className="text-xs text-gray-500 mb-1">Priority Action</p>
              <p className="text-sm text-cyber-blue font-medium">{executive_summary.priority_action}</p>
            </div>
          </div>
        )}

        {/* ── SECURITY POSTURE + COMPLIANCE ── */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Security Posture */}
          <div className="glass rounded-xl p-6 animate-fade-in">
            <h2 className="text-lg font-semibold text-white mb-4">Security Posture</h2>
            <div className="text-center mb-4">
              <div className="relative w-28 h-28 mx-auto">
                <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="#2a2a5a" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke={postureScore >= 70 ? '#22c55e' : postureScore >= 40 ? '#f97316' : '#ef4444'}
                    strokeWidth="3" strokeDasharray={`${postureScore}, 100`} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-2xl font-bold ${postureColor}`}>{postureScore}</span>
                </div>
              </div>
              <p className={`text-lg font-semibold mt-2 ${postureColor}`}>{postureRating}</p>
              <p className="text-gray-400 text-sm mt-1">{security_posture?.reason || ''}</p>
            </div>
          </div>

          {/* Compliance */}
          {compliance && (
            <div className="glass rounded-xl p-6 animate-fade-in">
              <h2 className="text-lg font-semibold text-white mb-4">Compliance Assessment</h2>
              <ProgressBar value={Math.round(compliance.owasp)} label="OWASP Top 10" color="#6366f1" />
              <ProgressBar value={Math.round(compliance.gdpr)} label="GDPR Readiness" color="#22c55e" />
              <ProgressBar value={Math.round(compliance.iso27001)} label="ISO 27001 Readiness" color="#0ea5e9" />
              <div className="mt-3 text-xs text-gray-500">
                Estimated compliance scores based on discovered vulnerabilities.
              </div>
            </div>
          )}
        </div>

        {/* ── BREACH SCENARIOS ── */}
        {breach_scenarios && breach_scenarios.length > 0 && (
          <div className="glass rounded-xl p-6 mb-6 animate-fade-in">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-white">Breach Scenario Analysis</h2>
            </div>

            <div className="grid gap-4">
              {breach_scenarios.map((bs, i) => (
                <div key={i} className="bg-cyber-card/50 rounded-lg p-4 border border-cyber-border/50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-medium flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 text-xs flex items-center justify-center font-bold">
                        {i + 1}
                      </span>
                      <span>{bs.vulnerability}</span>
                    </h3>
                    <div className="flex items-center space-x-2">
                      <SeverityBadge severity={bs.severity} />
                      <RiskBadge score={bs.risk_score} />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    {bs.attack_path?.map((step, si) => (
                      <span key={si} className="flex items-center space-x-1">
                        <span className="px-2 py-0.5 rounded text-xs bg-cyber-dark text-gray-300 border border-cyber-border">
                          {step}
                        </span>
                        {si < bs.attack_path.length - 1 && (
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        )}
                      </span>
                    ))}
                  </div>

                  <p className="text-sm text-gray-400 mb-1">{bs.business_impact}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-yellow-400 font-mono">{bs.estimated_financial_impact}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      bs.risk_level === 'Critical' ? 'bg-red-500/20 text-red-400' :
                      bs.risk_level === 'High' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {bs.risk_level} Risk
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SUMMARY CARDS ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 animate-fade-in">
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{stats.total_vulnerabilities}</p>
            <p className="text-xs text-gray-400 mt-1">Vulnerabilities</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-orange-400">{stats.average_risk_score}</p>
            <p className="text-xs text-gray-400 mt-1">Risk Score</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-lg font-bold text-white">{stats.total_financial_loss}</p>
            <p className="text-xs text-gray-400 mt-1">Est. Financial Loss</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-lg font-bold text-green-400">{stats.total_fix_cost}</p>
            <p className="text-xs text-gray-400 mt-1">Total Fix Cost</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <div className="flex items-center justify-center space-x-2">
              <div className="flex -space-x-1">
                {stats.critical_count > 0 && <div className="w-3 h-3 rounded-full bg-red-500 border border-cyber-dark"></div>}
                {stats.high_count > 0 && <div className="w-3 h-3 rounded-full bg-orange-500 border border-cyber-dark"></div>}
                {stats.medium_count > 0 && <div className="w-3 h-3 rounded-full bg-yellow-500 border border-cyber-dark"></div>}
                {stats.low_count > 0 && <div className="w-3 h-3 rounded-full bg-green-500 border border-cyber-dark"></div>}
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              <span className="text-red-400">{stats.critical_count}</span> C ·
              <span className="text-orange-400">{stats.high_count}</span> H ·
              <span className="text-yellow-400">{stats.medium_count}</span> M ·
              <span className="text-green-400">{stats.low_count}</span> L
            </p>
          </div>
        </div>

        {/* ── VULNERABILITY TABLE ── */}
        <div className="glass rounded-xl overflow-hidden animate-fade-in">
          <div className="p-6 border-b border-cyber-border">
            <h2 className="text-lg font-semibold text-white">Vulnerability Details</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cyber-border bg-cyber-card/50">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Type</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">Severity</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">Risk Score</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">Breach Prob.</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">Financial Loss</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">Fix Cost</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {results.map((vuln, i) => (
                  <tr key={i} className="border-b border-cyber-border/30 hover:bg-white/5 transition-all">
                    <td className="py-3 px-4 text-white font-medium">{vuln.type}</td>
                    <td className="py-3 px-4 text-center"><SeverityBadge severity={vuln.severity} /></td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-mono font-bold ${
                        vuln.risk_score >= 70 ? 'text-red-400' :
                        vuln.risk_score >= 50 ? 'text-orange-400' :
                        vuln.risk_score >= 30 ? 'text-yellow-400' : 'text-green-400'
                      }`}>{vuln.risk_score}</span>
                    </td>
                    <td className="py-3 px-4 text-center text-gray-300">{vuln.breach_probability}</td>
                    <td className="py-3 px-4 text-center text-yellow-400 font-mono">{vuln.financial_loss}</td>
                    <td className="py-3 px-4 text-center text-gray-300 font-mono">{vuln.fix_cost}</td>
                    <td className="py-3 px-4 text-gray-400 text-xs max-w-[200px]">{vuln.recommendation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── DETAIL CARDS ── */}
        <div className="mt-6 space-y-4">
          {results.map((vuln, i) => (
            <div key={i} className="glass rounded-xl p-6 animate-fade-in">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-white font-semibold">{vuln.type}</h3>
                  <p className="text-gray-400 text-sm mt-1">{vuln.description}</p>
                </div>
                <SeverityBadge severity={vuln.severity} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 p-4 bg-cyber-card/50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500">Risk Score</p>
                  <p className="text-sm font-bold text-white">{vuln.risk_score}/100</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Breach Probability</p>
                  <p className="text-sm font-bold text-orange-400">{vuln.breach_probability}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Financial Loss</p>
                  <p className="text-sm font-bold text-yellow-400">{vuln.financial_loss}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Fix Cost</p>
                  <p className="text-sm font-bold text-green-400">{vuln.fix_cost}</p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-xs text-gray-500">Recommendation</p>
                <p className="text-sm text-cyber-blue">{vuln.recommendation}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── ACTIONS ── */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/scan" className="btn-primary">
            <span className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>New Scan</span>
            </span>
          </Link>
          <Link to="/dashboard" className="btn-secondary">Back to Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
