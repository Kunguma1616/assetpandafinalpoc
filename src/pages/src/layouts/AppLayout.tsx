import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Upload, BarChart3, Package, Hammer, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const AppLayout = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const menu = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { name: "Upload Asset", icon: Upload, path: "/upload" },
    { name: "Analytics", icon: BarChart3, path: "/analytics" },
    { name: "Assets", icon: Package, path: "/assets" },
    { name: "Tools", icon: Hammer, path: "/tools" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r shadow-md p-5 space-y-4 sticky top-0 h-screen">

        <div className="flex items-center gap-3 mb-6">
          <img src="/aspectlogo.jpeg" className="h-10 w-10 rounded-md" />
          <h2 className="text-xl font-bold">AssetWise</h2>
        </div>

        <nav className="space-y-2">
          {menu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-lg font-medium ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-200"
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          ))}

          {/* LOGOUT */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 p-3 rounded-lg text-red-600 hover:bg-red-100 w-full mt-6"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout; 