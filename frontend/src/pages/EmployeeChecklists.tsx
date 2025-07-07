import React, { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import checklistAssignmentService from '../services/checklistAssignmentService';
import { ChecklistAssignmentDetail, ChecklistProgressItem } from '../types/checklist';
import { Link } from 'react-router-dom';
import checklistService from '../services/checklistService';
import { Checklist, ChecklistItem } from '../types/checklist';

const EmployeeChecklists: React.FC = () => {
  const [assignments, setAssignments] = useState<ChecklistAssignmentDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progressItems, setProgressItems] = useState<{ [assignmentId: string]: ChecklistProgressItem[] }>({});
  const [checklistTemplates, setChecklistTemplates] = useState<{ [checklistId: string]: Checklist }>({});
  const [templateItems, setTemplateItems] = useState<{ [checklistId: string]: ChecklistItem[] }>({});

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        const data = await checklistAssignmentService.getMyAssignments();
        setAssignments(data || []);
        // Fetch checklist templates and items for each assignment
        const templates: { [checklistId: string]: Checklist } = {};
        const itemsMap: { [checklistId: string]: ChecklistItem[] } = {};
        for (const a of data || []) {
          if (a.checklistId) {
            try {
              const checklist = await checklistService.getChecklist(a.checklistId);
              templates[a.checklistId] = checklist;
              const items = await checklistService.getChecklistItems(a.checklistId);
              itemsMap[a.checklistId] = items;
            } catch {
              // skip if not found
            }
          }
        }
        setChecklistTemplates(templates);
        setTemplateItems(itemsMap);
        setError(null);
      } catch (err) {
        setError('Failed to load checklists.');
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, []);

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">My Checklists</h1>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700">{error}</div>
        ) : assignments.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No checklists assigned.</div>
        ) : (
          <div className="space-y-8">
            {assignments.map(a => {
              const checklist = checklistTemplates[a.checklistId];
              const items = templateItems[a.checklistId] || [];
              // Find completed progresses for this assignment
              const progresses = progressItems[a.id] || [];
              const completedIds = new Set(progresses.filter(i => i.isCompleted).map(i => i.checklistItemId));
              const completedCount = items.filter(i => completedIds.has(i.id)).length;
              const totalCount = items.length;
              const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
              return (
                <div key={a.id} className="bg-white shadow rounded-lg p-6">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-semibold text-gray-900">{a.title || 'Checklist (No Title)'}</h2>
                    <span className="text-sm text-gray-500 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Due: {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : 'No due date'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${percent}%` }}
                      ></div>
                  </div>
                  <ul className="space-y-2">
                    {items.map(item => (
                      <li key={item.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={completedIds.has(item.id)}
                          readOnly
                          className="form-checkbox h-5 w-5 text-blue-600"
                        />
                        <span className={completedIds.has(item.id) ? 'line-through text-gray-400' : 'text-gray-900'}>
                          {item.title}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default EmployeeChecklists; 