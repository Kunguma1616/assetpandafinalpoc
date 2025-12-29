import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, Building2, HardHat, TrendingUp, LogOut, Home, BarChart3, Package, Upload, Wrench } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ===== MOCK DATA =====
const jobData = [
  { id: 1, jobNumber: "J001", siteName: "Site Alpha", tradeGroup: "Electrical", tradeName: "Electrician", status: "Active", assignedDate: "2024-01-15" },
  { id: 2, jobNumber: "J002", siteName: "Site Beta", tradeGroup: "Plumbing", tradeName: "Plumber", status: "Active", assignedDate: "2024-01-16" },
  { id: 3, jobNumber: "J003", siteName: "Site Alpha", tradeGroup: "Carpentry", tradeName: "Carpenter", status: "Completed", assignedDate: "2024-01-10" },
  { id: 4, jobNumber: "J004", siteName: "Site Gamma", tradeGroup: "Electrical", tradeName: "Electrician", status: "Active", assignedDate: "2024-01-17" },
  { id: 5, jobNumber: "J005", siteName: "Site Beta", tradeGroup: "HVAC", tradeName: "HVAC Technician", status: "Pending", assignedDate: "2024-01-18" },
  { id: 6, jobNumber: "J006", siteName: "Site Delta", tradeGroup: "Plumbing", tradeName: "Plumber", status: "Active", assignedDate: "2024-01-19" },
  { id: 7, jobNumber: "J007", siteName: "Site Alpha", tradeGroup: "Masonry", tradeName: "Mason", status: "Completed", assignedDate: "2024-01-12" },
  { id: 8, jobNumber: "J008", siteName: "Site Gamma", tradeGroup: "Carpentry", tradeName: "Carpenter", status: "Active", assignedDate: "2024-01-20" },
];

const getTradeGroupStats = (jobs: any[]) => {
  const stats: Record<string, number> = {};
  jobs.forEach(job => {
    stats[job.tradeGroup] = (stats[job.tradeGroup] || 0) + 1;
  });
  return stats;
};

const getSiteStats = (jobs: any[]) => {
  const stats: Record<string, number> = {};
  jobs.forEach(job => {
    stats[job.siteName] = (stats[job.siteName] || 0) + 1;
  });
  return stats;
};

// ===== COMPONENTS =====
const KPICard = ({ title, value, subtitle, icon: Icon, trend, iconBgClass = "bg-blue-100" }: any) => (
  <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
    <div className="flex items-center justify-between mb-4">
      <div className={`w-12 h-12 rounded-lg ${iconBgClass} flex items-center justify-center`}>
        <Icon className="w-6 h-6 text-slate-700" />
      </div>
      {trend && (
        <span className={`text-sm font-semibold ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {trend.isPositive ? '↑' : '↓'} {trend.value}%
        </span>
      )}
    </div>
    <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
    <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
  </div>
);

const TradeGroupCards = ({ jobs }: any) => {
  const tradeStats = getTradeGroupStats(jobs);
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {Object.entries(tradeStats).map(([trade, count], index) => (
        <div key={trade} className={`${colors[index % colors.length]} text-white rounded-lg p-4 shadow-md`}>
          <HardHat className="w-8 h-8 mb-2 opacity-90" />
          <h3 className="text-lg font-bold">{trade}</h3>
          <p className="text-2xl font-bold mt-1">{count as number}</p>
          <p className="text-sm opacity-90">Active Jobs</p>
        </div>
      ))}
    </div>
  );
};

const TradeDistributionChart = ({ jobs }: any) => {
  const tradeStats = getTradeGroupStats(jobs);
  const chartData = Object.entries(tradeStats).map(([name, value]) => ({ name, value }));
  const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Trade Distribution</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label>
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

const SiteBreakdown = ({ jobs }: any) => {
  const siteStats = getSiteStats(jobs);
  const chartData = Object.entries(siteStats).map(([name, jobs]) => ({ name, jobs }));

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Jobs by Site</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="jobs" fill="#3b82f6" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const JobsTable = ({ jobs }: any) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Completed': return 'bg-blue-100 text-blue-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">Recent Jobs</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Job #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Site</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Trade Group</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Trade Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Assigned Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {jobs.map((job: any) => (
              <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-slate-900">{job.jobNumber}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{job.siteName}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{job.tradeGroup}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{job.tradeName}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(job.status)}`}>
                    {job.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{job.assignedDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ===== MAIN COMPONENT =====
const Jobs = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("jobs");

  const totalJobs = jobData.length;
  const uniqueSites = new Set(jobData.map(job => job.siteName)).size;
  const tradeStats = getTradeGroupStats(jobData);
  const mostCommonTrade = Object.entries(tradeStats).sort((a, b) => b[1] - a[1])[0];

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Signed out successfully');
      navigate('/auth');
    } catch (error: any) {
      console.error('Logout error:', error);
      navigate('/auth');
    }
  };

  const navItems = [
    { id: "home", label: "Home", icon: Home, path: "/home" },
    { id: "dashboard", label: "Dashboard", icon: BarChart3, path: "/dashboard" },
    { id: "jobs", label: "Jobs", icon: Briefcase, path: "/jobs" },
    { id: "assets", label: "Assets", icon: Package, path: "/assets" },
    { id: "upload", label: "Upload", icon: Upload, path: "/upload" },
    { id: "tools", label: "Tools", icon: Wrench, path: "/tools" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 text-white flex flex-col z-50">
        {/* Logo */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">JobTracker</h1>
              <p className="text-xs text-slate-400">Management Console</p>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-4">
            Main Menu
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  navigate(item.path);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Navigation */}
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={() => navigate('/analytics')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
          >
            <BarChart3 className="w-5 h-5" />
            <span>Analytics</span>
          </button>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center">
              <span className="text-sm font-medium">JD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">John Doe</p>
              <p className="text-xs text-slate-400 truncate">Project Manager</p>
            </div>
          </div>
        </div>
      </aside>
      
      <main className="ml-64">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Job Management Dashboard</h1>
              <p className="text-sm text-slate-500 mt-0.5">Track and manage all job assignments across sites</p>
            </div>
          </div>
        </header>
        
        <div className="p-8 space-y-8">
          {/* KPI Cards */}
          <section>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <KPICard
                title="Total Jobs"
                value={totalJobs}
                subtitle="Active job records"
                icon={Briefcase}
                trend={{ value: 12, isPositive: true }}
              />
              <KPICard
                title="Active Sites"
                value={uniqueSites}
                subtitle="Unique locations"
                icon={Building2}
                iconBgClass="bg-cyan-100"
              />
              <KPICard
                title="Trade Groups"
                value={Object.keys(tradeStats).length}
                subtitle="Categories tracked"
                icon={HardHat}
                iconBgClass="bg-amber-100"
              />
              <KPICard
                title="Top Trade"
                value={mostCommonTrade[0]}
                subtitle={`${mostCommonTrade[1]} jobs assigned`}
                icon={TrendingUp}
                iconBgClass="bg-green-100"
              />
            </div>
          </section>

          {/* Trade Group Breakdown */}
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Trade Group Overview</h2>
            <TradeGroupCards jobs={jobData} />
          </section>

          {/* Charts Row */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TradeDistributionChart jobs={jobData} />
            <SiteBreakdown jobs={jobData} />
          </section>

          {/* Jobs Table */}
          <section>
            <JobsTable jobs={jobData} />
          </section>
        </div>
      </main>
    </div>
  );
};

export default Jobs;