import React, { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { getAllEvaluations, deleteEvaluation, validateEvaluation } from '../../services/evaluationService';
import { Evaluation } from '../../types/evaluation';
import { ClipboardCheck, Star, Edit, Trash2, CheckCircle, PlusCircle } from 'lucide-react';
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
    { label: 'Pending', value: evaluations.filter(e => e.status === 'pending').length, color: 'bg-yellow-100 text-yellow-800' },
    { label: 'Overdue', value: evaluations.filter(e => e.status === 'overdue').length, color: 'bg-red-100 text-red-800' },
    { label: 'Completed', value: evaluations.filter(e => e.status === 'completed').length, color: 'bg-green-100 text-green-800' },
    { label: 'Scheduled', value: evaluations.filter(e => e.status === 'scheduled').length, color: 'bg-blue-100 text-blue-800' },
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
                .filter(a => filterStatus === 'all' || a.status === filterStatus)
                .filter(a => filterEvaluator === 'all' || a.supervisor?.name === filterEvaluator)
                .filter(a => !filterDate || (a.dueDate && a.dueDate.split('T')[0] === filterDate))
                .map(a => (
                  <div key={a.id} className="bg-white shadow rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-lg font-semibold text-gray-900">{a.type} Evaluation</div>
                      <div className="text-sm text-gray-500">Employee: {a.employee?.name || a.employeeId}</div>
                      <div className="text-sm text-gray-500">Evaluator: {a.supervisor?.name || a.supervisorId}</div>
                      <div className="text-sm text-gray-500">Due: {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : ''}</div>
                      <div className="text-sm text-gray-500">Status: {a.status}</div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div className={`h-2 rounded-full ${a.progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${a.progress || 0}%` }}></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Progress: {a.progress || 0}%</div>
                    </div>
                    <div className="mt-3 md:mt-0 flex gap-2 flex-wrap">
                      <button className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        onClick={() => navigate(`/evaluations/${a.id}`)}>
                        View
                      </button>
                      <button className="inline-flex items-center px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200"
                        onClick={async () => {
                          try {
                            await api.post(`/evaluations/${a.id}/remind`);
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
                            const res = await fetch(`${API_BASE_URL}/evaluations/${a.id}/export?format=csv`, {
                              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                            });
                            if (!res.ok) throw new Error('Export failed');
                            const blob = await res.blob();
                            const url = window.URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `evaluation-${a.id}.csv`;
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
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">Analytics coming soon...</div>
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