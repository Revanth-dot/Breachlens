import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const features = [
  {
    icon: (
      <svg className="w-8 h-8 text-cyber-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'Automated Scanning',
    description: 'AI-powered crawler that automatically discovers and analyzes your web application endpoints, forms, and APIs.',
  },
  {
    icon: (
      <svg className="w-8 h-8 text-cyber-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
    title: 'Vulnerability Detection',
    description: 'Identifies SQL Injection, XSS, CSRF, IDOR, missing security headers, and authentication weaknesses.',
  },
  {
    icon: (
      <svg className="w-8 h-8 text-cyber-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    title: 'Risk Intelligence',
    description: 'Advanced risk scoring engine calculates breach probability, financial loss estimates, and remediation costs.',
  },
  {
    icon: (
      <svg className="w-8 h-8 text-cyber-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'Executive Reports',
    description: 'Generate professional PDF reports with business-friendly risk analysis and actionable recommendations.',
  },
];

const benefits = [
  'Reduce breach risk by up to 85%',
  'Save ₹5-50L per security incident',
  'Compliance-ready reports (ISO 27001, GDPR)',
  'Continuous monitoring & alerting',
  'Zero infrastructure setup required',
  'Enterprise-grade security analysis',
];

const steps = [
  { number: '01', title: 'Enter URL', desc: 'Simply enter your website URL to begin scanning.' },
  { number: '02', title: 'AI Scans', desc: 'Our engine crawls, discovers endpoints, and detects vulnerabilities.' },
  { number: '03', title: 'Risk Analysis', desc: 'Get risk scores, financial impact, and breach probabilities.' },
  { number: '04', title: 'Executive Report', desc: 'Download comprehensive PDF reports for stakeholders.' },
];

export default function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen">
      {/* ── Hero Section ── */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyber-blue/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center px-4 py-1.5 mb-6 glass rounded-full text-sm text-cyber-blue">
            <span className="w-2 h-2 bg-cyber-blue rounded-full animate-pulse-glow mr-2"></span>
            Next-Gen Security Intelligence Platform
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-6">
            Transform Security Vulnerabilities into{' '}
            <span className="gradient-primary bg-clip-text text-transparent">Business Intelligence</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            BreachLens combines automated penetration testing with executive risk intelligence — 
            detecting vulnerabilities, calculating financial impact, and delivering actionable reports 
            in minutes, not days.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isAuthenticated ? (
              <Link to="/scan" className="btn-primary text-lg px-8 py-4 glow-blue">
                Start New Scan
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn-primary text-lg px-8 py-4 glow-blue">
                  Start Free Scan
                </Link>
                <Link to="/login" className="btn-secondary text-lg px-8 py-4">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="py-24 px-4" id="features">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Enterprise-Grade <span className="text-cyber-blue">Security Suite</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Everything you need to identify, assess, and report on web application vulnerabilities.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="glass rounded-xl p-6 hover:border-cyber-blue/30 transition-all duration-300 group">
                <div className="w-14 h-14 rounded-xl bg-cyber-blue/10 flex items-center justify-center mb-4 group-hover:bg-cyber-blue/20 transition-all">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits Section ── */}
      <section className="py-24 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-500/5 to-transparent"></div>
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Why <span className="text-cyber-blue">BreachLens</span>?
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Join leading organizations that trust BreachLens for their security assessment needs.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {benefits.map((benefit, i) => (
              <div key={i} className="glass-light rounded-lg p-4 flex items-center space-x-3">
                <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-300 text-sm">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-24 px-4" id="how-it-works">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How It <span className="text-cyber-blue">Works</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Four simple steps to comprehensive security intelligence.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">
                  {step.number}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-gray-400 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact / CTA ── */}
      <section className="py-24 px-4" id="contact">
        <div className="max-w-3xl mx-auto text-center glass rounded-2xl p-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Secure Your <span className="text-cyber-blue">Applications</span>?
          </h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Start scanning your web applications today. No credit card required.
          </p>
          {isAuthenticated ? (
            <Link to="/scan" className="btn-primary text-lg px-8 py-4 glow-blue">
              Launch Scanner
            </Link>
          ) : (
            <Link to="/register" className="btn-primary text-lg px-8 py-4 glow-blue">
              Get Started Free
            </Link>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-4 border-t border-cyber-border/30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <div className="w-6 h-6 gradient-primary rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">BL</span>
            </div>
            <span className="text-gray-400 text-sm">BreachLens — Security Risk Intelligence</span>
          </div>
          <p className="text-gray-600 text-xs">© 2026 BreachLens. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
