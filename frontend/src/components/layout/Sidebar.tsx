import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Briefcase,
  FileText,
  Calendar,
  CheckSquare,
  MessageSquare,
  Award,
  Users,
  Settings,
  HelpCircle,
  ChevronRight,
  Menu,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { UserRole } from "../../types/user";

interface NavItem {
  icon: React.ReactNode;
  title: string;
  path: string;
  roles: UserRole[];
  children?: { title: string; path: string }[];
}

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!user) return null;

  const navItems: NavItem[] = [
    {
      icon: <Home size={20} />,
      title: "Dashboard",
      path: "/dashboard",
      roles: ["employee", "supervisor", "hr", "manager"],
    },
    {
      icon: <Briefcase size={20} />,
      title: "Programs",
      path: "/programs",
      roles: ["employee", "supervisor", "hr", "manager"],
      children: [
        { title: "INKOMPASS", path: "/programs/inkompass" },
        { title: "Early Talent", path: "/programs/early-talent" },
        { title: "Apprenticeship", path: "/programs/apprenticeship" },
        { title: "Academic Placement", path: "/programs/academic-placement" },
        { title: "Work Experience", path: "/programs/work-experience" },
      ],
    },
    {
      icon: <CheckSquare size={20} />,
      title: "Checklists",
      path: "/checklists",
      roles: ["employee", "supervisor", "hr"],
    },
    {
      icon: <Calendar size={20} />,
      title: "Calendar",
      path: "/calendar",
      roles: ["employee", "supervisor", "hr", "manager"],
    },
    {
      icon: <FileText size={20} />,
      title: "Forms & Surveys",
      path: "/forms",
      roles: ["employee", "supervisor", "hr", "manager"],
    },
    {
      icon: <Award size={20} />,
      title: "Evaluations",
      path: "/evaluations",
      roles: ["employee", "supervisor", "manager"],
    },
    {
      icon: <MessageSquare size={20} />,
      title: "Feedback",
      path: "/feedback",
      roles: ["employee", "supervisor", "hr", "manager"],
    },
    {
      icon: <Users size={20} />,
      title: "Team",
      path: "/team",
      roles: ["supervisor", "manager"],
    },
    {
      icon: <Settings size={20} />,
      title: "Admin",
      path: "/admin",
      roles: ["hr"],
      children: [
        { title: "User Management", path: "/admin/users" },
        { title: "Roles & Permissions", path: "/admin/roles" },
        { title: "System Settings", path: "/admin/settings" },
      ],
    },
    {
      icon: <HelpCircle size={20} />,
      title: "Help & Resources",
      path: "/resources",
      roles: ["employee", "supervisor", "hr", "manager"],
    },
  ];

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(user.role)
  );
  const isActive = (path: string) => location.pathname.startsWith(path);

  const handleToggleExpand = (title: string) => {
    setExpandedItem(expandedItem === title ? null : title);
  };

  return (
    <>
      {/* Collapse/Expand Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="fixed top-4 left-4 z-50 bg-[#0072CE] text-white p-2 rounded-md md:hidden"
      >
        <Menu size={20} />
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed md:static top-0 left-0 bg-[#E6F0FA] border-r border-gray-200 h-full w-64 transform ${
          isCollapsed ? "-translate-x-full" : "translate-x-0"
        } transition-transform duration-300 ease-in-out z-40 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-300`}
      >
        <div className="px-4 py-6">
          {/* User Profile */}
          <div className="px-3 py-4 bg-white rounded-lg shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-[#0072CE] flex items-center justify-center text-white font-semibold">
                {user.name?.charAt(0) || "U"}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="mt-8 space-y-2">
            {filteredNavItems.map((item) => (
              <div key={item.title}>
                {item.children ? (
                  <div>
                    <button
                      onClick={() => handleToggleExpand(item.title)}
                      className={`flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md transition ${
                        expandedItem === item.title
                          ? "bg-white text-[#0072CE] shadow-sm"
                          : "hover:bg-white text-gray-700"
                      }`}
                    >
                      <div className="flex items-center">
                        <span className="mr-3 text-gray-500">{item.icon}</span>
                        {item.title}
                      </div>
                      <ChevronRight
                        size={16}
                        className={`transition-transform ${
                          expandedItem === item.title ? "rotate-90" : ""
                        }`}
                      />
                    </button>

                    {expandedItem === item.title && (
                      <div className="pl-8 mt-1 space-y-1">
                        {item.children.map((child) => (
                          <Link
                            key={child.path}
                            to={child.path}
                            className={`block px-3 py-2 text-sm rounded-md transition ${
                              isActive(child.path)
                                ? "bg-white text-[#0072CE] font-semibold"
                                : "hover:bg-white text-gray-700"
                            }`}
                          >
                            {child.title}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to={item.path}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition ${
                      isActive(item.path)
                        ? "bg-white text-[#0072CE] shadow-sm"
                        : "hover:bg-white text-gray-700"
                    }`}
                  >
                    <span className="mr-3 text-gray-500">{item.icon}</span>
                    {item.title}
                  </Link>
                )}
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
