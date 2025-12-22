import React, { useState } from "react";
// Removed useNavigate to fully handle routing internally and avoid 404s
// import { useNavigate } from "react-router-dom"; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Search,
  Filter,
  Download,
  ArrowLeft,
  Bell,
  Settings,
  Users,
  Calendar,
  MapPin,
  AlertCircle,
  CheckCircle,
  Clock,
  Mail,
  User,
  LogOut,
  SlidersHorizontal
} from "lucide-react";

// --- MOCK DATA (Unchanged) ---
const assetValueData = [
  { month: "Jan", value: 2100000 },
  { month: "Feb", value: 2180000 },
  { month: "Mar", value: 2250000 },
  { month: "Apr", value: 2320000 },
  { month: "May", value: 2380000 },
  { month: "Jun", value: 2450000 },
];

const utilizationData = [
  { month: "Jan", utilization: 78, target: 85 },
  { month: "Feb", utilization: 82, target: 85 },
  { month: "Mar", utilization: 85, target: 85 },
  { month: "Apr", utilization: 88, target: 85 },
  { month: "May", utilization: 86, target: 85 },
  { month: "Jun", utilization: 90, target: 85 },
];

const categoryData = [
  { category: "Electrical Tools", count: 285, value: 145000 },
  { category: "Vehicles & Vans", count: 42, value: 890000 },
  { category: "Drainage Equipment", count: 156, value: 98000 },
  { category: "Carpentry Tools", count: 312, value: 125000 },
  { category: "Heavy Machinery", count: 38, value: 1580000 },
  { category: "Mobile Equipment", count: 194, value: 67000 },
];

const statusData = [
  { name: "Active", value: 756, color: "#10b981" },
  { name: "Maintenance", value: 124, color: "#f59e0b" },
  { name: "Retired", value: 89, color: "#ef4444" },
  { name: "Reserved", value: 58, color: "#3b82f6" },
];

const recentAssets = [
  { id: "ELC-045", name: "Milwaukee M18 Drill Set", category: "Electrical Tools", location: "Site A - Storage", status: "Active", assignee: "James Wilson", value: "£450" },
  { id: "VAN-012", name: "Ford Transit Custom Van", category: "Vehicles & Vans", location: "Main Depot", status: "Active", assignee: "Robert Taylor", value: "£28,500" },
  { id: "DRN-089", name: "High Pressure Jetter", category: "Drainage Equipment", location: "Site B - Equipment Bay", status: "Maintenance", assignee: "Michael Brown", value: "£3,200" },
  { id: "CAT-156", name: "CAT Excavator 320", category: "Heavy Machinery", location: "Construction Site C", status: "Active", assignee: "David Martinez", value: "£185,000" },
  { id: "CRP-234", name: "Makita Circular Saw Kit", category: "Carpentry Tools", location: "Workshop 2", status: "Active", assignee: "Thomas Anderson", value: "£380" },
  { id: "MOB-078", name: "Samsung Galaxy Tab S8", category: "Mobile Equipment", location: "Site Manager Office", status: "Reserved", assignee: "Sarah Johnson", value: "£650" },
  { id: "ELC-102", name: "Cable Fault Locator", category: "Electrical Tools", location: "Electrical Van 3", status: "Active", assignee: "Kevin Lee", value: "£1,850" },
  { id: "DRN-045", name: "CCTV Drain Camera System", category: "Drainage Equipment", location: "Drainage Team Base", status: "Active", assignee: "Mark Thompson", value: "£4,500" },
  { id: "VAN-008", name: "Mercedes Sprinter Cargo", category: "Vehicles & Vans", location: "Main Depot", status: "Maintenance", assignee: "Chris Evans", value: "£32,000" },
  { id: "CRP-089", name: "DeWalt Table Saw Pro", category: "Carpentry Tools", location: "Carpentry Workshop", status: "Active", assignee: "Paul Harris", value: "£890" },
];

// --- NEW PLACEHOLDER COMPONENTS (Unchanged) ---

const NotificationsPage = ({ onBack }) => (
    <Card className="shadow-lg border-t-4 border-yellow-500/50">
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-2xl flex items-center">
                <Bell className="w-6 h-6 mr-2 text-yellow-600" /> System Notifications
            </CardTitle>
            <button
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium flex items-center"
                onClick={onBack}
            >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Analytics
            </button>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
            <p className="text-lg font-medium text-slate-700">Recent Alerts:</p>
            <div className="border p-3 rounded-lg flex items-start space-x-3 bg-red-50/50">
                <AlertCircle className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                <p className="text-sm">**Urgent:** Asset **DRN-089** (High Pressure Jetter) maintenance overdue by 3 days.</p>
            </div>
            <div className="border p-3 rounded-lg flex items-start space-x-3 bg-green-50/50">
                <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                <p className="text-sm">Asset **ELC-045** check-in confirmed by James Wilson.</p>
            </div>
            <div className="border p-3 rounded-lg flex items-start space-x-3 bg-blue-50/50">
                <Clock className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                <p className="text-sm">Upcoming: Annual service due for **VAN-012** (Ford Transit) next week.</p>
            </div>
        </CardContent>
    </Card>
);

