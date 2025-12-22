import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, DollarSign, TrendingUp, LogOut, ListOrdered, Upload, AlertCircle, PieChart as PieChartIcon, BarChart3, Activity, Download, Loader2, Zap, Tools } from 'lucide-react'; 
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import heroWarehouse from '@/assets/hero-warehouse.jpg';

// **PDF Generation Imports**
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- Type Definitions ---
interface AssetData {
  id: string;
  category: string;
  status: string;
  condition: string;
  current_value: string | number | null;
  purchase_cost: string | number | null;
}

interface AssetStats {
  totalValue: number;
  totalCount: number;
  byCategory: Record<string, { count: number; value: number }>;
  byStatus: Record<string, number>;
  byCondition: Record<string, number>;
  depreciation: number;
  highValueAssets: number;
  categoryData: { name: string; count: number; value: number }[];
  statusData: { name: string; value: number }[];
  conditionData: { name: string; value: number; fullMark: number }[];
}

// --- Custom Hook for PDF Generation ---
const usePdfGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePdf = useCallback(async (elementId: string, filename: string = 'Asset_Dashboard_Report.pdf') => {
    setIsGenerating(true);
    const input = document.getElementById(elementId);

    if (!input) {
      console.error('Target element not found for PDF generation.');
      setIsGenerating(false);
      return;
    }

    try {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        windowWidth: input.scrollWidth,
        windowHeight: input.scrollHeight,
      });

      document.body.style.overflow = originalOverflow;

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const finalWidth = imgWidth * ratio;
      const finalHeight = imgHeight * ratio;

      const x = (pdfWidth - finalWidth) / 2;
      const y = (pdfHeight - finalHeight) / 2;

      pdf.addImage(imgData, 'JPEG', x, y, finalWidth, finalHeight);
      pdf.save(filename);

    } catch (error) {
      console.error('Error during PDF generation:', error);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return { isGenerating, generatePdf };
};

// --- Custom Hook for Asset Stats ---
const useAssetStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AssetStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const COLORS = useMemo(() => ['#4c51bf', '#38bdf8', '#fb923c', '#ef4444', '#10b981', '#a855f7'], []);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const { data: assets, error: fetchError } = await supabase
        .from('assets')
        .select('*')
        .eq('user_id', user.id)
        .returns<AssetData[]>();

      if (fetchError) {
        console.error('Error fetching assets:', fetchError);
        setError('Failed to load asset data.');
        setLoading(false);
        return;
      }

      if (!assets || assets.length === 0) {
        setStats(null);
        setLoading(false);
        return;
      }

      const totalValue = assets.reduce(
        (sum, a) => sum + (Number(a.current_value) || Number(a.purchase_cost) || 0),
        0
      );

      const purchaseValue = assets.reduce(
        (sum, a) => sum + (Number(a.purchase_cost) || 0),
        0
      );

      const totalCount = assets.length;

      const depreciation = purchaseValue > 0 ? ((purchaseValue - totalValue) / purchaseValue) * 100 : 0;
      const highValueAssets = assets.filter(a => (Number(a.current_value) || Number(a.purchase_cost) || 0) > 10000).length;

      const byCategory: Record<string, { count: number; value: number }> = {};
      const byStatus: Record<string, number> = {};
      const byCondition: Record<string, number> = {};

      assets.forEach(asset => {
        const value = Number(asset.current_value) || Number(asset.purchase_cost) || 0;

        if (asset.category) {
          if (!byCategory[asset.category]) {
            byCategory[asset.category] = { count: 0, value: 0 };
          }
          byCategory[asset.category].count++;
          byCategory[asset.category].value += value;
        }

        if (asset.status) {
          byStatus[asset.status] = (byStatus[asset.status] || 0) + 1;
        }

        if (asset.condition) {
          // Normalize condition strings to handle casing issues and ensure correct grouping
          const normalizedCondition = asset.condition.trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
          byCondition[normalizedCondition] = (byCondition[normalizedCondition] || 0) + 1;
        }
      });

      const categoryData = Object.entries(byCategory).map(([name, data]) => ({
        name,
        count: data.count,
        value: data.value,
      }));

      const statusData = Object.entries(byStatus).map(([key, value]) => ({
        name: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        value,
      }));

      const conditionData = Object.entries(byCondition).map(([key, value]) => ({
        // Ensure the display name is correctly capitalized here
        name: key.replace(/\b\w/g, c => c.toUpperCase()), 
        value,
        fullMark: totalCount,
      }));

      setStats({
        totalValue,
        totalCount,
        byCategory,
        byStatus,
        byCondition,
        depreciation,
        highValueAssets,
        categoryData,
        statusData,
        conditionData,
      });

      setLoading(false);
    };

    fetchStats();
  }, [user]);

  return { stats, loading, error, COLORS };
};

