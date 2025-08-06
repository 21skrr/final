import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CheckSquare,
  FileText,
  Calendar,
  MessageSquare,
  HelpCircle,
  LogOut,
  ChevronDown,
  ChevronUp,
  BarChart2,
  Send,
  Layers,
  Bell,
  Shield,
  PieChart,
  BookOpen,
  Settings,
  Monitor,
  BarChart
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { UserRole } from "../../types/user";
import { useSupervisorAssessments } from "../../hooks/useSupervisorAssessments";

// Unified link structure
interface NavLink {
    name: string;
    path: string;
    icon: React.ElementType;
    children?: NavLink[];
    roles: UserRole[];
}

const navItems: NavLink[] = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['employee', 'hr', 'manager', 'supervisor'] },
    { name: 'Programs', path: '/programs', icon: Briefcase, roles: ['employee', 'hr', 'manager', 'supervisor'] },
    { name: 'Checklists', path: '/checklists', icon: CheckSquare, roles: ['employee', 'hr', 'manager', 'supervisor'] },
    { name: 'Forms & Surveys', path: '/forms', icon: FileText, roles: ['employee', 'hr'] },
    { name: 'Calendar', path: '/calendar', icon: Calendar, roles: ['employee', 'hr', 'manager', 'supervisor'] },
    { name: 'Feedback', path: '/feedback', icon: MessageSquare, roles: ['employee', 'hr', 'manager', 'supervisor'] },
    { name: 'Help & Resources', path: '/resources', icon: BookOpen, roles: ['employee', 'hr', 'manager', 'supervisor'] },
    // Evaluation links by role
    { name: 'Evaluations', path: '/evaluations', icon: FileText, roles: ['employee'] },
    { name: 'My Team Evaluations', path: '/supervisor/evaluations', icon:Users, roles: ['supervisor'] },
    { name: 'Supervisor Assessments', path: '/supervisor/assessments', icon:Users, roles: ['supervisor'] },
    { name: 'Team Evaluations', path: '/manager/evaluations', icon:Users, roles: ['manager'] },
    { name: 'Evaluation Reports', path: '/manager/evaluations/reports', icon:BarChart2, roles: ['manager'] },
    { name: 'All Evaluations', path: '/admin/evaluations', icon:FileText, roles: ['hr'] },
    { name: 'Evaluation Analytics', path: '/admin/evaluations/reports', icon:BarChart2, roles: ['hr'] },
    { name: 'HR Validation Queue', path: '/hr/validation-queue', icon:Shield, roles: ['hr'] },
    { name: 'HR Assessment Queue', path: '/admin/assessment-queue', icon:Shield, roles: ['hr'] },
    // Role-specific checklist links
    { name: 'Team Checklists', path: '/supervisor/team-checklists', icon: CheckSquare, roles: ['supervisor'] },
    { name: 'Department Checklists', path: '/manager/checklist-dashboard', icon: CheckSquare, roles: ['manager'] },
    { name: 'Notification Control Center', path: '/admin/notification-center', icon: Bell, roles: ['hr'] },
    { name: 'Admin', path: '/admin', icon: Shield, roles: ['hr'] },
    { name: 'Department Surveys', path: '/manager/department-surveys', icon: PieChart, roles: ['manager'] },
    { name: 'Team Surveys', path: '/supervisor/team-surveys', icon: Users, roles: ['supervisor'] },
    { name: 'Onboarding Management', path: '/manager/onboarding', icon: Briefcase, roles: ['manager'] },
    { name: 'Onboarding Management', path: '/supervisor/onboarding', icon: Briefcase, roles: ['supervisor'] },
    {
      name: 'Surveys',
      path: '/admin/surveys',
      icon: BarChart,
      roles: ['hr'],
      children: [
        { name: 'Survey Templates', path: '/admin/survey-templates', icon: FileText, roles: ['hr'] },
        { name: 'Survey Settings', path: '/admin/survey-settings', icon: Settings, roles: ['hr'] },
        { name: 'Survey Monitoring', path: '/admin/survey-monitoring', icon: Monitor, roles: ['hr'] },
        { name: 'Survey Analytics', path: '/admin/survey-analytics', icon: BarChart, roles: ['hr'] },
      ]
    },
];

const Sidebar: React.FC = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [expandedItem, setExpandedItem] = useState<string | null>(null);
    const { pendingAssessments, pendingHRApprovals } = useSupervisorAssessments();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleExpand = (itemName: string) => {
        setExpandedItem(expandedItem === itemName ? null : itemName);
    };

    // Only show navigation items allowed for the current user's role
    const filteredNavItems = user ? navItems.filter(item => item.roles.includes(user.role as UserRole)) : [];

    return (
        <aside className="w-64 flex-shrink-0 bg-white shadow-md">
            <div className="p-4 border-b">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                        {user?.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-semibold text-gray-800">{user?.name}</p>
                        <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
                    </div>
                </div>
            </div>

            <nav className="mt-4 pb-4 space-y-1 overflow-y-auto" style={{ height: 'calc(100vh - 150px)'}}>
                {filteredNavItems.map((item) => (
                    <div key={item.name}>
                        <Link
                            to={item.path}
                            onClick={(e) => {
                                if (item.children) {
                                    e.preventDefault();
                                    toggleExpand(item.name);
                                }
                            }}
                            className={`flex items-center justify-between px-4 py-2.5 text-sm font-medium rounded-md mx-2 transition-colors ${
                                location.pathname.startsWith(item.path)
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            <div className="flex items-center">
                                <item.icon className="w-5 h-5 mr-3" />
                                <span>{item.name}</span>
                                {item.name === 'Supervisor Assessments' && pendingAssessments > 0 && (
                                    <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                        {pendingAssessments}
                                    </span>
                                )}
                                {item.name === 'HR Validation Queue' && pendingHRApprovals > 0 && (
                                    <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                        {pendingHRApprovals}
                                    </span>
                                )}
                            </div>
                            {item.children && (
                                expandedItem === item.name ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                            )}
                        </Link>
                        {item.children && expandedItem === item.name && (
                            <div className="pl-8 pt-1">
                                {item.children.map(child => (
                                    <Link
                                        key={child.name}
                                        to={child.path}
                                        className={`flex items-center px-4 py-2 text-sm rounded-md transition-colors ${
                                            location.pathname === child.path
                                                ? 'text-blue-700 font-semibold'
                                                : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        {child.name}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;