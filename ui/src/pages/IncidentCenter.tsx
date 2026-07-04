import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface Incident {
  id: string; status: string; severity: string;
  start_time?: number; description: string;
}

const severityColor = (s: string) => {
  if (s === 'Critical') return 'bg-red-50 text-red-700 border-red-200';
  if (s === 'High') return 'bg-orange-50 text-orange-700 border-orange-200';
  return 'bg-yellow-50 text-yellow-700 border-yellow-200';
};

export const IncidentCenter = () => {
  const { data, isLoading, error } = useQuery<Incident[]>({
    queryKey: ['incidents'],
    queryFn: async () => { const res = await apiClient.get('/incidents'); return res.data; }
  });

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {isLoading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse h-24" />
          ))}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          Failed to connect to Incident Engine.
        </div>
      )}
      {data && data.length === 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 flex items-center gap-4">
          <CheckCircle size={20} className="text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">All Systems Operational</p>
            <p className="text-xs text-emerald-600 mt-0.5">No active incidents detected. The platform is healthy.</p>
          </div>
        </div>
      )}
      {data && data.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">{data.length} active incident{data.length !== 1 ? 's' : ''}</p>
          {data.map((incident, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900 font-mono">{incident.id}</p>
                    <p className="text-sm text-slate-600 mt-1">{incident.description}</p>
                    {incident.start_time && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <Clock size={11} className="text-slate-400" />
                        <span className="text-xs text-slate-400">
                          Started: {new Date(incident.start_time * 1000).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${severityColor(incident.severity)}`}>
                    {incident.severity}
                  </span>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {incident.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
