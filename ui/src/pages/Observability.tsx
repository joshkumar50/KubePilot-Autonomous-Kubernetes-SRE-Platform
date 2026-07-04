import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export const Observability = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['observability'],
    queryFn: async () => {
      const res = await apiClient.get('/observability');
      return res.data;
    }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Observability</h1>
      <div className="p-6 bg-enterprise-card rounded-lg border border-slate-700 shadow-xl">
        {isLoading && <p className="text-slate-400">Loading observability metrics...</p>}
        {error && <p className="text-enterprise-danger">Error: Failed to connect to Observability Engine</p>}
        {data && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-800 rounded-md">
                <h3 className="text-slate-400 text-sm">Requests/sec</h3>
                <p className="text-2xl font-bold text-enterprise-accent">{data.requests_per_second}</p>
              </div>
              <div className="p-4 bg-slate-800 rounded-md">
                <h3 className="text-slate-400 text-sm">Avg Latency</h3>
                <p className="text-2xl font-bold text-enterprise-accent">{data.avg_latency_ms}ms</p>
              </div>
              <div className="p-4 bg-slate-800 rounded-md">
                <h3 className="text-slate-400 text-sm">Error Rate</h3>
                <p className="text-2xl font-bold text-enterprise-success">{data.error_rate}%</p>
              </div>
              <div className="p-4 bg-slate-800 rounded-md">
                <h3 className="text-slate-400 text-sm">Active Traces</h3>
                <p className="text-2xl font-bold text-enterprise-accent">{data.active_traces}</p>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white mb-3">Service Health</h2>
              <div className="space-y-2">
                {data.services && data.services.map((svc: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-800 rounded-md">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${svc.healthy ? 'bg-enterprise-success' : 'bg-enterprise-danger'}`}></div>
                      <span className="text-slate-300">{svc.name}</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-slate-400">
                      <span>{svc.latency}ms</span>
                      <span>{svc.uptime}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
