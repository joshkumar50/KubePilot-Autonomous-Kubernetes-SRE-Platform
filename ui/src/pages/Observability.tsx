import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { BarChart2, Gauge, Activity, Wifi, CheckCircle, XCircle } from 'lucide-react';

interface ServiceHealth {
  name: string; healthy: boolean; latency: number; uptime: string;
}
interface ObservabilityData {
  requests_per_second: number; avg_latency_ms: number;
  error_rate: number; active_traces: number; services: ServiceHealth[];
}

const Metric = ({ label, value, icon: Icon, color, sub }: {
  label: string; value: string | number; icon: React.ElementType; color: string; sub?: string;
}) => (
  <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md">
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

export const Observability = () => {
  const { data, isLoading, error } = useQuery<ObservabilityData>({
    queryKey: ['observability'],
    queryFn: async () => { const res = await apiClient.get('/observability'); return res.data; }
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse h-24" />
          ))}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          Failed to connect to Observability service.
        </div>
      )}
      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Metric label="Requests/sec" value={data.requests_per_second} icon={BarChart2} color="bg-indigo-50 text-indigo-600" />
            <Metric label="Avg Latency" value={`${data.avg_latency_ms}ms`} icon={Gauge} color="bg-sky-50 text-sky-600" />
            <Metric label="Error Rate" value={`${data.error_rate}%`} sub="Target: <1%" icon={Activity} color={data.error_rate < 1 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'} />
            <Metric label="Active Traces" value={data.active_traces} icon={Wifi} color="bg-violet-50 text-violet-600" />
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">Service Health Matrix</h2>
            </div>
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
                {data.services?.map((svc, idx) => {
                  const maxLatency = Math.max(...data.services.map(s => s.latency));
                  return (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-mono text-slate-800 font-medium">{svc.name}</td>
                      <td className="px-5 py-3">
                        {svc.healthy ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <CheckCircle size={10} /> Healthy
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                            <XCircle size={10} /> Degraded
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-600">{svc.latency}ms</td>
                      <td className="px-5 py-3 text-slate-600">{svc.uptime}</td>
                      <td className="px-5 py-3 w-32">
                        <div className="h-1.5 bg-slate-100 rounded-full">
                          <div
                            className={`h-full rounded-full ${svc.latency > 30 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                            style={{ width: `${Math.round((svc.latency / maxLatency) * 100)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
