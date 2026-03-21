import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Shield, Activity, Users, Database, AlertCircle } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ users: 0, jobs: 0, applications: 0 });
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // Simulated admin data fetch
    setStats({ users: 124, jobs: 3450, applications: 890 });
    setLogs([
      { id: 1, type: 'Crawl', status: 'Success', details: 'Scanned Greenhouse (SpaceX)', time: '2 mins ago' },
      { id: 2, type: 'Auth', status: 'Success', details: 'User registration: hulke@example.com', time: '5 mins ago' },
      { id: 3, type: 'Apply', status: 'Failed', details: 'Form selector mismatch at Workday (Amazon)', time: '12 mins ago' },
    ]);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center gap-4 mb-12">
          <div className="p-3 bg-red-500/20 rounded-2xl">
            <Shield className="h-8 w-8 text-red-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Admin Console</h1>
            <p className="text-gray-500">System monitoring and infrastructure logs.</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Total Users', value: stats.users, icon: Users, color: 'text-blue-400' },
            { label: 'Discovered Jobs', value: stats.jobs, icon: Database, color: 'text-green-400' },
            { label: 'Applications', value: stats.applications, icon: Activity, color: 'text-purple-400' },
            { label: 'System Health', value: '98%', icon: Shield, color: 'text-emerald-400' },
          ].map((item, i) => (
            <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-3xl">
              <div className="flex justify-between items-start mb-4">
                <item.icon className={`h-6 w-6 ${item.color}`} />
              </div>
              <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">{item.label}</h3>
              <p className="text-3xl font-bold mt-1">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-center">
            <h2 className="text-xl font-bold">Activity Logs</h2>
            <button className="text-sm text-gray-500 hover:text-white">Full Audit Log</button>
          </div>
          <div className="p-0">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center gap-6 p-6 border-b border-white/5 hover:bg-white/[0.02] transition-all">
                <div className={`h-2 w-2 rounded-full ${log.status === 'Success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <div className="w-24 font-bold text-sm uppercase text-gray-400">{log.type}</div>
                <div className="flex-1 text-sm">{log.details}</div>
                <div className="text-gray-500 text-xs">{log.time}</div>
                {log.status === 'Failed' && <AlertCircle className="h-4 w-4 text-red-500" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
