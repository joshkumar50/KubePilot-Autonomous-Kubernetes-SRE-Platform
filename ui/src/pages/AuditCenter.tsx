import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export const AuditCenter = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['audit'],
    queryFn: async () => {
      const res = await apiClient.get('/audit');
      return res.data;
    }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Audit Center</h1>
      <div className="p-6 bg-enterprise-card rounded-lg border border-slate-700 shadow-xl">
        {isLoading && <p className="text-slate-400">Loading audit logs...</p>}
        {error && <p className="text-enterprise-danger">Error: Failed to connect to Audit Engine</p>}
        {data && data.length === 0 && (
          <div className="flex items-center space-x-4">
            <div className="w-3 h-3 bg-enterprise-success rounded-full animate-pulse"></div>
            <p className="text-enterprise-success">No audit events recorded yet. System is clean.</p>
          </div>
        )}
        {data && data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="p-3 text-sm text-slate-400">Timestamp</th>
                  <th className="p-3 text-sm text-slate-400">Event Type</th>
                  <th className="p-3 text-sm text-slate-400">Incident ID</th>
                  <th className="p-3 text-sm text-slate-400">Decision</th>
                  <th className="p-3 text-sm text-slate-400">Confidence</th>
                  <th className="p-3 text-sm text-slate-400">Approved</th>
                </tr>
              </thead>
              <tbody>
                {data.map((log: any, idx: number) => (
                  <tr key={idx} className="border-b border-slate-700 hover:bg-slate-800 transition">
                    <td className="p-3 text-sm text-slate-300 font-mono">{log.timestamp}</td>
                    <td className="p-3 text-sm text-enterprise-accent">{log.event_type}</td>
                    <td className="p-3 text-sm text-slate-300">{log.incident_id || 'N/A'}</td>
                    <td className="p-3 text-sm text-slate-300">{log.decision || 'N/A'}</td>
                    <td className="p-3 text-sm text-slate-300">{log.confidence_score?.toFixed(2) || 'N/A'}</td>
                    <td className="p-3 text-sm">
                      {log.human_approved ? (
                        <span className="text-enterprise-success">✓ Yes</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
