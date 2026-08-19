import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink } from 'react-router-dom';
import { Briefcase, Activity, Menu, X } from 'lucide-react';
import Home from './pages/Home';
import JobDetail from './pages/JobDetail';
import IngestionDashboard from './pages/IngestionDashboard';

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-[#010703] text-slate-100">
        {/* Navigation Bar */}
        <nav className="sticky top-0 z-50 glass-panel border-b border-slate-900/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo / Brand */}
              <Link to="/" className="flex items-center space-x-3 group">
                <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-brand-500/35 group-hover:border-brand-500/60 shadow-md group-hover:shadow-brand-500/10 transition-all">
                  <img 
                    src="/jobpulse_logo.jpg" 
                    alt="JobPulse logo"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-brand-400 bg-clip-text text-transparent">
                  JobPulse
                </span>
              </Link>

              {/* Desktop Nav Links */}
              <div className="hidden md:flex items-center space-x-6">
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `text-sm font-medium transition-colors hover:text-brand-400 ${
                      isActive ? 'text-brand-400 font-semibold' : 'text-slate-300'
                    }`
                  }
                >
                  Find Jobs
                </NavLink>
                <NavLink
                  to="/admin/ingestion"
                  className={({ isActive }) =>
                    `flex items-center space-x-1.5 text-sm font-medium transition-colors hover:text-brand-400 ${
                      isActive ? 'text-brand-400 font-semibold' : 'text-slate-300'
                    }`
                  }
                >
                  <Activity className="w-4 h-4" />
                  <span>Ingestion Dashboard</span>
                </NavLink>
              </div>

              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Nav Links */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-slate-800/60 bg-slate-950 px-2 pt-2 pb-4 space-y-1">
              <NavLink
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md text-base font-medium ${
                    isActive ? 'bg-slate-900 text-brand-400 font-semibold' : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`
                }
              >
                Find Jobs
              </NavLink>
              <NavLink
                to="/admin/ingestion"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md text-base font-medium ${
                    isActive ? 'bg-slate-900 text-brand-400 font-semibold' : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`
                }
              >
                Ingestion Dashboard
              </NavLink>
            </div>
          )}
        </nav>

        {/* Main Content Area */}
        <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/jobs/:id" element={<JobDetail />} />
            <Route path="/admin/ingestion" element={<IngestionDashboard />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-900/60 bg-[#010703]/90 py-6 text-center text-xs text-slate-500 mt-auto">
          <div className="max-w-7xl mx-auto px-4">
            <p>&copy; {new Date().getFullYear()} JobPulse Aggregator. Data parsed from public Adzuna Jobs Search API. Attributed to original authors.</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
