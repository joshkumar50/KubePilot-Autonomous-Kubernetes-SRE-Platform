import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export const ExecutiveDashboard = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard');
      return res.data;
    }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Executive Dashboard</h1>
      <div className="p-6 bg-enterprise-card rounded-lg border border-slate-700 shadow-xl">
        {isLoading && <p className="text-slate-400">Loading live data...</p>}
        {error && <p className="text-enterprise-danger">Error: Failed to connect to Dashboard BFF</p>}
        {data && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-800 rounded-md">
              <h3 className="text-slate-400 text-sm">Cluster Health</h3>
              <p className="text-2xl font-bold text-enterprise-success">{data.cluster_health}</p>
            </div>
            <div className="p-4 bg-slate-800 rounded-md">
              <h3 className="text-slate-400 text-sm">App Health</h3>
              <p className="text-2xl font-bold text-enterprise-success">{data.app_health}</p>
            </div>
            <div className="p-4 bg-slate-800 rounded-md">
              <h3 className="text-slate-400 text-sm">Platform Health</h3>
              <p className="text-2xl font-bold text-enterprise-success">{data.platform_health}</p>
            </div>
            <div className="p-4 bg-slate-800 rounded-md">
              <h3 className="text-slate-400 text-sm">MTTR</h3>
              <p className="text-2xl font-bold text-enterprise-accent">{data.mttr_seconds}s</p>
            </div>
            <div className="p-4 bg-slate-800 rounded-md">
              <h3 className="text-slate-400 text-sm">Active Incidents</h3>
              <p className="text-2xl font-bold text-enterprise-warning">{data.active_incidents}</p>
            </div>
            <div className="p-4 bg-slate-800 rounded-md">
              <h3 className="text-slate-400 text-sm">Recovered Incidents</h3>
              <p className="text-2xl font-bold text-enterprise-accent">{data.recovered_incidents}</p>
            </div>
            <div className="p-4 bg-slate-800 rounded-md">
              <h3 className="text-slate-400 text-sm">System Availability</h3>
              <p className="text-2xl font-bold text-enterprise-success">{data.system_availability}%</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
