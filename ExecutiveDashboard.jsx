import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { scanAPI } from '../services/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const SEVERITY_COLORS = { Critical: '#ef4444', High: '#f97316', Medium: '#eab308', Low: '#22c55e' };

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-lg p-3 text-sm border border-cyber-border">
        <p className="text-white font-medium mb-1">{label || payload[0].name}</p>
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.color || '#94a3b8' }}>
            {entry.name}: <span className="font-semibold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default function ExecutiveDashboard() {
  const [stats, setStats] = useState(null);
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, scansRes] = await Promise.all([
        scanAPI.getDashboardStats(),
        scanAPI.getScans(),
      ]);
      setStats(statsRes.data);
      setScans(scansRes.data);
    } catch (err) {
      setError('Failed to load executive data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <div className="text-center">
          <div className="spinner mx-auto mb-4 w-8 h-8"></div>
          <p className="text-gray-400">Loading executive dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <div className="text-center glass rounded-2xl p-8 max-w-md">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={loadData} className="btn-primary">Retry</button>
        </div>
      </div>
    );
  }

  // Calculate executive metrics
  const totalScans = stats?.total_scans || 0;
  const totalVulns = stats?.total_vulnerabilities || 0;
  const avgRisk = stats?.average_risk_score || 0;
  const totalLoss = stats?.total_financial_loss || '₹0';

  // Security score (inverse of risk, 100 - avg risk)
  const securityScore = Math.max(0, Math.min(100, Math.round(100 - avgRisk)));
  // Business impact score
  const businessImpactScore = totalScans > 0 ? Math.min(100, Math.round((totalVulns / Math.max(totalScans, 1)) * 10)) : 0;
  // Financial risk
  const financialRisk = avgRisk;

  // Remediation budget estimate
  let remediationBudget = '₹0';
  if (stats?.severity_breakdown) {
    const critical = stats.severity_breakdown.Critical || 0;
    const high = stats.severity_breakdown.High || 0;
    const medium = stats.severity_breakdown.Medium || 0;
    const low = stats.severity_breakdown.Low || 0;
    const total = (critical * 100000) + (high * 50000) + (medium * 20000) + (low * 5000);
    if (total >= 10000000) {
      remediationBudget = `₹${(total / 10000000).toFixed(1)}Cr`;
    } else if (total >= 100000) {
      remediationBudget = `₹${(total / 100000).toFixed(1)}L`;
    } else {
      remediationBudget = `₹${total.toLocaleString('en-IN')}`;
    }
  }

  // Generate executive summary
  const getExecutiveSummary = () => {
    const criticalCount = stats?.severity_breakdown?.Critical || 0;
    const highCount = stats?.severity_breakdown?.High || 0;

    if (criticalCount > 0) {
      return `Critical security vulnerabilities detected. Your organization faces immediate risk of data breach with estimated financial exposure of ${totalLoss}. Critical vulnerabilities including SQL Injection and Authentication weaknesses could expose sensitive customer information and may result in significant financial loss, regulatory penalties, and reputational damage. Immediate remediation is strongly recommended.`;
    }
    if (highCount > 0) {
      return `Significant security weaknesses identified across your web applications. These vulnerabilities could expose sensitive customer information and intellectual property, potentially resulting in substantial financial loss estimated at ${totalLoss}. Prompt remediation within 2-4 weeks is recommended.`;
    }
    if (totalVulns > 0) {
      return `Your security posture is moderate with ${totalVulns} identified vulnerabilities. While no critical threats were detected, addressing these issues within the standard patch cycle will help maintain compliance and reduce overall risk exposure.`;
    }
    return `No vulnerabilities detected. Your application demonstrates good security practices. Continue regular scanning to maintain this security posture.`;
  };

  // Executive summary bullet points
  const getRiskFactors = () => {
    const factors = [];
    if (avgRisk >= 70) factors.push({ label: 'Risk Level', value: 'Critical', color: 'text-red-400' });
    else if (avgRisk >= 50) factors.push({ label: 'Risk Level', value: 'High', color: 'text-orange-400' });
    else if (avgRisk >= 30) factors.push({ label: 'Risk Level', value: 'Medium', color: 'text-yellow-400' });
    else factors.push({ label: 'Risk Level', value: 'Low', color: 'text-green-400' });

    const criticalCount = stats?.severity_breakdown?.Critical || 0;
    const highCount = stats?.severity_breakdown?.High || 0;
    factors.push({ label: 'Critical Items', value: criticalCount, color: 'text-red-400' });
    factors.push({ label: 'High Severity', value: highCount, color: 'text-orange-400' });
    factors.push({ label: 'Financial Exposure', value: totalLoss, color: 'text-yellow-400' });

    return factors;
  };

  // Severity data for chart
  const severityData = Object.entries(stats?.severity_breakdown || {}).map(([name, value]) => ({
    name,
    value,
    color: SEVERITY_COLORS[name] || '#64748b',
  }));

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Executive Dashboard</h1>
          </div>
          <p className="text-gray-400">Business-level security risk intelligence for stakeholders.</p>
        </div>

        {/* Executive Summary Card */}
        <div className="glass rounded-xl p-6 mb-8 animate-fade-in glow-purple">
          <h2 className="text-lg font-semibold text-white mb-3">Executive Summary</h2>
          <p className="text-gray-300 leading-relaxed">{getExecutiveSummary()}</p>
          <div className="flex flex-wrap gap-4 mt-4">
            {getRiskFactors().map((f, i) => (
              <div key={i} className="px-4 py-2 bg-cyber-card/50 rounded-lg">
                <p className="text-xs text-gray-500">{f.label}</p>
                <p className={`text-sm font-bold ${f.color}`}>{f.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Security Score */}
          <div className="glass rounded-xl p-5 text-center animate-fade-in">
            <div className="relative w-20 h-20 mx-auto mb-3">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#2a2a5a" strokeWidth="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#22c55e" strokeWidth="3"
                  strokeDasharray={`${securityScore}, 100`} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{securityScore}</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm">Security Score</p>
            <p className="text-gray-500 text-xs">out of 100</p>
          </div>

          <div className="glass rounded-xl p-5 text-center animate-fade-in">
            <div className="w-14 h-14 rounded-xl bg-orange-500/10 flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl font-bold text-orange-400">{businessImpactScore}</span>
            </div>
            <p className="text-gray-400 text-sm">Business Impact</p>
            <p className="text-gray-500 text-xs">score out of 100</p>
          </div>

          <div className="glass rounded-xl p-5 text-center animate-fade-in">
            <div className="w-14 h-14 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto mb-3">
              <span className="text-lg font-bold text-red-400">{avgRisk}</span>
            </div>
            <p className="text-gray-400 text-sm">Financial Risk</p>
            <p className="text-gray-500 text-xs">score out of 100</p>
          </div>

          <div className="glass rounded-xl p-5 text-center animate-fade-in">
            <div className="w-14 h-14 rounded-xl bg-cyber-blue/10 flex items-center justify-center mx-auto mb-3">
              <span className="text-lg font-bold text-cyber-blue">{remediationBudget}</span>
            </div>
            <p className="text-gray-400 text-sm">Remediation Budget</p>
            <p className="text-gray-500 text-xs">estimated cost</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Severity Distribution */}
          <div className="glass rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Vulnerability Severity Distribution</h2>
            {severityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {severityData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">No data</div>
            )}
          </div>

          {/* Risk by Scan */}
          <div className="glass rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Risk Score by Scan</h2>
            {scans.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={scans.map(s => ({
                  name: s.url.replace(/https?:\/\//, '').substring(0, 20),
                  risk: s.stats?.average_risk_score || 0,
                })).slice(-10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a5a" />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="risk" fill="#6366f1" radius={[4, 4, 0, 0]} name="Risk Score" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">No scans yet</div>
            )}
          </div>
        </div>

        {/* Business Impact Table */}
        <div className="glass rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Business Impact Analysis</h2>
          {scans.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cyber-border">
                    <th className="text-left py-3 px-2 text-gray-400 font-medium">Target URL</th>
                    <th className="text-center py-3 px-2 text-gray-400 font-medium">Vulnerabilities</th>
                    <th className="text-center py-3 px-2 text-gray-400 font-medium">Avg Risk Score</th>
                    <th className="text-center py-3 px-2 text-gray-400 font-medium">Financial Loss</th>
                    <th className="text-center py-3 px-2 text-gray-400 font-medium">Fix Cost</th>
                    <th className="text-center py-3 px-2 text-gray-400 font-medium">Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {scans.map((s, i) => (
                    <tr key={s.id} className="border-b border-cyber-border/30 hover:bg-white/5 transition-all">
                      <td className="py-3 px-2 text-white truncate max-w-[180px]">{s.url}</td>
                      <td className="py-3 px-2 text-center text-gray-300">{s.stats?.total_vulnerabilities || 0}</td>
                      <td className="py-3 px-2 text-center">
                        <span className={`font-mono ${
                          (s.stats?.average_risk_score || 0) >= 70 ? 'text-red-400' :
                          (s.stats?.average_risk_score || 0) >= 50 ? 'text-orange-400' :
                          (s.stats?.average_risk_score || 0) >= 30 ? 'text-yellow-400' : 'text-green-400'
                        }`}>
                          {s.stats?.average_risk_score || 0}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center text-yellow-400">{s.stats?.total_financial_loss || '₹0'}</td>
                      <td className="py-3 px-2 text-center text-green-400">{s.stats?.total_fix_cost || '₹0'}</td>
                      <td className="py-3 px-2 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {(s.stats?.critical_count || 0) > 0 && <span className="w-2 h-2 rounded-full bg-red-500" title={`${s.stats?.critical_count} Critical`}></span>}
                          {(s.stats?.high_count || 0) > 0 && <span className="w-2 h-2 rounded-full bg-orange-500" title={`${s.stats?.high_count} High`}></span>}
                          {(s.stats?.medium_count || 0) > 0 && <span className="w-2 h-2 rounded-full bg-yellow-500" title={`${s.stats?.medium_count} Medium`}></span>}
                          {(s.stats?.low_count || 0) > 0 && <span className="w-2 h-2 rounded-full bg-green-500" title={`${s.stats?.low_count} Low`}></span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No scans performed yet</p>
              <Link to="/scan" className="btn-primary">Start Your First Scan</Link>
            </div>
          )}
        </div>

        {/* Recommendations */}
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Strategic Recommendations</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-red-500/5 rounded-lg border border-red-500/10">
              <h3 className="text-white font-medium mb-2 flex items-center space-x-2">
                <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                <span>Immediate (0-30 days)</span>
              </h3>
              <ul className="space-y-1.5">
                <li className="text-gray-400 text-sm flex items-start space-x-2">
                  <span className="text-red-400 mt-0.5">•</span>
                  <span>Patch critical SQL injection and XSS vulnerabilities</span>
                </li>
                <li className="text-gray-400 text-sm flex items-start space-x-2">
                  <span className="text-red-400 mt-0.5">•</span>
                  <span>Deploy Web Application Firewall (WAF)</span>
                </li>
                <li className="text-gray-400 text-sm flex items-start space-x-2">
                  <span className="text-red-400 mt-0.5">•</span>
                  <span>Enable multi-factor authentication</span>
                </li>
              </ul>
            </div>
            <div className="p-4 bg-orange-500/5 rounded-lg border border-orange-500/10">
              <h3 className="text-white font-medium mb-2 flex items-center space-x-2">
                <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                <span>Short-term (30-90 days)</span>
              </h3>
              <ul className="space-y-1.5">
                <li className="text-gray-400 text-sm flex items-start space-x-2">
                  <span className="text-orange-400 mt-0.5">•</span>
                  <span>Implement CSP and security headers</span>
                </li>
                <li className="text-gray-400 text-sm flex items-start space-x-2">
                  <span className="text-orange-400 mt-0.5">•</span>
                  <span>Fix access control and IDOR vulnerabilities</span>
                </li>
                <li className="text-gray-400 text-sm flex items-start space-x-2">
                  <span className="text-orange-400 mt-0.5">•</span>
                  <span>Set up automated scanning in CI/CD</span>
                </li>
              </ul>
            </div>
            <div className="p-4 bg-yellow-500/5 rounded-lg border border-yellow-500/10">
              <h3 className="text-white font-medium mb-2 flex items-center space-x-2">
                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                <span>Medium-term (90-180 days)</span>
              </h3>
              <ul className="space-y-1.5">
                <li className="text-gray-400 text-sm flex items-start space-x-2">
                  <span className="text-yellow-400 mt-0.5">•</span>
                  <span>Establish bug bounty program</span>
                </li>
                <li className="text-gray-400 text-sm flex items-start space-x-2">
                  <span className="text-yellow-400 mt-0.5">•</span>
                  <span>Conduct security awareness training</span>
                </li>
                <li className="text-gray-400 text-sm flex items-start space-x-2">
                  <span className="text-yellow-400 mt-0.5">•</span>
                  <span>Implement SDL practices</span>
                </li>
              </ul>
            </div>
            <div className="p-4 bg-green-500/5 rounded-lg border border-green-500/10">
              <h3 className="text-white font-medium mb-2 flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                <span>Long-term (180+ days)</span>
              </h3>
              <ul className="space-y-1.5">
                <li className="text-gray-400 text-sm flex items-start space-x-2">
                  <span className="text-green-400 mt-0.5">•</span>
                  <span>Schedule third-party penetration testing</span>
                </li>
                <li className="text-gray-400 text-sm flex items-start space-x-2">
                  <span className="text-green-400 mt-0.5">•</span>
                  <span>Achieve ISO 27001 certification</span>
                </li>
                <li className="text-gray-400 text-sm flex items-start space-x-2">
                  <span className="text-green-400 mt-0.5">•</span>
                  <span>Build dedicated security operations team</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
