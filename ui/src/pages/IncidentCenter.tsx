import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export const IncidentCenter = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['incidents'],
    queryFn: async () => {
      const res = await apiClient.get('/incidents');
      return res.data;
    }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Incident Center</h1>
      <div className="p-6 bg-enterprise-card rounded-lg border border-slate-700 shadow-xl">
        {isLoading && <p className="text-slate-400">Loading incidents...</p>}
        {error && <p className="text-enterprise-danger">Error: Failed to connect to Incident Engine</p>}
        {data && data.length === 0 && (
          <div className="flex items-center space-x-4">
            <div className="w-3 h-3 bg-enterprise-success rounded-full animate-pulse"></div>
            <p className="text-enterprise-success text-lg">No active incidents. All systems operational.</p>
          </div>
        )}
        {data && data.length > 0 && (
          <div className="space-y-4">
            {data.map((incident: any, idx: number) => (
              <div key={idx} className="p-4 bg-slate-800 rounded-md border-l-4 border-enterprise-danger">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-enterprise-warning">{incident.id}</h3>
                  <span className="px-2 py-1 bg-enterprise-danger/20 text-enterprise-danger text-xs rounded">{incident.severity}</span>
                </div>
                <p className="text-slate-300 mt-2">{incident.description}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-slate-400">
                  <span>Status: {incident.status}</span>
                  {incident.start_time && <span>Started: {new Date(incident.start_time * 1000).toLocaleString()}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
