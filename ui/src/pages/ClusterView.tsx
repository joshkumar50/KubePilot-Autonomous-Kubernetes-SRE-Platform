import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export const ClusterView = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['cluster'],
    queryFn: async () => {
      const res = await apiClient.get('/cluster');
      return res.data;
    }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Cluster View</h1>
      <div className="p-6 bg-enterprise-card rounded-lg border border-slate-700 shadow-xl">
        {isLoading && <p className="text-slate-400">Loading cluster data...</p>}
        {error && <p className="text-enterprise-danger">Error: Failed to connect to Cluster API</p>}
        {data && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-800 rounded-md">
                <h3 className="text-slate-400 text-sm">Total Nodes</h3>
                <p className="text-2xl font-bold text-enterprise-accent">{data.total_nodes}</p>
              </div>
              <div className="p-4 bg-slate-800 rounded-md">
                <h3 className="text-slate-400 text-sm">Total Pods</h3>
                <p className="text-2xl font-bold text-enterprise-accent">{data.total_pods}</p>
              </div>
              <div className="p-4 bg-slate-800 rounded-md">
                <h3 className="text-slate-400 text-sm">Namespaces</h3>
                <p className="text-2xl font-bold text-enterprise-accent">{data.namespaces}</p>
              </div>
              <div className="p-4 bg-slate-800 rounded-md">
                <h3 className="text-slate-400 text-sm">Deployments</h3>
                <p className="text-2xl font-bold text-enterprise-accent">{data.deployments}</p>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white mb-3">Services</h2>
              <div className="space-y-2">
                {data.services && data.services.map((svc: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-800 rounded-md">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${svc.status === 'Running' ? 'bg-enterprise-success' : 'bg-enterprise-danger'}`}></div>
                      <span className="text-slate-300">{svc.name}</span>
                    </div>
                    <span className="text-sm text-slate-400">{svc.type} · {svc.namespace}</span>
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
