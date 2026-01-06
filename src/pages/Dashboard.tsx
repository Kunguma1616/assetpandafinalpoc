import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  Package, DollarSign, TrendingUp, LogOut, ListOrdered, Upload, AlertCircle, 
  BarChart3, Activity, Download, Loader2, Zap, Database
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// --- MOCK DATA GENERATOR ---
const generateMockAssets = () => {
  const categories = ['Machinery', 'Vehicles', 'Electronics', 'Furniture', 'Tools'];
  const statuses = ['active', 'maintenance', 'retired', 'pending'];
  const conditions = ['Good', 'Fair', 'Poor'];
  
  return Array.from({ length: 83 }, (_, i) => ({
    id: `asset-${i + 1}`,
    category: categories[Math.floor(Math.random() * categories.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    condition: conditions[Math.floor(Math.random() * conditions.length)],
    current_value: Math.floor(Math.random() * 50000) + 5000,
    purchase_cost: Math.floor(Math.random() * 60000) + 5000,
  }));
};

interface Stats {
  totalValue: number;
  totalCount: number;
  byCategory: Record<string, { count: number; value: number }>;
  byStatus: Record<string, number>;
  byCondition: Record<string, number>;
  depreciation: number;
  highValueAssets: number;
  categoryData: Array<{ name: string; count: number; value: number }>;
  statusData: Array<{ name: string; value: number }>;
  conditionData: Array<{ name: string; value: number; fullMark: number }>;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<any[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const COLORS = ['#2563eb', '#0ea5e9', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6'];

  useEffect(() => {
    const timer = setTimeout(() => {
      const mockAssets = generateMockAssets();
      setAssets(mockAssets);
      calculateStats(mockAssets);
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const calculateStats = (assetData: any[]) => {
    if (!assetData || assetData.length === 0) {
      setStats(null);
      return;
    }

    const totalValue = assetData.reduce((sum, a) => sum + (Number(a.current_value) || 0), 0);
    const purchaseValue = assetData.reduce((sum, a) => sum + (Number(a.purchase_cost) || 0), 0);
    const totalCount = assetData.length;
    const depreciation = purchaseValue > 0 ? ((purchaseValue - totalValue) / purchaseValue) * 100 : 0;
    const highValueAssets = assetData.filter(a => (Number(a.current_value) || 0) > 10000).length;

    const byCategory: Record<string, { count: number; value: number }> = {};
    const byStatus: Record<string, number> = {};
    const byCondition: Record<string, number> = {};

    assetData.forEach(asset => {
      const value = Number(asset.current_value) || 0;
      
      if (asset.category) {
        if (!byCategory[asset.category]) byCategory[asset.category] = { count: 0, value: 0 };
        byCategory[asset.category].count++;
        byCategory[asset.category].value += value;
      }
      
      if (asset.status) {
        const s = asset.status.toLowerCase();
        byStatus[s] = (byStatus[s] || 0) + 1;
      }
      
      if (asset.condition) {
        const rawCond = asset.condition.trim().toLowerCase();
        let cleanCond = "";

        if (rawCond === 'excellent' || rawCond.startsWith('xc')) {
          cleanCond = 'Excellent';
        } else if (rawCond === 'good') {
          cleanCond = 'Good';
        } else if (rawCond === 'fair') {
          cleanCond = 'Fair';
        } else if (rawCond === 'poor') {
          cleanCond = 'Poor';
        } else {
          cleanCond = rawCond.charAt(0).toUpperCase() + rawCond.slice(1);
        }

        byCondition[cleanCond] = (byCondition[cleanCond] || 0) + 1;
      }
    });

    const categoryData = Object.entries(byCategory).map(([name, data]) => ({ name, count: data.count, value: data.value }));
    const statusData = Object.entries(byStatus).map(([key, value]) => ({ 
      name: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), 
      value 
    }));
    
    const order = ['Good', 'Fair', 'Poor'];
    const conditionData = Object.entries(byCondition)
      .map(([name, value]) => ({ name, value, fullMark: totalCount }))
      .sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));

    setStats({ totalValue, totalCount, byCategory, byStatus, byCondition, depreciation, highValueAssets, categoryData, statusData, conditionData });
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
      navigate('/auth');
    } catch (error: any) {
      navigate('/auth');
    }
  };

  const handleExportReport = () => {
    toast.success('Report generation started. Download will begin shortly.');
  };

  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-xl">
          <p className="font-bold text-slate-900 text-lg mb-2">{label}</p>
          {payload.map((p: any, index: number) => (
            <p key={index} style={{ color: p.color }} className="text-sm font-semibold">
              {`${p.name}: `}
              <span>
                {p.name.includes('(£)') ? `£${p.value.toLocaleString('en-GB')}` : p.value.toLocaleString()}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xl text-sm">
          <p className="font-bold text-slate-900 text-base mb-1">{payload[0].name}</p>
          <p className="text-slate-600">Assets: <span className="font-bold">{payload[0].value}</span></p>
          <p className="text-slate-600">Percentage: <span className="font-bold">{(payload[0].percent * 100).toFixed(1)}%</span></p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-slate-50">
        <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
        <p className="text-2xl text-slate-800 mt-6 font-black tracking-tight">AUTHENTICATING EXECUTIVE INTELLIGENCE...</p>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER SECTION */}
      <div className="relative h-80 shadow-2xl overflow-hidden bg-[#1e293b]">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 to-slate-900/40"></div>
        <div className="relative z-10 container mx-auto px-6 h-full flex flex-col justify-center">
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center border border-white/20 shadow-xl overflow-hidden">
                {/* LOGO PLACED HERE INSIDE THE APP ICON CONTAINER */}
                <img src="/aspectlogo.jpeg" alt="Company Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-5xl font-extrabold text-white tracking-tight drop-shadow-md">Uploaded Asset Dashboard</h1>
                <p className="text-blue-300 text-xl font-bold uppercase tracking-widest opacity-90">Enterprise Asset Intelligence</p>
              </div>
            </div>

            {/* HEADER NAVIGATION */}
            <div className="flex gap-3 flex-wrap">
              <Button onClick={() => navigate('/upload')} variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/10 font-bold px-4 border-2">
                <Upload className="mr-2 h-4 w-4" /> Upload Asset
              </Button>
              <Button onClick={() => navigate('/assets')} variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/10 font-bold px-4 border-2">
                <ListOrdered className="mr-2 h-4 w-4" /> View Portfolio
              </Button>
              <Button onClick={() => navigate('/asset-history')} variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/10 font-bold px-4 border-2">
                <Activity className="mr-2 h-4 w-4" /> Asset History
              </Button>
              
            
              <Button onClick={handleSignOut} variant="destructive" className="font-bold px-6 shadow-lg border-2 border-white/10">
                <LogOut className="mr-2 h-4 w-4" /> Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* BODY CONTENT */}
      <div className="container mx-auto px-6 -mt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <Card className="rounded-2xl shadow-2xl p-7 bg-blue-700 text-white border-none">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black uppercase tracking-widest opacity-80">Total Assets</h3>
              <Package className="h-6 w-6 opacity-80" />
            </div>
            <div className="text-4xl font-black mb-2">{stats.totalCount.toLocaleString()}</div>
          </Card>

          <Card className="rounded-2xl shadow-2xl p-7 bg-emerald-700 text-white border-none">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black uppercase tracking-widest opacity-80">Portfolio Value</h3>
              <DollarSign className="h-6 w-6 opacity-80" />
            </div>
            <div className="text-4xl font-black mb-2">£{stats.totalValue.toLocaleString('en-GB')}</div>
          </Card>

          <Card className="rounded-2xl shadow-2xl p-7 bg-indigo-700 text-white border-none">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black uppercase tracking-widest opacity-80">Asset Categories</h3>
              <BarChart3 className="h-6 w-6 opacity-80" />
            </div>
            <div className="text-4xl font-black mb-2">{Object.keys(stats.byCategory).length}</div>
          </Card>

          <Card className="rounded-2xl shadow-2xl p-7 bg-amber-600 text-white border-none">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black uppercase tracking-widest opacity-80">Average Value</h3>
              <Activity className="h-6 w-6 opacity-80" />
            </div>
            <div className="text-4xl font-black mb-2">£{Math.round(stats.totalValue / stats.totalCount).toLocaleString('en-GB')}</div>
          </Card>
        </div>

        {/* CHARTS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <Card className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-4">Category Performance</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={stats.categoryData} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '11px', fontWeight: 'bold' }} />
                <YAxis yAxisId="left" stroke="#2563eb" style={{ fontSize: '11px' }} />
                <YAxis yAxisId="right" orientation="right" stroke="#0ea5e9" style={{ fontSize: '11px' }} />
                <Tooltip content={<CustomBarTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontWeight: 'bold' }} />
                <Bar yAxisId="left" dataKey="count" fill="#2563eb" name="Asset Count" radius={[6, 6, 0, 0]} />
                <Bar yAxisId="right" dataKey="value" fill="#0ea5e9" name="Asset Value (£)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-4">Status Distribution</h3>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie data={stats.statusData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={8} dataKey="value" stroke="none">
                  {stats.statusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontWeight: 'bold' }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* RADAR ANALYSIS */}
        <Card className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100 mb-10">
          <div className="mb-8">
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Zap className="h-6 w-6 text-blue-600" /> Asset Condition Intelligence
            </h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={stats.conditionData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="name" stroke="#64748b" style={{ fontSize: '12px', fontWeight: 'bold' }} />
                  <PolarRadiusAxis angle={90} domain={[0, 'auto']} />
                  <Radar name="Assets" dataKey="value" stroke="#2563eb" fill="#2563eb" fillOpacity={0.6} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.conditionData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <YAxis type="category" dataKey="name" stroke="#64748b" style={{ fontWeight: 'bold' }} />
                  <XAxis type="number" stroke="#64748b" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10b981" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;