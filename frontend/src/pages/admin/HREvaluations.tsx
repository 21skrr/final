import React, { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { getAllEvaluations, deleteEvaluation, validateEvaluation } from '../../services/evaluationService';
import { Evaluation } from '../../types/evaluation';
import { ClipboardCheck, Star, Edit, Trash2, CheckCircle, PlusCircle, TrendingUp, BarChart3, Download, Filter, Search, Users, AlertCircle, Clock, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Tabs, Tab } from '@mui/material';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { API_BASE_URL } from '../../config';
import { Dialog } from '@mui/material';
import userService from '../../services/userService';
import { User } from '../../types/user';

const EVAL_TYPES = [
  { value: '3-month', label: '3-Month' },
  { value: '6-month', label: '6-Month' },
  { value: '12-month', label: '12-Month' },
  { value: 'performance', label: 'Performance' },
];

const HREvaluations: React.FC = () => {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [validating, setValidating] = useState<string | null>(null);
  const navigate = useNavigate();
  const [tab, setTab] = useState<'assignments' | 'templates' | 'analytics'>('assignments');
  const [editEval, setEditEval] = useState<Evaluation | null>(null);
  const [editType, setEditType] = useState('3-month');
  const [editDue, setEditDue] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Add mock template data for demonstration
  const mockTemplates = [
    { id: 't1', title: '3-month Review', type: '3-month', usedFor: 'All Employees', status: 'active' },
    { id: 't2', title: '6-month Review', type: '6-month', usedFor: 'Managers', status: 'active' },
    { id: 't3', title: 'Performance Review', type: 'performance', usedFor: 'All', status: 'archived' },
  ];

  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateType, setTemplateType] = useState('3-month');
  const [templateUsedFor, setTemplateUsedFor] = useState('All Employees');

  // Mock evaluators and assignments for demonstration
  const mockEvaluators = [
    { id: 'e1', name: 'Jane Supervisor' },
    { id: 'e2', name: 'John Manager' },
  ];
  const mockAssignments = [
    { id: 'a1', employee: 'Alice Employee', evaluator: 'Jane Supervisor', type: '3-month', dueDate: '2024-08-01', status: 'pending', progress: 0 },
    { id: 'a2', employee: 'Bob Employee', evaluator: 'John Manager', type: '6-month', dueDate: '2024-09-15', status: 'in_progress', progress: 50 },
    { id: 'a3', employee: 'Charlie Employee', evaluator: 'Jane Supervisor', type: 'performance', dueDate: '2024-07-20', status: 'completed', progress: 100 },
  ];
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterEvaluator, setFilterEvaluator] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [employeeOptions, setEmployeeOptions] = useState<User[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [employeeDropdownOpen, setEmployeeDropdownOpen] = useState(false);
  const [scheduleEvaluator, setScheduleEvaluator] = useState('');
  const [scheduleType, setScheduleType] = useState('3-month');
  const [scheduleDue, setScheduleDue] = useState('');
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [showAdvancedAnalytics, setShowAdvancedAnalytics] = useState(false);

  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        const response = await getAllEvaluations();
        setEvaluations(response.data || []);
      } catch (err) {
        setError('Failed to load evaluations');
      } finally {
        setLoading(false);
      }
    };
    fetchEvaluations();
  }, []);

  // Fetch employees when modal opens
  useEffect(() => {
    if (showScheduleModal) {
      userService.getEmployees().then(setEmployeeOptions);
      setEmployeeSearch('');
      setSelectedEmployee(null);
    }
  }, [showScheduleModal]);
  // Filter employees as user types, or show all if search is empty
  const filteredEmployees = employeeOptions.filter(e =>
    employeeSearch.trim() === '' ||
    e.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
    e.email.toLowerCase().includes(employeeSearch.toLowerCase())
  );
  console.log('employeeOptions', employeeOptions);
  console.log('filteredEmployees', filteredEmployees);

  // Enhanced analytics functions
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'validated':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'in_progress':
        return <ClipboardCheck className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'validated':
        return <Star className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getOverdueEvaluations = () => {
    return evaluations.filter(evaluation => {
      const daysUntil = getDaysUntilDue(evaluation.dueDate);
      return daysUntil < 0 && evaluation.status !== 'completed' && evaluation.status !== 'validated';
    });
  };

  const getPendingValidations = () => {
    return evaluations.filter(evaluation => evaluation.status === 'completed' && !evaluation.reviewedBy);
  };

  const getDepartmentStats = () => {
    const departments = [...new Set(evaluations.map(evaluation => evaluation.employee?.department).filter(Boolean))];
    return departments.map(dept => ({
      name: dept,
      total: evaluations.filter(evaluation => evaluation.employee?.department === dept).length,
      completed: evaluations.filter(evaluation => evaluation.employee?.department === dept && evaluation.status === 'completed').length,
      pending: evaluations.filter(evaluation => evaluation.employee?.department === dept && evaluation.status === 'pending').length,
      overdue: evaluations.filter(evaluation => {
        const daysUntil = getDaysUntilDue(evaluation.dueDate);
        return evaluation.employee?.department === dept && daysUntil < 0 && evaluation.status !== 'completed' && evaluation.status !== 'validated';
      }).length
    }));
  };

  const getTypeStats = () => {
    const types = [...new Set(evaluations.map(evaluation => evaluation.type))];
    return types.map(type => ({
      name: type,
      total: evaluations.filter(evaluation => evaluation.type === type).length,
      completed: evaluations.filter(evaluation => evaluation.type === type && evaluation.status === 'completed').length,
      pending: evaluations.filter(evaluation => evaluation.type === type && evaluation.status === 'pending').length
    }));
  };

  const filteredEvaluations = evaluations.filter(evaluation => {
    const matchesSearch = evaluation.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         evaluation.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         evaluation.supervisor?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || evaluation.status === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || evaluation.employee?.department === departmentFilter;
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this evaluation?')) return;
    setDeleting(id);
    try {
      await deleteEvaluation(id);
      const response = await getAllEvaluations();
      setEvaluations(response.data || []);
    } catch (err) {
      alert('Failed to delete evaluation');
    } finally {
      setDeleting(null);
    }
  };

  const handleValidate = async (id: string) => {
    setValidating(id);
    try {
      await validateEvaluation(id, { reviewNotes: 'Validated by HR', status: 'completed' });
      const response = await getAllEvaluations();
      setEvaluations(response.data || []);
    } catch (err) {
      alert('Failed to validate evaluation');
    } finally {
      setValidating(null);
    }
  };

  const openEdit = (ev: Evaluation) => {
    setEditEval({
      ...ev,
      title: ev.title || `${ev.type} Evaluation`, // fallback if missing
    });
    setEditType(ev.type);
    setEditDue(ev.dueDate ? ev.dueDate.split('T')[0] : '');
  };
  const closeEdit = () => { setEditEval(null); setEditSaving(false); };
  const saveEdit = async () => {
    if (!editEval) return;
    setEditSaving(true);
    try {
      await api.put(`/evaluations/${editEval.id}`, {
        ...editEval, // include all current fields
        type: editType,
        dueDate: editDue,
        title: editEval.title || `${editType} Evaluation`, // ensure title is present
        criteria: editEval.criteria || [], // ensure criteria is present
      });
      toast.success('Evaluation updated');
      setEditEval(null);
      setEditSaving(false);
      // Refresh list
      const response = await getAllEvaluations();
      setEvaluations(response.data || []);
    } catch {
      toast.error('Failed to update evaluation');
      setEditSaving(false);
    }
  };

  // Quick stats (placeholder values, replace with real data)
  const quickStats = [
    { label: 'Pending', value: evaluations.filter(evaluation => evaluation.status === 'pending').length, color: 'bg-yellow-100 text-yellow-800' },
    { label: 'Overdue', value: evaluations.filter(evaluation => evaluation.status === 'overdue').length, color: 'bg-red-100 text-red-800' },
    { label: 'Completed', value: evaluations.filter(evaluation => evaluation.status === 'completed').length, color: 'bg-green-100 text-green-800' },
    { label: 'Scheduled', value: evaluations.filter(evaluation => evaluation.status === 'scheduled').length, color: 'bg-blue-100 text-blue-800' },
  ];

  if (loading) return <Layout><div>Loading...</div></Layout>;
  if (error) return <Layout><div className="text-red-500">{error}</div></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Quick Stats Header */}
        <div className="flex flex-wrap gap-4 mb-4">
          {quickStats.map(stat => (
            <div key={stat.label} className={`rounded-lg px-6 py-3 shadow text-center ${stat.color}`} style={{ minWidth: 120 }}>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <Tabs value={tab} onChange={(_, v) => setTab(v)} textColor="primary" indicatorColor="primary">
            <Tab label="Assignments" value="assignments" />
            <Tab label="Templates" value="templates" />
            <Tab label="Analytics" value="analytics" />
          </Tabs>
        </div>
        {/* Tab Content */}
        {tab === 'assignments' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Scheduled Evaluations</h2>
              <button
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => setShowScheduleModal(true)}
              >
                <PlusCircle className="h-5 w-5 mr-2" /> Schedule Evaluation
              </button>
            </div>
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-4">
              <select className="border rounded px-3 py-2" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <select className="border rounded px-3 py-2" value={filterEvaluator} onChange={e => setFilterEvaluator(e.target.value)}>
                <option value="all">All Evaluators</option>
                {[...new Map(evaluations.filter(ev => ev.supervisor?.name).map(ev => [ev.supervisor.id, ev.supervisor])).values()].map(sup => (
                  <option key={sup.id} value={sup.name}>{sup.name}</option>
                ))}
              </select>
              <input type="date" className="border rounded px-3 py-2" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
            </div>
            {/* Assignments List */}
            <div className="grid grid-cols-1 gap-4">
              {evaluations
                .filter(assignment => filterStatus === 'all' || assignment.status === filterStatus)
                .filter(assignment => filterEvaluator === 'all' || assignment.supervisor?.name === filterEvaluator)
                .filter(assignment => !filterDate || (assignment.dueDate && assignment.dueDate.split('T')[0] === filterDate))
                .map(assignment => (
                  <div key={assignment.id} className="bg-white shadow rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-lg font-semibold text-gray-900">{assignment.type} Evaluation</div>
                      <div className="text-sm text-gray-500">Employee: {assignment.employee?.name || assignment.employeeId}</div>
                      <div className="text-sm text-gray-500">Evaluator: {assignment.supervisor?.name || assignment.supervisorId}</div>
                      <div className="text-sm text-gray-500">Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : ''}</div>
                      <div className="text-sm text-gray-500">Status: {assignment.status}</div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div className={`h-2 rounded-full ${assignment.progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${assignment.progress || 0}%` }}></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Progress: {assignment.progress || 0}%</div>
                    </div>
                    <div className="mt-3 md:mt-0 flex gap-2 flex-wrap">
                      <button className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        onClick={() => navigate(`/evaluations/${assignment.id}`)}>
                        View
                      </button>
                      <button className="inline-flex items-center px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200"
                        onClick={async () => {
                          try {
                            await api.post(`/evaluations/${assignment.id}/remind`);
                            toast.success('Reminder sent!');
                          } catch {
                            toast.error('Failed to send reminder');
                          }
                        }}>
                        Remind
                      </button>
                      <button className="inline-flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        onClick={async () => {
                          try {
                            const res = await fetch(`${API_BASE_URL}/evaluations/${assignment.id}/export?format=csv`, {
                              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                            });
                            if (!res.ok) throw new Error('Export failed');
                            const blob = await res.blob();
                            const url = window.URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `evaluation-${assignment.id}.csv`;
                            document.body.appendChild(link);
                            link.click();
                            link.remove();
                            window.URL.revokeObjectURL(url);
                          } catch {
                            toast.error('Failed to export evaluation');
                          }
                        }}>
                        Export
                      </button>
                      <button className="inline-flex items-center px-3 py-2 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                        onClick={() => openEdit(a)}>
                        <Edit className="h-4 w-4 mr-1" /> Edit
                      </button>
                    </div>
                  </div>
                ))}
            </div>
            {/* Schedule Evaluation Modal */}
            {showScheduleModal && (
              <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
                  <h3 className="text-lg font-bold mb-4">Schedule New Evaluation</h3>
                  <form
                    onSubmit={async e => {
                      e.preventDefault();
                      if (!selectedEmployee || !scheduleEvaluator || !scheduleType || !scheduleDue) {
                        toast.error('Please fill all fields');
                        return;
                      }
                      setScheduleSaving(true);
                      try {
                        await api.post('/evaluations', {
                          title: `${scheduleType} Evaluation`,
                          employeeId: selectedEmployee.id,
                          supervisorId: scheduleEvaluator,
                          type: scheduleType,
                          dueDate: scheduleDue,
                          criteria: [],
                          status: 'pending',
                        });
                        toast.success('Evaluation scheduled');
                        setShowScheduleModal(false);
                        setSelectedEmployee(null);
                        setEmployeeSearch('');
                        setScheduleEvaluator('');
                        setScheduleType('3-month');
                        setScheduleDue('');
                        // Refresh list
                        const response = await getAllEvaluations();
                        setEvaluations(response.data || []);
                      } catch (err) {
                        toast.error('Failed to schedule evaluation');
                      } finally {
                        setScheduleSaving(false);
                      }
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium mb-1">Employee</label>
                      <div className="relative">
                        <input
                          type="text"
                          className="w-full border rounded px-3 py-2"
                          placeholder="Type to search..."
                          value={selectedEmployee ? selectedEmployee.name : employeeSearch}
                          onChange={e => {
                            setEmployeeSearch(e.target.value);
                            setSelectedEmployee(null);
                            setEmployeeDropdownOpen(true);
                          }}
                          onFocus={() => setEmployeeDropdownOpen(true)}
                          onBlur={() => setTimeout(() => setEmployeeDropdownOpen(false), 150)}
                          autoComplete="off"
                          required
                        />
                        {employeeDropdownOpen && !selectedEmployee && (
                          <ul className="absolute z-50 bg-white border border-blue-300 w-full max-h-48 overflow-y-auto rounded shadow mt-1" style={{ minWidth: '100%' }}>
                            {filteredEmployees.length === 0 && (
                              <li className="px-3 py-2 text-gray-500">No employees found</li>
                            )}
                            {filteredEmployees.map(emp => (
                              <li
                                key={emp.id}
                                className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
                                onMouseDown={e => e.preventDefault()}
                                onClick={() => {
                                  setSelectedEmployee(emp);
                                  setEmployeeSearch(emp.name);
                                  setEmployeeDropdownOpen(false);
                                }}
                              >
                                {emp.name} <span className="text-xs text-gray-400">({emp.email})</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Evaluator</label>
                      <select
                        className="w-full border rounded px-3 py-2"
                        value={scheduleEvaluator}
                        onChange={e => setScheduleEvaluator(e.target.value)}
                        required
                      >
                        <option value="">Select Evaluator</option>
                        {mockEvaluators.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Type</label>
                      <select
                        className="w-full border rounded px-3 py-2"
                        value={scheduleType}
                        onChange={e => setScheduleType(e.target.value)}
                        required
                      >
                        <option value="3-month">3-month</option>
                        <option value="6-month">6-month</option>
                        <option value="12-month">12-month</option>
                        <option value="performance">Performance</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Due Date</label>
                      <input
                        type="date"
                        className="w-full border rounded px-3 py-2"
                        value={scheduleDue}
                        onChange={e => setScheduleDue(e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <button type="button" className="px-4 py-2 bg-gray-200 rounded" onClick={() => setShowScheduleModal(false)}>Cancel</button>
                      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={scheduleSaving}>{scheduleSaving ? 'Scheduling...' : 'Schedule'}</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
        {tab === 'templates' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Evaluation Templates</h2>
              <button
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => setShowTemplateModal(true)}
              >
                <PlusCircle className="h-5 w-5 mr-2" /> New Template
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {mockTemplates.map((tpl) => (
                <div key={tpl.id} className="bg-white shadow rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{tpl.title}</div>
                    <div className="text-sm text-gray-500">Type: {tpl.type}</div>
                    <div className="text-sm text-gray-500">Used for: {tpl.usedFor}</div>
                    <div className={`text-xs mt-1 inline-block px-2 py-1 rounded ${tpl.status === 'archived' ? 'bg-gray-200 text-gray-500' : 'bg-green-100 text-green-800'}`}>{tpl.status}</div>
                  </div>
                  <div className="mt-3 md:mt-0 flex gap-2 flex-wrap">
                    <button className="inline-flex items-center px-3 py-2 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"><Edit className="h-4 w-4 mr-1" /> Edit</button>
                    <button className="inline-flex items-center px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">Archive</button>
                  </div>
                </div>
              ))}
            </div>
            {/* Modal for creating a new template */}
            {showTemplateModal && (
              <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
                  <h3 className="text-lg font-bold mb-4">Create New Evaluation Template</h3>
                  <form onSubmit={e => { e.preventDefault(); setShowTemplateModal(false); }} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Title</label>
                      <input type="text" className="w-full border rounded px-3 py-2" value={templateTitle} onChange={e => setTemplateTitle(e.target.value)} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Type</label>
                      <select className="w-full border rounded px-3 py-2" value={templateType} onChange={e => setTemplateType(e.target.value)}>
                        <option value="3-month">3-month</option>
                        <option value="6-month">6-month</option>
                        <option value="performance">Performance</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Used For</label>
                      <input type="text" className="w-full border rounded px-3 py-2" value={templateUsedFor} onChange={e => setTemplateUsedFor(e.target.value)} required />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <button type="button" className="px-4 py-2 bg-gray-200 rounded" onClick={() => setShowTemplateModal(false)}>Cancel</button>
                      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Create</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
        {tab === 'analytics' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Evaluation Analytics</h2>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowAdvancedAnalytics(!showAdvancedAnalytics)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  {showAdvancedAnalytics ? 'Hide' : 'Show'} Advanced
                </button>
                <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Evaluations</p>
                    <p className="text-2xl font-semibold text-gray-900">{evaluations.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Completed</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {evaluations.filter(evaluation => evaluation.status === 'completed' || evaluation.status === 'validated').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Clock className="h-5 w-5 text-yellow-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Pending</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {evaluations.filter(evaluation => evaluation.status === 'pending' || evaluation.status === 'in_progress').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Overdue</p>
                    <p className="text-2xl font-semibold text-gray-900">{getOverdueEvaluations().length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Department Analytics */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Department Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Department Breakdown</h4>
                  <div className="space-y-2">
                    {getDepartmentStats().map((dept, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-900">{dept.name}</span>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{dept.completed}/{dept.total} completed</span>
                          <span className="text-yellow-600">{dept.pending} pending</span>
                          {dept.overdue > 0 && <span className="text-red-600">{dept.overdue} overdue</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Evaluation Types</h4>
                  <div className="space-y-2">
                    {getTypeStats().map((type, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-900">{type.name}</span>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{type.completed}/{type.total} completed</span>
                          <span className="text-yellow-600">{type.pending} pending</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced Analytics */}
            {showAdvancedAnalytics && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Advanced Analytics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Performance Trends</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">Average Score</span>
                        <span className="text-sm font-medium text-gray-900">
                          {evaluations.filter(evaluation => evaluation.score).length > 0 
                            ? (evaluations.reduce((sum, evaluation) => sum + (evaluation.score || 0), 0) / evaluations.filter(evaluation => evaluation.score).length).toFixed(1)
                            : 'N/A'
                          }/5
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">Completion Rate</span>
                        <span className="text-sm font-medium text-gray-900">
                          {evaluations.length > 0 ? Math.round((evaluations.filter(evaluation => evaluation.status === 'completed' || evaluation.status === 'validated').length / evaluations.length) * 100) : 0}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">On-Time Rate</span>
                        <span className="text-sm font-medium text-gray-900">
                          {evaluations.length > 0 ? Math.round(((evaluations.length - getOverdueEvaluations().length) / evaluations.length) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">System Health</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">Pending Validations</span>
                        <span className="text-sm font-medium text-gray-900">{getPendingValidations().length}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">Active Supervisors</span>
                        <span className="text-sm font-medium text-gray-900">
                          {new Set(evaluations.map(evaluation => evaluation.supervisorId).filter(Boolean)).size}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">Active Employees</span>
                        <span className="text-sm font-medium text-gray-900">
                          {new Set(evaluations.map(evaluation => evaluation.employeeId).filter(Boolean)).size}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Alerts */}
            {getOverdueEvaluations().length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {getOverdueEvaluations().length} Overdue Evaluation{getOverdueEvaluations().length > 1 ? 's' : ''}
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>There are evaluations that are past their due date. Consider sending reminders to supervisors.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {getPendingValidations().length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <CheckCircle className="h-5 w-5 text-yellow-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      {getPendingValidations().length} Evaluation{getPendingValidations().length > 1 ? 's' : ''} Awaiting Validation
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>You have completed evaluations that need manager validation.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <Dialog open={!!editEval} onClose={closeEdit}>
        <div className="p-6 w-80">
          <h3 className="text-lg font-bold mb-4">Edit Evaluation</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Type</label>
            <select className="w-full border rounded px-3 py-2" value={editType} onChange={e => setEditType(e.target.value)}>
              {EVAL_TYPES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Due Date</label>
            <input type="date" className="w-full border rounded px-3 py-2" value={editDue} onChange={e => setEditDue(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button className="px-4 py-2 bg-gray-200 rounded" onClick={closeEdit}>Cancel</button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={saveEdit} disabled={editSaving}>{editSaving ? 'Saving...' : 'Save'}</button>
          </div>
        </div>
      </Dialog>
    </Layout>
  );
};

export default HREvaluations; 