const SettingsPage = ({ onBack }) => (
    <Card className="shadow-lg border-t-4 border-indigo-500/50">
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-2xl flex items-center">
                <SlidersHorizontal className="w-6 h-6 mr-2 text-indigo-600" /> Application Settings
            </CardTitle>
            <button
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium flex items-center"
                onClick={onBack}
            >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Analytics
            </button>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
            <h3 className="text-xl font-semibold border-b pb-2 flex items-center"><User className="w-5 h-5 mr-2" /> User Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <p><strong>Name:</strong> John Doe</p>
                <p><strong>Role:</strong> Engineering Manager</p>
                <p><strong>Email:</strong> john.doe@company.com</p>
            </div>
            
            <h3 className="text-xl font-semibold border-b pb-2 flex items-center"><Mail className="w-5 h-5 mr-2" /> Notification Preferences</h3>
            <div className="space-y-2">
                <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                    <span>Receive email alerts for overdue maintenance.</span>
                </label>
                <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                    <span>Receive desktop notifications for high-value asset check-ins.</span>
                </label>
            </div>
            
            <button className="flex items-center text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
            </button>
        </CardContent>
    </Card>
);

// --- MAIN ANALYTICS COMPONENT ---

const Analytics = () => {
  // STATE INITIALIZATION
  const [currentView, setCurrentView] = useState("analytics");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  
  // --- HANDLERS ---
  const handleExport = () => {
    alert("Exporting current analytics data to CSV/Excel...");
    console.log("Export triggered for filtered data.");
  };

  const handleJdClick = () => {
    setCurrentView("analytics"); 
    console.log("JD button clicked. Setting view to 'analytics' (simulating dashboard/profile exit).");
  };

  const handleBack = () => {
    setCurrentView("analytics"); 
  };
  
  // FILTERING LOGIC 
  const filteredAssets = recentAssets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || asset.category === selectedCategory;
    const matchesStatus =
      selectedStatus === "All" || asset.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // --- CONDITIONAL RENDERING ---

  if (currentView === 'notifications') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 md:p-10">
        <NotificationsPage onBack={handleBack} />
      </div>
    );
  }

  if (currentView === 'settings') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 md:p-10">
        <SettingsPage onBack={handleBack} />
      </div>
    );
  }

  // --- Analytics View (Main Content) ---

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            
            <div className="flex items-center gap-4">
              {/* ⭐ FIX APPLIED HERE: Uses window.history.back() for real browser back navigation */}
              <button
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                onClick={() => window.history.back()} 
              >
                <ArrowLeft className="w-5 h-5 text-slate-700" />
              </button>

              <div>
                <h1 className="text-2xl font-bold text-slate-900">Asset Analytics</h1>
                <p className="text-sm text-slate-500">Engineering Department</p>
              </div>
            </div>

            <div className="flex items-center gap-3">

              {/* NOTIFICATIONS Button - Now switches view */}
              <button
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors relative"
                onClick={() => setCurrentView("notifications")}
              >
                <Bell className="w-5 h-5 text-slate-700" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* SETTINGS Button - Now switches view */}
              <button
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                onClick={() => setCurrentView("settings")}
              >
                <Settings className="w-5 h-5 text-slate-700" />
              </button>

              {/* JD Button - Now switches view/simulates profile navigation */}
              <button 
                onClick={handleJdClick} 
                className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold hover:opacity-80 transition-opacity"
              >
                JD
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto p-6">

        {/* Search + Filters + Export */}
        <Card className="mb-6 border-0 shadow-lg bg-white">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search assets by name or ID..."
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <select
                  className="px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="All">All Categories</option>
                  <option value="Electrical Tools">Electrical Tools</option>
                  <option value="Vehicles & Vans">Vehicles & Vans</option>
                  <option value="Drainage Equipment">Drainage Equipment</option>
                  <option value="Carpentry Tools">Carpentry Tools</option>
                  <option value="Heavy Machinery">Heavy Machinery</option>
                  <option value="Mobile Equipment">Mobile Equipment</option>
                </select>
                <select
                  className="px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Retired">Retired</option>
                  <option value="Reserved">Reserved</option>
                </select>
                {/* EXPORT Button Functionality */}
                <button 
                  onClick={handleExport}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center gap-2 font-medium shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics (Unchanged for brevity) */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Charts/Metrics UI logic here */}
        </div>

        {/* Charts Section (Unchanged for brevity) */}
        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          {/* Charts UI logic here */}
        </div>

        {/* Two More Charts (Unchanged for brevity) */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* Charts UI logic here */}
        </div>

        {/* Recent Assets Table */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-slate-900">
                  Recent Assets
                </CardTitle>
                <p className="text-sm text-slate-500 mt-1">
                  Latest tracked assets in the system
                </p>
              </div>

              {/* View All Button (Using alert as placeholder for navigation) */}
              <button
                onClick={() => alert("Navigating to the full Assets List page.")}
                className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
              >
                View All
              </button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Asset ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Assignee
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Value
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {filteredAssets.map((asset, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono font-semibold text-blue-600">
                          {asset.id}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-slate-900">
                          {asset.name}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">
                          {asset.category}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <MapPin className="w-3 h-3" />
                          {asset.location}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            asset.status === "Active"
                              ? "bg-emerald-100 text-emerald-700"
                              : asset.status === "Maintenance"
                              ? "bg-amber-100 text-amber-700"
                              : asset.status === "Reserved"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {asset.status}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
                            {asset.assignee
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <span className="text-sm text-slate-700">
                            {asset.assignee}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-slate-900">
                          {asset.value}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;