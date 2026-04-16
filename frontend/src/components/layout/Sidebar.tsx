import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Briefcase, CheckSquare, FileText, Calendar, MessageSquare, ChevronDown, ChevronUp, BarChart2, Bell, Shield, PieChart, BookOpen, Monitor, BarChart, Settings, UserCheck } from 'lucide-react';
import { useAuth } from "../../context/AuthContext";
import { UserRole } from "../../types/user";
import { useSupervisorAssessments } from "../../hooks/useSupervisorAssessments";

// Organized navigation structure with sections
const navSections = [
    {
        name: 'Main',
        items: [
            { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['employee', 'hr', 'manager', 'supervisor'] },
            { name: 'Programs', path: '/programs', icon: Briefcase, roles: ['employee', 'hr', 'manager', 'supervisor'] },
            { name: 'Calendar', path: '/calendar', icon: Calendar, roles: ['employee', 'hr', 'manager', 'supervisor'] },
            { name: 'Requests', path: '/feedback', icon: MessageSquare, roles: ['employee', 'hr', 'manager', 'supervisor'] },
            { name: 'Help & Resources', path: '/resources', icon: BookOpen, roles: ['employee', 'hr', 'manager', 'supervisor'] },
        ]
    },
    {
        name: 'Evaluations',
        items: [
            { name: 'My Evaluations', path: '/evaluations', icon: FileText, roles: ['employee'] },
            { name: 'Team Evaluations', path: '/supervisor/evaluations', icon: Users, roles: ['supervisor'] },
            { name: 'Supervisor Assessments', path: '/supervisor/assessments', icon: UserCheck, roles: ['supervisor'] },
            { name: 'Team Evaluations', path: '/manager/evaluations', icon: Users, roles: ['manager'] },
            { name: 'Evaluation Reports', path: '/manager/evaluations/reports', icon: BarChart2, roles: ['manager'] },
            { name: 'All Evaluations', path: '/admin/evaluations', icon: FileText, roles: ['hr'] },
            { name: 'Evaluation Analytics', path: '/admin/evaluations/reports', icon: BarChart2, roles: ['hr'] },
            { name: 'HR Validation Queue', path: '/hr/validation-queue', icon: Shield, roles: ['hr'] },
            { name: 'HR Assessment Queue', path: '/admin/assessment-queue', icon: Shield, roles: ['hr'] },
        ]
    },
    {
        name: 'Management',
        items: [
            { name: 'Forms & Surveys', path: '/forms', icon: FileText, roles: ['employee', 'hr'] },
            { name: 'Checklists', path: '/checklists', icon: CheckSquare, roles: ['employee', 'hr'] },
            { name: 'Team Checklists', path: '/supervisor/team-checklists', icon: CheckSquare, roles: ['supervisor'] },
            { name: 'Department Checklists', path: '/manager/checklist-dashboard', icon: CheckSquare, roles: ['manager'] },
            { name: 'Department Surveys', path: '/manager/department-surveys', icon: PieChart, roles: ['manager'] },
            { name: 'Team Surveys', path: '/supervisor/team-surveys', icon: Users, roles: ['supervisor'] },
            { name: 'Onboarding Management', path: '/manager/onboarding', icon: Briefcase, roles: ['manager'] },
            { name: 'Onboarding Management', path: '/supervisor/onboarding', icon: Briefcase, roles: ['supervisor'] },
            { name: 'My Onboarding Progress', path: '/supervisor/my-onboarding', icon: CheckSquare, roles: ['supervisor'] },
        ]
    },
    {
        name: 'Admin',
        items: [
            { name: 'Admin Panel', path: '/admin', icon: Settings, roles: ['hr'] },
            { name: 'Notification Control Center', path: '/admin/notification-center', icon: Bell, roles: ['hr'] },
            {
                name: 'Surveys',
                path: '/admin/surveys',
                icon: BarChart,
                roles: ['hr'],
                children: [
                    { name: 'Survey Templates', path: '/admin/survey-templates', icon: FileText, roles: ['hr'] },
                    { name: 'Survey Monitoring', path: '/admin/survey-monitoring', icon: Monitor, roles: ['hr'] },
                    { name: 'Survey Analytics', path: '/admin/survey-analytics', icon: BarChart, roles: ['hr'] },
                ]
            },
        ]
    }
];

const Sidebar: React.FC = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [expandedItem, setExpandedItem] = useState<string | null>(null);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['Main'])); // Main section expanded by default
    const { pendingAssessments, pendingHRAssessments } = useSupervisorAssessments();


    const toggleExpand = (itemName: string) => {
        setExpandedItem(expandedItem === itemName ? null : itemName);
    };

    const toggleSection = (sectionName: string) => {
        const newExpandedSections = new Set(expandedSections);
        if (newExpandedSections.has(sectionName)) {
            newExpandedSections.delete(sectionName);
        } else {
            newExpandedSections.add(sectionName);
        }
        setExpandedSections(newExpandedSections);
    };

    // Filter sections and items based on user role
    const filteredNavSections = user ? navSections.map(section => ({
        ...section,
        items: section.items.filter(item => item.roles.includes(user.role as UserRole))
    })).filter(section => section.items.length > 0) : [];

    return (
        <aside className="w-64 flex-shrink-0 bg-white/80 backdrop-blur-md shadow-glass border-r border-white/50 flex flex-col h-full">
            <div className="p-4 border-b">
                <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-pmi-600 to-pmi-800 shadow-md border border-white text-white flex items-center justify-center font-bold">
                        {user?.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-semibold text-gray-800">{user?.name}</p>
                        <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
                    </div>
                </div>
            </div>

            <nav className="mt-4 pb-4 space-y-2 overflow-y-auto flex-1">
                {filteredNavSections.map((section) => (
                    <div key={section.name} className="space-y-1">
                        {/* Section Header */}
                        <button
                            onClick={() => toggleSection(section.name)}
                            className="flex items-center justify-between w-full px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
                        >
                            <span>{section.name}</span>
                            {expandedSections.has(section.name) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>

                        {/* Section Items */}
                        {expandedSections.has(section.name) && (
                            <div className="space-y-1">
                                {section.items.map((item) => (
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
                                                    ? 'bg-pmi-50 text-pmi-800 shadow-sm border border-pmi-100'
                                                    : 'text-slate-600 hover:bg-slate-50'
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
                                                {item.name === 'HR Assessment Queue' && pendingHRAssessments > 0 && (
                                                    <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                                        {pendingHRAssessments}
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
                                                                ? 'text-pmi-800 font-semibold bg-pmi-50/50'
                                                                : 'text-slate-500 hover:text-pmi-700 hover:bg-slate-50'
                                                        }`}
                                                    >
                                                        {child.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
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