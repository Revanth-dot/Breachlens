import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { scanAPI } from '../services/api';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, LineChart, Line,
} from 'recharts';

const SEVERITY_COLORS = { Critical: '#ef4444', High: '#f97316', Medium: '#eab308', Low: '#22c55e' };
const RADIAN = Math.PI / 180;

function CustomPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  const radius = outerRadius + 20;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#94a3b8" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={11}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

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

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await scanAPI.getDashboardStats();
      setStats(res.data);
    } catch (err) {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <div className="text-center">
          <div className="spinner mx-auto mb-4 w-8 h-8"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <div className="text-center glass rounded-2xl p-8 max-w-md">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={loadStats} className="btn-primary">Retry</button>
        </div>
      </div>
    );
  }

  const severityData = Object.entries(stats?.severity_breakdown || {}).map(([name, value]) => ({
    name,
    value,
    color: SEVERITY_COLORS[name] || '#64748b',
  }));

  const vulnDistData = Object.entries(stats?.vulnerability_distribution || {}).map(([name, value]) => ({
    name: name.length > 20 ? name.substring(0, 20) + '...' : name,
    value,
  }));

  const trendData = stats?.risk_trend || [];

  const posture = stats?.security_posture;
  const compliance = stats?.compliance;
  const postureScore = posture?.score || 0;
  const postureRating = posture?.rating || 'N/A';
  const postureColor = postureScore >= 70 ? 'text-green-400' : postureScore >= 40 ? 'text-orange-400' : 'text-red-400';

  const cards = [
    {
      label: 'Total Scans',
      value: stats?.total_scans || 0,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'text-cyber-blue',
      bg: 'bg-cyber-blue/10',
    },
    {
      label: 'Vulnerabilities Found',
      value: stats?.total_vulnerabilities || 0,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
      color: 'text-red-400',
      bg: 'bg-red-500/10',
    },
    {
      label: 'Security Posture',
      value: `${postureScore}`,
      suffix: `/100 · ${postureRating}`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      color: postureColor,
      bg: 'bg-cyber-card',
    },
    {
      label: 'Est. Financial Loss',
      value: stats?.total_financial_loss || '₹0',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
    },
  ];

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Welcome */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Welcome back, {user?.name || 'User'}
          </h1>
          <p className="text-gray-400 mt-1">Here's your security overview.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {cards.map((card, i) => (
            <div key={i} className="glass rounded-xl p-5 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center ${card.color}`}>
                  {card.icon}
                </div>
              </div>
              <p className="text-2xl font-bold text-white">
                {card.value}{card.suffix || ''}
              </p>
              <p className="text-gray-400 text-sm mt-1">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Severity Breakdown (Pie) */}
          <div className="glass rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Severity Breakdown</h2>
            {severityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={CustomPieLabel}
                  >
                    {severityData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-gray-500">
                No scans performed yet
              </div>
            )}
          </div>

          {/* Compliance Assessment */}
          <div className="glass rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Compliance Assessment</h2>
            {compliance ? (
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">OWASP Top 10</span>
                    <span className="text-indigo-400 font-mono">{Math.round(compliance.owasp)}%</span>
                  </div>
                  <div className="w-full bg-cyber-dark rounded-full h-3">
                    <div className="h-3 rounded-full bg-indigo-500 transition-all" style={{ width: `${compliance.owasp}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">GDPR Readiness</span>
                    <span className="text-green-400 font-mono">{Math.round(compliance.gdpr)}%</span>
                  </div>
                  <div className="w-full bg-cyber-dark rounded-full h-3">
                    <div className="h-3 rounded-full bg-green-500 transition-all" style={{ width: `${compliance.gdpr}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">ISO 27001 Readiness</span>
                    <span className="text-sky-400 font-mono">{Math.round(compliance.iso27001)}%</span>
                  </div>
                  <div className="w-full bg-cyber-dark rounded-full h-3">
                    <div className="h-3 rounded-full bg-sky-500 transition-all" style={{ width: `${compliance.iso27001}%` }}></div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 pt-2">
                  Estimated scores based on your discovered vulnerabilities.
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-gray-500">
                Complete a scan to see compliance data
              </div>
            )}
          </div>

          {/* Vulnerability Distribution (Bar) */}
          <div className="glass rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Vulnerability Distribution</h2>
            {vulnDistData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={vulnDistData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a5a" />
                  <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} width={140} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-gray-500">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Risk Trend */}
        <div className="glass rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Risk Trend</h2>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a5a" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{value}</span>}
                />
                <Line type="monotone" dataKey="risk_score" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1' }} name="Risk Score" />
                <Line type="monotone" dataKey="vulnerabilities" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316' }} name="Vulnerabilities" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-gray-500">
              Complete a scan to see risk trends
            </div>
          )}
        </div>

        {/* Recent Scans */}
        <div className="glass rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Scans</h2>
            <Link to="/scan" className="text-sm text-cyber-blue hover:underline">
              View All
            </Link>
          </div>
          {stats?.recent_scans?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cyber-border">
                    <th className="text-left py-3 px-2 text-gray-400 font-medium">URL</th>
                    <th className="text-center py-3 px-2 text-gray-400 font-medium">Vulnerabilities</th>
                    <th className="text-center py-3 px-2 text-gray-400 font-medium">Risk Score</th>
                    <th className="text-right py-3 px-2 text-gray-400 font-medium">Date</th>
                    <th className="text-right py-3 px-2 text-gray-400 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_scans.map((scan, i) => (
                    <tr key={scan.id} className="border-b border-cyber-border/30 hover:bg-white/5 transition-all">
                      <td className="py-3 px-2 text-white truncate max-w-[200px]">{scan.url}</td>
                      <td className="py-3 px-2 text-center text-gray-300">{scan.vulnerabilities}</td>
                      <td className="py-3 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          scan.risk_score >= 70 ? 'badge-critical' :
                          scan.risk_score >= 50 ? 'badge-high' :
                          scan.risk_score >= 30 ? 'badge-medium' : 'badge-low'
                        }`}>
                          {scan.risk_score}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right text-gray-400">{new Date(scan.created_at).toLocaleDateString()}</td>
                      <td className="py-3 px-2 text-right">
                        <Link to={`/scan-results/${scan.id}`} className="text-cyber-blue hover:underline text-xs">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10">
              <svg className="w-12 h-12 text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 mb-4">No scans performed yet</p>
              <Link to="/scan" className="btn-primary inline-flex">
                Start Your First Scan
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Link to="/scan" className="btn-primary inline-flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Start New Scan</span>
            </Link>
            <Link to="/reports" className="btn-secondary inline-flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>View Reports</span>
            </Link>
            <Link to="/executive" className="btn-secondary inline-flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Executive Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
