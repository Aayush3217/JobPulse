import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Briefcase, Calendar, ExternalLink, RefreshCcw } from 'lucide-react';
import api from '../utils/api';

function JobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchJobDetails();
  }, [id]);

  const fetchJobDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/jobs/${id}`);
      setJob(response.data);
    } catch (err) {
      console.error('Error fetching job details:', err);
      if (err.response && err.response.status === 404) {
        setError('Job not found.');
      } else {
        setError('Failed to fetch job details. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Back Button */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to job listings</span>
        </Link>
      </div>

      {/* Error state */}
      {error && (
        <div className="glass-panel border-red-900/50 bg-red-950/20 rounded-2xl p-8 text-center space-y-4">
          <p className="text-red-400 font-medium">{error}</p>
          <button
            onClick={fetchJobDetails}
            className="inline-flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !error && (
        <div className="animate-pulse space-y-6">
          <div className="glass-panel rounded-2xl p-6 md:p-8 space-y-4">
            <div className="h-6 bg-slate-800 rounded w-1/4"></div>
            <div className="h-8 bg-slate-800 rounded w-3/4"></div>
            <div className="h-4 bg-slate-800 rounded w-1/2"></div>
          </div>
          <div className="glass-panel rounded-2xl p-6 md:p-8 space-y-4">
            <div className="h-4 bg-slate-800 rounded w-full"></div>
            <div className="h-4 bg-slate-800 rounded w-full"></div>
            <div className="h-4 bg-slate-800 rounded w-3/4"></div>
          </div>
        </div>
      )}

      {/* Job Details Card */}
      {!loading && job && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="glass-panel rounded-2xl p-6 md:p-8 space-y-6 relative overflow-hidden">
            {/* Visual background accent glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  {job.category || 'Job'}
                </span>
                {job.jobType && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">
                    {job.jobType}
                  </span>
                )}
                <span className="text-xs text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                  source: {job.source}
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
                {job.title}
              </h1>

              <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-slate-300 border-t border-slate-800/60 pt-4">
                <div className="flex items-center space-x-1.5">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  <span className="font-semibold text-white">{job.companyName}</span>
                </div>
                {job.location && (
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{job.location}</span>
                  </div>
                )}
                <div className="flex items-center space-x-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>
                    Posted:{' '}
                    {job.publishedAt
                      ? new Date(job.publishedAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'Recently'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4 border-t border-slate-800/60 pt-6">
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center space-x-2 bg-brand-600 hover:bg-brand-500 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-brand-600/20"
              >
                <span>View Original Job</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Description Section */}
          <div className="glass-panel rounded-2xl p-6 md:p-8 space-y-6">
            <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
              Job Description
            </h2>
            <div
              className="prose prose-invert max-w-none text-slate-300 leading-relaxed text-sm md:text-base space-y-4
                prose-headings:text-white prose-a:text-brand-400 hover:prose-a:text-brand-300
                prose-ul:list-disc prose-ul:pl-5 prose-ol:list-decimal prose-ol:pl-5"
              dangerouslySetInnerHTML={{ __html: job.description || 'No description available.' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default JobDetail;
