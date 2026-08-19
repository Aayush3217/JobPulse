import React, { useState, useEffect } from 'react';
import { Play, Activity, CheckCircle, AlertTriangle, Clock, RefreshCw, Layers, Database } from 'lucide-react';
import api from '../utils/api';

function IngestionDashboard() {
  const [sources, setSources] = useState([]);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [triggerError, setTriggerError] = useState(null);
  const [triggerSuccess, setTriggerSuccess] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [sourcesRes, runsRes] = await Promise.all([
        api.get('/sources'),
        api.get('/ingestion/runs')
      ]);

      // Enrich sources with active health checks
      const enrichedSources = [];
      for (const src of sourcesRes.data) {
        try {
          const healthRes = await api.get(`/sources/${src.name}/health`);
          enrichedSources.push({ ...src, health: healthRes.data });
        } catch (e) {
          enrichedSources.push({ ...src, health: null });
        }
      }

      setSources(enrichedSources);
      setRuns(runsRes.data || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerIngestion = async (sourceName) => {
    setTriggering(true);
    setTriggerError(null);
    setTriggerSuccess(null);
    try {
      // Trigger a limit of 20 for development speed and safety
      const response = await api.post('/ingestion/run', {
        source: sourceName,
        limit: 20
      });
      setTriggerSuccess(response.data);
      // Refresh statistics after run
      await fetchDashboardData();
    } catch (err) {
      console.error('Error triggering ingestion:', err);
      const msg = err.response && err.response.data && err.response.data.error
        ? err.response.data.error
        : 'Failed to run ingestion. Please check backend logs.';
      setTriggerError(msg);
    } finally {
      setTriggering(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'SUCCESS':
      case 'HEALTHY':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'DEGRADED':
      case 'PARTIAL':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'FAILED':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'RUNNING':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getHealthStatusText = (source) => {
    if (!source.health) return 'Offline';
    if (source.health.circuitBreakerState === 'OPEN') return 'Suspended (Breaker Open)';
    if (source.health.status === 'DEGRADED') return 'Degraded';
    if (source.health.status === 'HEALTHY') return 'Healthy';
    return source.health.status || 'Active';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Ingestion Control Center</h1>
        <p className="text-slate-400 text-sm mt-1">
          Monitor aggregate pipelines, view source circuit breaker statuses, and run ingestion jobs manually.
        </p>
      </div>

      {/* Sources Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading && sources.length === 0 ? (
          <div className="animate-pulse glass-panel rounded-2xl p-6 h-48"></div>
        ) : sources.length === 0 ? (
          <div className="glass-panel rounded-2xl p-8 col-span-2 text-center text-slate-400 space-y-4">
            <p>No source adapter registered in the database yet. Run ingestion to initialize source registry.</p>
            <div className="flex justify-center">
              <button
                onClick={() => handleTriggerIngestion('adzuna')}
                disabled={triggering}
                className="bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center space-x-2 transition-all shadow-lg shadow-brand-600/10"
              >
                <Play className="w-4 h-4" />
                <span>Initialize Adzuna Source</span>
              </button>
            </div>
          </div>
        ) : (
          sources.map((src) => {
            const isDegraded = src.health?.status === 'DEGRADED' || src.health?.circuitBreakerState === 'OPEN';
            return (
              <div key={src.id} className="glass-panel rounded-2xl p-6 space-y-6 relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Job Source</span>
                    <h2 className="text-xl font-bold text-white capitalize">{src.name}</h2>
                    <p className="text-xs text-slate-400 font-mono truncate max-w-[250px] sm:max-w-sm">
                      {src.baseUrl}
                    </p>
                  </div>

                  {/* Status badge */}
                  <div className="flex items-center space-x-2">
                    <span className="glow-indicator">
                      <span className={`ping rounded-full ${isDegraded ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                      <span className={`dot rounded-full ${isDegraded ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                    </span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getStatusColor(isDegraded ? 'DEGRADED' : 'HEALTHY')}`}>
                      {getHealthStatusText(src)}
                    </span>
                  </div>
                </div>

                {/* Metrics stats */}
                <div className="grid grid-cols-3 gap-4 border-t border-slate-800/60 pt-4">
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500 font-medium">Fetched</span>
                    <div className="text-lg font-bold text-slate-200">{src.totalJobsFetched}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500 font-medium">Inserted</span>
                    <div className="text-lg font-bold text-brand-400">{src.totalJobsInserted}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500 font-medium">Updated</span>
                    <div className="text-lg font-bold text-blue-400">{src.totalJobsUpdated}</div>
                  </div>
                </div>

                {/* Circuit breaker info */}
                {src.health && (
                  <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-950/60 border border-slate-900 px-3 py-2 rounded-lg">
                    <div className="flex items-center space-x-1">
                      <span>Breaker State:</span>
                      <span className={`font-semibold ${src.health.circuitBreakerState === 'CLOSED' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {src.health.circuitBreakerState}
                      </span>
                    </div>
                    <span>
                      Refreshed:{' '}
                      {src.health.lastSuccessfulRun
                        ? new Date(src.health.lastSuccessfulRun).toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Never'}
                    </span>
                  </div>
                )}

                {/* Trigger button */}
                <div className="border-t border-slate-800/60 pt-4 flex items-center justify-between gap-4">
                  <button
                    onClick={() => handleTriggerIngestion(src.name)}
                    disabled={triggering}
                    className="flex-1 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-800 disabled:text-slate-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center space-x-2 shadow-lg shadow-brand-600/10"
                  >
                    {triggering ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    <span>Run Ingestion Now</span>
                  </button>
                  <button
                    onClick={fetchDashboardData}
                    className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Status Notifications */}
      {triggerError && (
        <div className="glass-panel border-red-900/50 bg-red-950/20 p-4 rounded-xl flex items-start space-x-3 text-red-400 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <div>
            <span className="font-semibold">Execution Warning:</span> {triggerError}
          </div>
        </div>
      )}

      {triggerSuccess && (
        <div className="glass-panel border-emerald-900/50 bg-emerald-950/20 p-4 rounded-xl flex items-start space-x-3 text-emerald-400 text-sm">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <div className="space-y-1">
            <div className="font-semibold">Ingestion completed successfully!</div>
            <div className="text-xs text-slate-300">
              Fetched: {triggerSuccess.jobsFetched} | Inserted: {triggerSuccess.jobsInserted} | Updated: {triggerSuccess.jobsUpdated} | Skipped: {triggerSuccess.jobsSkipped} in {triggerSuccess.durationMs}ms.
            </div>
          </div>
        </div>
      )}

      {/* Ingestion History Timeline */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <Clock className="w-5 h-5 text-slate-400" />
          <span>Execution Log History</span>
        </h2>

        {loading && runs.length === 0 ? (
          <div className="animate-pulse space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-900/60 rounded-xl border border-slate-800"></div>
            ))}
          </div>
        ) : runs.length === 0 ? (
          <div className="glass-panel rounded-2xl p-8 text-center text-slate-400 text-sm">
            No ingestion run logs recorded. Trigger a run to view execution timeline.
          </div>
        ) : (
          <div className="space-y-3">
            {runs.map((run) => (
              <div key={run.id} className="glass-panel rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800/80">
                <div className="flex items-center space-x-3">
                  <div className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(run.status)}`}>
                    {run.status}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white capitalize">{run.source} Aggregation</div>
                    <div className="text-xs text-slate-500">
                      Started: {new Date(run.startedAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center flex-wrap gap-x-6 gap-y-1 text-xs text-slate-400">
                  <div>
                    Fetched: <span className="font-semibold text-slate-200">{run.jobsFetched}</span>
                  </div>
                  <div>
                    Inserted: <span className="font-semibold text-emerald-400">{run.jobsInserted}</span>
                  </div>
                  <div>
                    Updated: <span className="font-semibold text-blue-400">{run.jobsUpdated}</span>
                  </div>
                  <div>
                    Skipped: <span className="font-semibold text-slate-500">{run.jobsSkipped}</span>
                  </div>
                  {run.durationMs && (
                    <div>
                      Duration: <span className="font-semibold text-slate-200">{run.durationMs}ms</span>
                    </div>
                  )}
                </div>

                {run.errorMessage && (
                  <div className="w-full text-xs text-red-400 bg-red-950/20 px-3 py-1.5 rounded border border-red-900/30">
                    <span className="font-semibold">Error:</span> {run.errorMessage}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default IngestionDashboard;
