import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const Sidebar = () => {
  const links = [
    { name: "Home", to: "/index" },
    { name: "Upload", to: "/upload" },
    { name: "Dashboard", to: "/dashboard" },
    { name: "Analytics", to: "/analytics" },
    { name: "Assets", to: "/assets" },
    { name: "Tools", to: "/tools" },
  ];

  return (
    <div className="w-64 bg-card border-r min-h-screen p-4">
      <h2 className="text-xl font-bold mb-6">Menu</h2>

      <nav className="space-y-2">
        {links.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "block px-4 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition",
                isActive && "bg-primary text-primary-foreground"
              )
            }
          >
            {item.name}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