// --- Custom Tooltip ---
const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-4 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-2xl text-slate-800">
        <p className="font-bold text-lg mb-2">{label}</p>
        {payload.map((p: any, index: number) => (
          <p key={index} style={{ color: p.color }} className="text-sm">
            {`${p.name}: `}
            <span className="font-semibold">
              {p.name.includes('(£)') ? `£${p.value.toLocaleString('en-GB')}` : p.value.toLocaleString()}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// --- KPI Cards ---
interface KpiCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  description: string;
  className: string;
  trend?: { icon: React.ElementType, text: string };
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon: Icon, description, className, trend }) => (
  <Card className={`border-0 shadow-xl overflow-hidden relative ${className}`}>
    <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
      <CardTitle className="text-sm font-semibold text-white/90">{title}</CardTitle>
      <Icon className="h-5 w-5 text-white/80" />
    </CardHeader>
    <CardContent className="relative z-10">
      <div className="text-4xl font-bold mb-2">{value}</div>
      <p className="text-xs text-white/80 flex items-center">
        {trend && <trend.icon className="h-3 w-3 mr-1" />}
        {description}
      </p>
    </CardContent>
  </Card>
);

// --- Metric Cards ---
interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  description: string;
  iconColor: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon: Icon, description, iconColor }) => (
  <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm transition-all hover:shadow-xl hover:scale-[1.02]">
    <CardHeader>
      <CardTitle className="text-base font-semibold text-slate-700 flex items-center gap-2">
        <Icon className={`h-5 w-5 ${iconColor}`} />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-slate-800">{value}</div>
      <p className="text-sm text-slate-500 mt-1">{description}</p>
    </CardContent>
  </Card>
);

// --- Chart Components ---
const CategoryBarChart: React.FC<{ data: AssetStats['categoryData'] }> = ({ data }) => (
  <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
    <CardHeader>
      <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-indigo-600" /> Category Performance
      </CardTitle>
      <p className="text-sm text-slate-500">Asset count and valuation by category</p>
    </CardHeader>
    <CardContent>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data} barGap={4}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4c51bf" stopOpacity={0.9}/>
                <stop offset="95%" stopColor="#4c51bf" stopOpacity={0.5}/>
              </linearGradient>

              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.9}/>
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.5}/>
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '12px' }} />
            <YAxis yAxisId="left" orientation="left" stroke="#4c51bf" dataKey="count" />
            <YAxis yAxisId="right" orientation="right" stroke="#38bdf8" dataKey="value" />

            <Tooltip content={<CustomBarTooltip />} />
            <Legend />

            <Bar yAxisId="left" dataKey="count" fill="url(#colorCount)" name="Asset Count" radius={[6, 6, 0, 0]} />
            <Bar yAxisId="right" dataKey="value" fill="url(#colorValue)" name="Asset Value (£)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[320px] flex items-center justify-center text-slate-400">
          No category data available for visualization.
        </div>
      )}
    </CardContent>
  </Card>
);

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-white/95 border border-slate-200 rounded-xl shadow-2xl text-slate-800 text-sm">
        <p className="font-semibold text-base mb-1">{payload[0].name}</p>
        <p>Assets: <span className="font-bold">{payload[0].value}</span></p>
        <p>Percentage: <span className="font-bold">{(payload[0].percent * 100).toFixed(1)}%</span></p>
      </div>
    );
  }
  return null;
};

const StatusPieChart: React.FC<{ data: AssetStats['statusData'], colors: string[] }> = ({ data, colors }) => (
  <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
    <CardHeader>
      <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
        <PieChartIcon className="h-5 w-5 text-purple-600" /> Asset Status Distribution
      </CardTitle>
    </CardHeader>
    <CardContent>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} stroke={colors[i % colors.length]} strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<CustomPieTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[320px] flex items-center justify-center text-slate-400">
          No status data available for visualization.
        </div>
      )}
    </CardContent>
  </Card>
);

