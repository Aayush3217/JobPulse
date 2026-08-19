import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Briefcase, Calendar, ChevronRight, SlidersHorizontal, X, ArrowUpDown, RefreshCcw, ExternalLink } from 'lucide-react';
import api from '../utils/api';
import { Hero3DBackground, TiltCard, ThreeDTagCloud } from '../components/ThreeDComponents';

const CATEGORIES = [
  'Software Development',
  'Marketing',
  'Design',
  'Product',
  'Sales',
  'Customer Service',
  'Other'
];

const JOB_TYPES = [
  { value: 'full-time', label: 'Full Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'part-time', label: 'Part Time' },
  { value: 'internship', label: 'Internship' }
];

function Home() {
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Telemetry statistics
  const [telemetry, setTelemetry] = useState(null);

  // Search state inputs (submitted on click "Search Jobs")
  const [keywordInput, setKeywordInput] = useState('');
  const [locationInput, setLocationInput] = useState('');

  // Active query parameters (triggering requests)
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [sort, setSort] = useState('publishedAt_desc');
  const [page, setPage] = useState(0);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Trigger search on submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setKeyword(keywordInput);
    setLocation(locationInput);
    setPage(0);
  };

  // Trigger search on floating 3D tag select
  const handleTagSelect = (tag) => {
    const cleanedTag = tag === 'NodeJS' ? 'Node' : tag;
    setKeywordInput(cleanedTag);
    setKeyword(cleanedTag);
    setPage(0);
  };

  // Fetch jobs when query triggers change
  useEffect(() => {
    fetchJobs();
  }, [keyword, location, selectedCategory, selectedType, sort, page]);

  // Fetch telemetry status
  useEffect(() => {
    fetchTelemetry();
  }, [jobs]);

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/jobs', {
        params: {
          keyword: keyword || undefined,
          location: location || undefined,
          category: selectedCategory || undefined,
          jobType: selectedType || undefined,
          sort,
          page,
          size: 10
        }
      });
      setJobs(response.data.data || []);
      setTotal(response.data.pagination?.total || 0);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Unable to load jobs. The job service is temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTelemetry = async () => {
    try {
      const [sourceRes, runsRes] = await Promise.all([
        api.get('/sources'),
        api.get('/ingestion/runs')
      ]);
      const adzunaSource = sourceRes.data.find(s => s.name === 'adzuna');
      const latestRuns = runsRes.data.slice(0, 3);
      setTelemetry({
        source: adzunaSource,
        runs: latestRuns
      });
    } catch (err) {
      console.error('Error fetching telemetry:', err);
    }
  };

  // Auto-fetch polling: if db is empty on startup, trigger ingestion and check every 3s for new listings
  useEffect(() => {
    let intervalId;
    if (!loading && jobs.length === 0 && !keyword && !location && !selectedCategory && !selectedType) {
      // Auto-trigger manual ingestion run
      const triggerAutoIngest = async () => {
        try {
          await api.post('/ingestion/run', { source: 'adzuna' });
        } catch (err) {
          console.log('Auto-ingestion already running or completed.');
        }
      };
      triggerAutoIngest();

      let attempts = 0;
      intervalId = setInterval(async () => {
        attempts++;
        if (attempts >= 6) {
          clearInterval(intervalId);
          return;
        }
        try {
          const response = await api.get('/jobs', {
            params: { page: 0, size: 10 }
          });
          if (response.data.data && response.data.data.length > 0) {
            setJobs(response.data.data);
            setTotal(response.data.pagination?.total || 0);
            clearInterval(intervalId);
          }
        } catch (err) {
          console.error('Error polling auto-ingestion:', err);
        }
      }, 3000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [jobs.length, loading]);

  const handleResetFilters = () => {
    setKeywordInput('');
    setLocationInput('');
    setKeyword('');
    setLocation('');
    setSelectedCategory('');
    setSelectedType('');
    setSort('publishedAt_desc');
    setPage(0);
  };

  const totalPages = Math.ceil(total / 10);

  const renderFiltersContent = () => (
    <div className="space-y-6">
      {/* Category Filter */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Category</h3>
        <div className="space-y-2">
          <button
            onClick={() => { setSelectedCategory(''); setPage(0); }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              selectedCategory === '' 
                ? 'bg-brand-600 text-white font-medium' 
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            All Categories
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => { setSelectedCategory(cat); setPage(0); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedCategory === cat 
                  ? 'bg-brand-600 text-white font-medium' 
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Job Type Filter */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Job Type</h3>
        <div className="space-y-2">
          <button
            onClick={() => { setSelectedType(''); setPage(0); }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              selectedType === '' 
                ? 'bg-brand-600 text-white font-medium' 
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            All Types
          </button>
          {JOB_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => { setSelectedType(t.value); setPage(0); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedType === t.value 
                  ? 'bg-brand-600 text-white font-medium' 
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* 3D Interactive Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-950/40 border border-slate-900 shadow-xl p-8 md:p-12">
        <Hero3DBackground />
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Left Column: Title, Subtitle, and Badges (3D typography) */}
          <div className="md:col-span-5 text-left space-y-5">
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-400 bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/20">
                JobPulse Aggregator
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold text-3d leading-tight uppercase pt-2">
                Find your next opportunity.
              </h1>
            </div>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed">
              Discover real job opportunities from trusted sources, all in one place. Click any floating tag to query live postings.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-900 text-slate-400 border border-slate-800">
                ⚡ Real-time Ingestion
              </span>
              <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-900 text-slate-400 border border-slate-800">
                🔒 Database Secured
              </span>
            </div>
          </div>

          {/* Middle Column: Interactive 3D Tag Cloud */}
          <div className="md:col-span-4 flex justify-center items-center">
            <ThreeDTagCloud onTagSelect={handleTagSelect} />
          </div>

          {/* Right Column: 3D Holographic Tilt Card */}
          <div className="md:col-span-3 flex justify-center items-center">
            <TiltCard className="relative group w-full max-w-[240px] aspect-[4/3] rounded-2xl overflow-hidden glass-panel border border-brand-500/30 p-2 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-t from-brand-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              <img 
                src="/job_search_hologram_3d.jpg" 
                alt="3D Hologram job aggregation"
                className="w-full h-full object-cover rounded-xl border border-slate-800/80 group-hover:scale-105 transition-transform duration-500"
              />
            </TiltCard>
          </div>
        </div>
      </div>

      {/* Search Submission Form */}
      <form onSubmit={handleSearchSubmit} className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center">
        {/* Search Keyword */}
        <div className="relative w-full flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            placeholder="Search jobs, skills, or companies..."
            className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all text-slate-100 placeholder-slate-500"
          />
          {keywordInput && (
            <button
              type="button"
              onClick={() => setKeywordInput('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Location */}
        <div className="relative w-full md:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <MapPin className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            placeholder="Delhi, Bangalore, Noida..."
            className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all text-slate-100 placeholder-slate-500"
          />
          {locationInput && (
            <button
              type="button"
              onClick={() => setLocationInput('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search button */}
        <button
          type="submit"
          className="w-full md:w-auto bg-brand-600 hover:bg-brand-500 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center space-x-2 shadow-lg shadow-brand-600/25"
        >
          <span>Search Jobs</span>
        </button>
      </form>

      {/* Filter Stats & Sorting Control */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-900 pb-4">
        <h2 className="text-xl font-bold text-slate-100">Latest Jobs</h2>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="md:hidden flex items-center space-x-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-800 text-slate-300"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
          </button>

          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
            <ArrowUpDown className="w-4 h-4 text-slate-400" />
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(0); }}
              className="bg-transparent border-none text-sm text-slate-300 focus:outline-none cursor-pointer pr-8"
            >
              <option value="publishedAt_desc">Newest</option>
              <option value="publishedAt_asc">Oldest</option>
              <option value="title_asc">Title A-Z</option>
              <option value="companyName_asc">Company A-Z</option>
            </select>
          </div>

          {(selectedCategory || selectedType || keyword || location) && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-brand-400 hover:text-brand-300 underline underline-offset-4"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Modern 3-Column Command-Center Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Sidebar Filters (3-cols) */}
        <aside className="hidden lg:block lg:col-span-3 glass-panel rounded-2xl p-6 h-fit self-start">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
            <h2 className="font-semibold text-lg">Filters</h2>
            <button 
              onClick={handleResetFilters}
              className="text-xs text-slate-400 hover:text-white"
            >
              Clear all
            </button>
          </div>
          {renderFiltersContent()}
        </aside>

        {/* Center Column: Jobs Listing Feed (6-cols) */}
        <section className="col-span-1 lg:col-span-6 space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">
              {loading ? 'Searching listings...' : `Showing ${jobs.length} of ${total} jobs`}
            </span>
          </div>

          {/* Error State */}
          {error && (
            <div className="glass-panel border-red-950 bg-red-950/15 rounded-2xl p-8 text-center space-y-4">
              <p className="text-red-400 text-sm font-medium">{error}</p>
              <p className="text-xs text-slate-400">Your previously collected jobs are still available.</p>
              <button
                onClick={fetchJobs}
                className="inline-flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                <RefreshCcw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
            </div>
          )}

          {/* Loading Skeletons */}
          {loading && !error && (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse glass-panel rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-6 bg-slate-800 rounded w-2/5"></div>
                    <div className="h-4 bg-slate-800 rounded w-16"></div>
                  </div>
                  <div className="h-4 bg-slate-800 rounded w-1/4"></div>
                  <div className="flex gap-4">
                    <div className="h-4 bg-slate-800 rounded w-24"></div>
                    <div className="h-4 bg-slate-800 rounded w-24"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State / Auto-fetching */}
          {!loading && jobs.length === 0 && !error && (
            <div className="glass-panel rounded-2xl p-12 text-center space-y-4">
              <div className="bg-slate-900 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto text-slate-500 animate-bounce">
                <Search className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg text-slate-200">
                  {!keyword && !location && !selectedCategory && !selectedType
                    ? 'Populating job board...' 
                    : 'No jobs found'}
                </h3>
                <p className="text-slate-400 text-sm max-w-sm mx-auto">
                  {!keyword && !location && !selectedCategory && !selectedType
                    ? 'The database is currently empty. We are pulling live listings from Adzuna now, please wait a moment...' 
                    : 'Try changing your search or filters.'}
                </p>
              </div>
              {(keyword || location || selectedCategory || selectedType) && (
                <button
                  onClick={handleResetFilters}
                  className="bg-brand-600 hover:bg-brand-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-brand-600/10"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* Jobs Listing Cards with 3D Tilt Card Wrapper */}
          {!loading && jobs.length > 0 && (
            <div className="space-y-4">
              {jobs.map((job) => (
                <TiltCard
                  key={job.id}
                  className="block glass-panel rounded-2xl p-6 glass-panel-hover cursor-pointer border border-slate-900/50"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                          {job.category || 'Job'}
                        </span>
                        {job.jobType && (
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 capitalize">
                            {job.jobType.replace('_', ' ')}
                          </span>
                        )}
                        <span className="text-xs text-slate-400 bg-slate-900 border border-slate-800/80 px-2.5 py-0.5 rounded font-medium">
                          Source: <span className="capitalize text-slate-200">{job.source}</span>
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-white">
                        {job.title}
                      </h2>
                      <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-sm text-slate-400">
                        <span className="font-medium text-slate-300">{job.companyName}</span>
                        {job.location && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                            <span>{job.location}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:flex-col sm:items-end gap-3 text-xs text-slate-500 self-stretch sm:self-auto border-t border-slate-900 sm:border-0 pt-4 sm:pt-0">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {job.publishedAt 
                            ? new Date(job.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                            : 'Recently'}
                        </span>
                      </div>
                      <Link
                        to={`/jobs/${job.id}`}
                        className="inline-flex items-center justify-center space-x-1 text-xs font-semibold bg-slate-800 hover:bg-brand-600 text-slate-200 hover:text-white px-4 py-2 rounded-xl transition-all shadow-sm"
                      >
                        <span>View Job</span>
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </TiltCard>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-900 pt-6">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>
              <div className="flex items-center space-x-1.5 text-sm text-slate-400">
                <span>Page</span>
                <span className="font-semibold text-slate-200">{page + 1}</span>
                <span>of</span>
                <span className="font-semibold text-slate-200">{totalPages}</span>
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          )}
        </section>

        {/* Right Column: Pipeline Telemetry Widget (3-cols) */}
        <aside className="hidden lg:block lg:col-span-3 space-y-6 self-start">
          {/* Health overview card */}
          <div className="glass-panel rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-900/60 pb-3">
              <h3 className="font-bold text-slate-100 flex items-center gap-2 text-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
                </span>
                Aggregator Status
              </h3>
              <Link to="/admin/ingestion" className="text-xs text-brand-400 hover:text-brand-300 font-medium">
                Admin
              </Link>
            </div>
            
            {telemetry?.source ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Status</span>
                  <span className="text-brand-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                    Healthy
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Indexed Count</span>
                  <span className="text-slate-200 font-mono font-semibold">{total} listings</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Last Synced</span>
                  <span className="text-slate-200 font-medium">
                    {telemetry.source.lastSuccessfulRun 
                      ? new Date(telemetry.source.lastSuccessfulRun).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
                      : 'Just now'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 py-2">
                Syncing system telemetry...
              </div>
            )}
          </div>
          
          {/* Sync logs card */}
          <div className="glass-panel rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Sync Telemetry Log</h4>
            <div className="space-y-2">
              {telemetry?.runs && telemetry.runs.length > 0 ? (
                telemetry.runs.map((run) => (
                  <div key={run.id} className="flex justify-between items-center text-[11px] bg-slate-950/45 p-2 rounded-lg border border-slate-900/50">
                    <span className="text-slate-400 font-mono">
                      {new Date(run.startedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className={`font-semibold ${run.status === 'SUCCESS' ? 'text-brand-400' : 'text-red-400'}`}>
                      {run.status === 'SUCCESS' ? `+${run.jobsInserted} jobs` : 'Failed'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-[11px] text-slate-500 py-1">No execution logs found.</div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Adzuna Attribution Link Footer Section */}
      <div className="border-t border-slate-900 pt-8 mt-12 flex justify-center items-center">
        <a 
          href="https://www.adzuna.com" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="inline-flex items-center space-x-2 text-xs text-slate-500 hover:text-brand-400 transition-colors"
        >
          <span>Jobs by Adzuna</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex lg:hidden bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm ml-auto bg-slate-900 h-full flex flex-col shadow-2xl border-l border-slate-800">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 className="font-bold text-lg">Filters</h2>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="p-2 -mr-2 text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {renderFiltersContent()}
            </div>
            <div className="p-6 border-t border-slate-800 bg-slate-900/80 flex gap-4">
              <button
                onClick={handleResetFilters}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl text-sm font-semibold"
              >
                Clear All
              </button>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="flex-1 bg-brand-600 hover:bg-brand-500 text-white py-3 rounded-xl text-sm font-semibold shadow-lg shadow-brand-600/10"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
