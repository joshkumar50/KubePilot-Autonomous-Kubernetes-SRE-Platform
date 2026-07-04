import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export const RecoveryCenter = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['recovery'],
    queryFn: async () => {
      const res = await apiClient.get('/recovery');
      return res.data;
    }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Recovery Center</h1>
      <div className="p-6 bg-enterprise-card rounded-lg border border-slate-700 shadow-xl">
        {isLoading && <p className="text-slate-400">Loading recovery metrics...</p>}
        {error && <p className="text-enterprise-danger">Error: Failed to connect to Recovery Service</p>}
        {data && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-800 rounded-md">
                <h3 className="text-slate-400 text-sm">Total Experiments</h3>
                <p className="text-2xl font-bold text-enterprise-accent">{data.total_experiments}</p>
              </div>
              <div className="p-4 bg-slate-800 rounded-md">
                <h3 className="text-slate-400 text-sm">Successful Recoveries</h3>
                <p className="text-2xl font-bold text-enterprise-success">{data.successful_recoveries}</p>
              </div>
              <div className="p-4 bg-slate-800 rounded-md">
                <h3 className="text-slate-400 text-sm">Average MTTR</h3>
                <p className="text-2xl font-bold text-enterprise-accent">{data.average_mttr_seconds?.toFixed(2)}s</p>
              </div>
              <div className="p-4 bg-slate-800 rounded-md">
                <h3 className="text-slate-400 text-sm">Active Incidents</h3>
                <p className="text-2xl font-bold text-enterprise-warning">{Object.keys(data.active_incidents || {}).length}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