// --- Condition Radar Chart (FIXED) ---
const ConditionRadarChart: React.FC<{ data: AssetStats['conditionData'] }> = ({ data }) => {
  const maxValue = useMemo(() => {
    if (data.length === 0) return 10;
    const maxVal = Math.max(...data.map(d => d.value));
    return maxVal + Math.ceil(maxVal * 0.2); // Add 20% buffer for better visualization
  }, [data]);

  const hasMultipleConditions = data.length > 1;

  return (
    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Zap className="h-5 w-5 text-red-600" /> Asset Condition Intelligence
        </CardTitle>
        <p className="text-sm text-slate-500">
          {hasMultipleConditions ? 'Radar and Bar Chart view for asset condition distribution.' : 'Bar Chart view for single asset condition.'}
        </p>
      </CardHeader>
      <CardContent>
        <div className={`grid grid-cols-1 ${hasMultipleConditions ? 'lg:grid-cols-2' : ''} gap-6`}>
          
          {/* Radar Chart (Only show if multiple conditions exist) */}
          {hasMultipleConditions && (
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={data} outerRadius="80%">
                <PolarGrid />
                <PolarAngleAxis dataKey="name" />
                <PolarRadiusAxis angle={90} domain={[0, maxValue]} />
                <Radar name="Assets" dataKey="value" stroke="#ef4444" fill="#ef4444" fillOpacity={0.7} />
                <Tooltip /> 
              </RadarChart>
            </ResponsiveContainer>
          )}

          {/* Bar Chart (Always show if data exists, horizontal for better label visibility) */}
          {data.length > 0 && (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                {/* YAxis for categories on the vertical chart (horizontal bars) */}
                <YAxis type="category" dataKey="name" stroke="#64748b" style={{ fontSize: '12px' }} />
                {/* XAxis for the value */}
                <XAxis type="number" domain={[0, maxValue]} stroke="#64748b" />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="value" 
                  fill="#10b981" 
                  name="Asset Count"
                  radius={[0, 8, 8, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          )}

        </div>
      </CardContent>
    </Card>
  );
};


// --- Loading & Empty State ---
const LoadingState = () => (
  <div className="flex flex-col justify-center items-center h-[400px]">
    <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
    <p className="text-lg text-slate-600 mt-6 font-medium">Loading asset intelligence...</p>
  </div>
);

const EmptyState: React.FC<{ onAddAsset: () => void }> = ({ onAddAsset }) => (
  <div className="flex flex-col justify-center items-center h-[400px] text-center">
    <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-3xl flex items-center justify-center mb-6 shadow-lg">
      <Package className="h-12 w-12 text-indigo-600" />
    </div>
    <h2 className="text-2xl font-bold text-slate-800 mb-3">No Assets in Portfolio</h2>
    <p className="text-slate-500 mb-8 max-w-md">
      Begin your asset management journey by adding your first asset.
    </p>
    <Button onClick={onAddAsset} size="lg" className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
      <Upload className="mr-2 h-5 w-5" /> Add First Asset
    </Button>
  </div>
);

// --- MAIN DASHBOARD PAGE ---
const Dashboard = () => {
  const navigate = useNavigate();
  const { stats, loading, error, COLORS } = useAssetStats();
  const { isGenerating, generatePdf } = usePdfGeneration();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleNavigate = useCallback((path: string) => () => navigate(path), [navigate]);

  const handleGenerateReport = () => {
    generatePdf('dashboard-content');
  };

  if (loading) return <LoadingState />;
  if (error) return <div className="p-8 text-red-600 bg-red-50">Error: {error}</div>;
  if (!stats) return <EmptyState onAddAsset={handleNavigate('/upload')} />;

  return (
    <div id="dashboard-content" className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">

      {/* HEADER */}
      <div className="relative h-64 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900">
        <img src={heroWarehouse} className="absolute inset-0 w-full h-full object-cover opacity-10" />
        <div className="relative z-10 container mx-auto px-6 h-full flex flex-col justify-center">
          <div className="flex items-center justify-between">

            {/* Logo + Title */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center overflow-hidden">
                <img src="/aspectlogo.jpeg" className="w-full h-full object-contain p-2" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">Executive Dashboard</h1>
                <p className="text-blue-200 text-lg">Enterprise Asset Intelligence</p>
              </div>
            </div>

            {/* Header Buttons */}
            <div className="flex gap-3">
              <Button onClick={handleNavigate('/upload')} className="bg-white/10 text-white">
                <Upload className="mr-2 h-4 w-4" /> Upload Asset
              </Button>

              <Button onClick={handleNavigate('/assets')} className="bg-white/10 text-white">
                <ListOrdered className="mr-2 h-4 w-4" /> View Portfolio
              </Button>

              <Button onClick={handleSignOut} className="bg-white/5 text-white" variant="outline">
                <LogOut className="mr-2 h-4 w-4" /> Sign Out
              </Button>

              <Button onClick={handleNavigate('/tools')} className="bg-white/10 text-white" variant="">
                <LogOut className="mr-2 h-4 w-4" /> Tools
              </Button>

              <Button onClick={handleNavigate('/analytics')} className="bg-white/10 text-white" variant="">
                <LogOut className="mr-2 h-4 w-4" /> Analytics
              </Button>
              

              {/* FIXED JSX COMMENT BLOCK */}
              
              {/* <Button 
                onClick={handleNavigate('/tools')} 
                className="bg-white/10 text-white" 
                variant="secondary"
              >
                <Tools className="mr-2 h-4 w-4" /> Tools
              </Button>

              <Button 
                onClick={handleNavigate('/analytics')} 
                className="bg-white/10 text-white" 
                variant="secondary"
              >
                <Upload className="mr-2 h-4 w-4" /> Analytics
              </Button> */}
             
            </div>

          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="container mx-auto px-6 py-8">

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KpiCard
            title="Total Assets"
            value={stats.totalCount.toLocaleString()}
            icon={Package}
            description="Portfolio actively tracked"
            className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white"
            trend={{ icon: TrendingUp, text: 'Active' }}
          />

          <KpiCard
            title="Portfolio Value"
            value={`£${stats.totalValue.toLocaleString('en-GB')}`}
            icon={DollarSign}
            description="Total valuation"
            className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white"
          />

          <KpiCard
            title="Asset Categories"
            value={Object.keys(stats.byCategory).length.toString()}
            icon={BarChart3}
            description="Diversified categories"
            className="bg-gradient-to-br from-violet-500 to-purple-600 text-white"
          />

          <KpiCard
            title="Average Value"
            value={`£${Math.round(stats.totalValue / stats.totalCount).toLocaleString('en-GB')}`}
            icon={Activity}
            description="Per asset"
            className="bg-gradient-to-br from-amber-500 to-orange-600 text-white"
          />
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard
            title="Portfolio Depreciation"
            value={`${stats.depreciation.toFixed(1)}%`}
            icon={TrendingUp}
            description="Relative to purchase cost"
            iconColor="text-red-500"
          />

          <MetricCard
            title="High-Value Assets"
            value={stats.highValueAssets.toString()}
            icon={AlertCircle}
            description="Above £10,000"
            iconColor="text-amber-500"
          />

          <MetricCard
            title="Asset Diversity"
            value={`${((Object.keys(stats.byCategory).length / stats.totalCount) * 100).toFixed(0)}%`}
            icon={PieChartIcon}
            description="Category spread"
            iconColor="text-blue-500"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <CategoryBarChart data={stats.categoryData} />
          <StatusPieChart data={stats.statusData} colors={COLORS} />
          <ConditionRadarChart data={stats.conditionData} />
        </div>

        {/* Executive Actions */}
        <Card className="border-0 shadow-xl bg-gradient-to-r from-slate-800 to-slate-900 text-white">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Executive Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Button onClick={handleNavigate('/upload')} className="bg-white text-slate-900">
              <Upload className="mr-2 h-4 w-4" /> Register New Asset
            </Button>

            <Button onClick={handleNavigate('/assets')} className="bg-white/10 text-white">
              <ListOrdered className="mr-2 h-4 w-4" /> View Complete Portfolio
            </Button>

            <Button onClick={handleGenerateReport} disabled={isGenerating} className="bg-white/5 text-white" variant="outline">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" /> Generate Report (PDF)
                </>
              )}
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default Dashboard;