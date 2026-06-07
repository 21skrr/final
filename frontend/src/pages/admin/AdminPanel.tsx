import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Users, Briefcase, Settings, Bell, FileText, BarChart2,
  Edit, Shield, ChevronRight, TrendingUp, Activity,
  CheckCircle2, Clock, AlertTriangle
} from 'lucide-react';

const adminFeatures = [
  {
    name: 'User Management',
    path: '/admin/users',
    icon: Users,
    description: 'Add, edit and manage user accounts, roles and departments.',
    color: 'from-blue-500 to-blue-700',
    bg: 'bg-blue-50',
    accent: 'text-blue-600',
    statKey: 'users',
  },
  {
    name: 'Onboarding Management',
    path: '/admin/onboarding',
    icon: Briefcase,
    description: 'Configure onboarding programs, tasks and employee journeys.',
    color: 'from-violet-500 to-violet-700',
    bg: 'bg-violet-50',
    accent: 'text-violet-600',
    statKey: 'employees',
  },
  {
    name: 'Notification Center',
    path: '/admin/notification-center',
    icon: Bell,
    description: 'Create templates, send notifications and manage reminders.',
    color: 'from-amber-500 to-orange-600',
    bg: 'bg-amber-50',
    accent: 'text-amber-600',
    statKey: null,
  },
  {
    name: 'Survey Templates',
    path: '/admin/survey-templates',
    icon: Edit,
    description: 'Create and manage reusable survey templates for all programs.',
    color: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50',
    accent: 'text-emerald-600',
    statKey: 'surveys',
  },
  {
    name: 'Survey Monitoring',
    path: '/admin/survey-monitoring',
    icon: BarChart2,
    description: 'Track survey participation, completion rates and responses.',
    color: 'from-cyan-500 to-blue-600',
    bg: 'bg-cyan-50',
    accent: 'text-cyan-600',
    statKey: null,
  },
  {
    name: 'System Settings',
    path: '/admin/settings',
    icon: Settings,
    description: 'Manage global application settings, branding and configuration.',
    color: 'from-slate-500 to-gray-700',
    bg: 'bg-slate-50',
    accent: 'text-slate-600',
    statKey: null,
  },
];

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({ users: 0, employees: 0, surveys: 0, activeOnboarding: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        const [usersRes, surveysRes] = await Promise.allSettled([
          api.get('/users'),
          api.get('/surveys'),
        ]);
        const users = usersRes.status === 'fulfilled' && Array.isArray(usersRes.value.data) ? usersRes.value.data : [];
        const surveys = surveysRes.status === 'fulfilled' && Array.isArray(surveysRes.value.data) ? surveysRes.value.data : [];
        setStats({
          users: users.length,
          employees: users.filter((u: any) => u.role === 'employee').length,
          surveys: surveys.filter((s: any) => s.status === 'active').length,
          activeOnboarding: users.filter((u: any) => u.role === 'employee' && u.onboardingStatus !== 'completed').length,
        });
      } catch {}
    };
    load();
  }, []);

  const kpis = [
    { label: 'Total Users', value: stats.users, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Employees', value: stats.employees, icon: Briefcase, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Active Surveys', value: stats.surveys, icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'In Onboarding', value: stats.activeOnboarding, icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Header Banner */}
        <div
          className="relative overflow-hidden rounded-2xl p-7 shadow-lg"
          style={{ background: 'linear-gradient(135deg, #002e6d 0%, #224f7d 60%, #2b6298 100%)' }}
        >
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 40%, white 0%, transparent 60%)' }} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <Shield size={16} className="text-blue-300" />
              <span className="text-blue-300 text-sm font-medium">HR Admin Portal</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Control Panel</h1>
            <p className="text-blue-200 text-sm mt-1">
              Welcome, {user?.name} — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map(k => (
            <div key={k.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl ${k.bg} flex items-center justify-center flex-shrink-0`}>
                <k.icon size={20} className={k.color} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{k.value}</div>
                <div className="text-xs text-gray-500 font-medium">{k.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Feature Cards */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Management Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {adminFeatures.map((feature) => {
              const statValue =
                feature.statKey === 'users' ? stats.users
                : feature.statKey === 'employees' ? stats.employees
                : feature.statKey === 'surveys' ? stats.surveys
                : null;

              return (
                <div
                  key={feature.name}
                  onClick={() => navigate(feature.path)}
                  className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-6 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-sm`}>
                      <feature.icon size={22} className="text-white" />
                    </div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-base font-semibold text-gray-900">{feature.name}</h3>
                      {statValue !== null && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${feature.bg} ${feature.accent} flex-shrink-0`}>
                          {statValue}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
                  </div>
                  <div className={`flex items-center gap-1 mt-4 text-sm font-medium ${feature.accent} opacity-0 group-hover:opacity-100 transition-opacity`}>
                    Open <ChevronRight size={14} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-500" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Add Employee', path: '/admin/add-employee', icon: Users },
              { label: 'Survey Analytics', path: '/admin/survey-analytics', icon: BarChart2 },
              { label: 'HR Evaluations', path: '/admin/evaluations', icon: CheckCircle2 },
              { label: 'Roles & Permissions', path: '/admin/roles', icon: Shield },
            ].map(a => (
              <button
                key={a.label}
                onClick={() => navigate(a.path)}
                className="flex items-center gap-2.5 px-4 py-3 bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-200 rounded-xl text-sm font-medium text-gray-700 hover:text-blue-700 transition-all text-left"
              >
                <a.icon size={15} className="flex-shrink-0" />
                {a.label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default AdminPanel;