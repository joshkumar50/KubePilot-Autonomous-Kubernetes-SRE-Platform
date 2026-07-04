import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { BarChart2, Gauge, Activity, Wifi, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface ServiceHealth {
  name: string; healthy: boolean; latency: number; uptime: string; error_rate?: number;
}
interface ObservabilityData {
  requests_per_second: number; avg_latency_ms: number;
  error_rate: number; active_traces: number; services: ServiceHealth[];
}

const fmt = (v: unknown, suffix = '') =>
  v === undefined || v === null || Number.isNaN(Number(v))
    ? '—'
    : `${v}${suffix}`;

const Metric = ({ label, value, icon: Icon, color, sub }: {
  label: string; value: string | number; icon: React.ElementType; color: string; sub?: string;
}) => (
  <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
    <div className="flex items-center gap-2 mb-3">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={13} />
      </div>
      <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</span>
    </div>
    <p className="text-2xl font-bold text-slate-900">{value}</p>
    {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
  </div>
);

const LatencyBar = ({ value, max, healthy }: { value: number; max: number; healthy: boolean }) => (
  <div className="h-1.5 bg-slate-100 rounded-full w-32">
    <div
      className={`h-full rounded-full transition-all duration-700 ${
        !healthy ? 'bg-red-400' : value > 100 ? 'bg-amber-400' : 'bg-emerald-400'
      }`}
      style={{ width: `${Math.max(4, Math.round((value / Math.max(max, 1)) * 100))}%` }}
    />
  </div>
);

export const Observability = () => {
  const { data, isLoading, error, dataUpdatedAt } = useQuery<ObservabilityData>({
    queryKey: ['observability'],
    queryFn: async () => { const res = await apiClient.get('/observability'); return res.data; },
    refetchInterval: 3000, // Live refresh every 3 seconds
    refetchIntervalInBackground: true,
  });

  const maxLatency = data?.services?.length
    ? Math.max(...data.services.map(s => s.latency), 1)
    : 1;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Live indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
          {dataUpdatedAt
            ? `Last updated ${new Date(dataUpdatedAt).toLocaleTimeString()}`
            : 'Connecting...'}
        </div>
        <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          Failed to connect to Observability service. Ensure monitoring-engine is running.
        </div>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Metric
          label="Requests/sec"
          value={fmt(data?.requests_per_second)}
          icon={BarChart2}
          color="bg-indigo-50 text-indigo-600"
        />
        <Metric
          label="Avg Latency"
          value={fmt(data?.avg_latency_ms, 'ms')}
          icon={Gauge}
          color="bg-sky-50 text-sky-600"
        />
        <Metric
          label="Error Rate"
          value={fmt(data?.error_rate, '%')}
          sub="Target: <1%"
          icon={Activity}
          color={
            data?.error_rate === undefined
              ? 'bg-slate-50 text-slate-400'
              : data.error_rate < 1
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-red-50 text-red-600'
          }
        />
        <Metric
          label="Active Traces"
          value={fmt(data?.active_traces)}
          icon={Wifi}
          color="bg-violet-50 text-violet-600"
        />
      </div>

      {/* Service Health Matrix */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Service Health Matrix</h2>
          {data && (
            <span className="text-xs text-slate-400">
              {data.services?.filter(s => s.healthy).length ?? 0} / {data.services?.length ?? 0} healthy
            </span>
          )}
        </div>

        {isLoading && !data && (
          <div className="divide-y divide-slate-100">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="px-5 py-3 h-12 animate-pulse bg-slate-50" />
            ))}
          </div>
        )}

        {data && (!data.services || data.services.length === 0) && (
          <div className="px-5 py-8 text-center text-sm text-slate-400">
            No service data available yet. Waiting for telemetry...
          </div>
        )}

        {data?.services && data.services.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Service</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Latency</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Uptime</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Latency Bar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.services.map((svc, idx) => (
                <tr
                  key={idx}
                  className={`hover:bg-slate-50 transition-colors ${!svc.healthy ? 'bg-red-50/40' : ''}`}
                >
                  <td className="px-5 py-3 font-mono text-slate-800 font-medium">{svc.name}</td>
                  <td className="px-5 py-3">
                    {svc.healthy ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        <CheckCircle size={10} /> Healthy
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-100 animate-pulse">
                        <XCircle size={10} /> Degraded
                      </span>
                    )}
                  </td>
                  <td className={`px-5 py-3 font-mono font-medium ${svc.latency > 100 ? 'text-red-600' : 'text-slate-600'}`}>
                    {svc.latency}ms
                  </td>
                  <td className="px-5 py-3 text-slate-600">{svc.uptime}</td>
                  <td className="px-5 py-3">
                    <LatencyBar value={svc.latency} max={maxLatency} healthy={svc.healthy} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
