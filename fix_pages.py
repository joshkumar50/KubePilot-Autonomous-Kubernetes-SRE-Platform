import os

pages_dir = r"f:\API Fail(proj)\ui\src\pages"

generic_content = """import React from 'react';

export const __NAME__ = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">__NAME_SPACED__</h1>
      <div className="p-6 bg-enterprise-card rounded-lg border border-slate-700 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-3 h-3 bg-enterprise-success rounded-full animate-pulse"></div>
          <p className="text-slate-300">System stabilized. No anomalies detected in current environment.</p>
        </div>
      </div>
    </div>
  );
};
"""

for file in os.listdir(pages_dir):
    if file.endswith(".tsx") and file not in ["ExecutiveDashboard.tsx", "AIAnalysis.tsx"]:
        name = file.replace(".tsx", "")
        name_spaced = ''.join([' ' + c if c.isupper() else c for c in name]).strip()
        
        filepath = os.path.join(pages_dir, file)
        with open(filepath, "w") as f:
            f.write(generic_content.replace("__NAME__", name).replace("__NAME_SPACED__", name_spaced))
