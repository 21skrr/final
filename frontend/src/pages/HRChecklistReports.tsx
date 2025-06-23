import React, { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import checklistAssignmentService from '../services/checklistAssignmentService';
import { ChecklistAssignmentDetail } from '../types/checklist';

const HRChecklistReports: React.FC = () => {
  const [assignments, setAssignments] = useState<ChecklistAssignmentDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [department, setDepartment] = useState('');
  const [program, setProgram] = useState('');
  const [phase, setPhase] = useState('');
  const [search, setSearch] = useState('');

  // Mock filter options (replace with real data if available)
  const departmentOptions = ['HR', 'IT', 'Finance', 'Sales'];
  const programOptions = ['INKOMPASS', 'Early Talent', 'Apprenticeship', 'Academic Placement', 'Work Experience'];
  const phaseOptions = ['prepare', 'orient', 'land', 'integrate', 'excel'];

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        // You may want to add filter params to this call in the future
        const allAssignments = await checklistAssignmentService.getAllAssignments?.();
        setAssignments(allAssignments || []);
        setError(null);
      } catch (err) {
        setError('Failed to load assignments.');
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, []);

  // Filter logic
  const filteredAssignments = assignments.filter(a => {
    const matchesDepartment = department ? (a.checklist?.title?.toLowerCase().includes(department.toLowerCase()) || a.userId?.toLowerCase().includes(department.toLowerCase())) : true;
    const matchesProgram = program ? (a.checklist?.programType === program) : true;
    const matchesPhase = phase ? (a.checklist?.stage === phase) : true;
    const matchesSearch = search ? (
      a.userId?.toLowerCase().includes(search.toLowerCase()) ||
      a.checklist?.title?.toLowerCase().includes(search.toLowerCase())
    ) : true;
    return matchesDepartment && matchesProgram && matchesPhase && matchesSearch;
  });

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Employee', 'Checklist', 'Department', 'Program', 'Phase', 'Due Date', 'Progress', 'Status'];
    const rows = filteredAssignments.map(a => [
      a.userId,
      a.checklist?.title || '',
      '-', // Placeholder for department
      a.checklist?.programType || '',
      a.checklist?.stage || '',
      a.dueDate ? new Date(a.dueDate).toLocaleDateString() : '',
      `${a.completionPercentage || 0}%`,
      a.status
    ]);
    const csvContent = [headers, ...rows].map(r => r.map(x => `"${x}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const aTag = document.createElement('a');
    aTag.href = url;
    aTag.download = 'checklist_report.csv';
    aTag.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Checklist Reports</h1>
          <button onClick={handleExportCSV} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">Export CSV</button>
        </div>
        <div className="flex flex-wrap gap-4 mb-4">
          <input
            type="text"
            placeholder="Search by user or checklist..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
          <select value={department} onChange={e => setDepartment(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm">
            <option value="">All Departments</option>
            {departmentOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <select value={program} onChange={e => setProgram(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm">
            <option value="">All Programs</option>
            {programOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <select value={phase} onChange={e => setPhase(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm">
            <option value="">All Phases</option>
            {phaseOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Checklist</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Program</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phase</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAssignments.map(a => (
                  <tr key={a.id}>
                    <td className="px-4 py-2">{a.userId}</td>
                    <td className="px-4 py-2">{a.checklist?.title || ''}</td>
                    <td className="px-4 py-2">-</td>
                    <td className="px-4 py-2">{a.checklist?.programType || ''}</td>
                    <td className="px-4 py-2">{a.checklist?.stage || ''}</td>
                    <td className="px-4 py-2">{a.dueDate ? new Date(a.dueDate).toLocaleDateString() : ''}</td>
                    <td className="px-4 py-2">{a.completionPercentage || 0}%</td>
                    <td className="px-4 py-2">{a.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredAssignments.length === 0 && (
              <div className="text-center text-gray-500 py-8">No assignments found.</div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default HRChecklistReports; 