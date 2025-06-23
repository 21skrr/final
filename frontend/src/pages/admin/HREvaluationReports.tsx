import React, { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { getEvaluationReports } from '../../services/evaluationService';
import { Bar } from 'react-chartjs-2';

const HREvaluationReports: React.FC = () => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState([
    { id: '76bfa862-3c19-11f0-ba41-f875a44d165a', name: 'Human Resources' },
    { id: '76c055ac-3c19-11f0-ba41-f875a44d165a', name: 'Marketing' },
    { id: '76c11d15-3c19-11f0-ba41-f875a44d165a', name: 'Engineering' },
    { id: '76c151c2-3c19-11f0-ba41-f875a44d165a', name: 'Sales' },
  ]);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await getEvaluationReports();
        setReport(response.data);
      } catch (err) {
        setError('Failed to load evaluation reports');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  if (loading) return <Layout><div>Loading...</div></Layout>;
  if (error) return <Layout><div className="text-red-500">{error}</div></Layout>;
  if (!report || !Array.isArray(report) || report.length === 0) return <Layout><div>No report data available.</div></Layout>;

  // Filter evaluations by selected department
  const filteredReport = selectedDept
    ? report.filter((e: any) => e.employee?.departmentId === selectedDept)
    : report;

  // Compute analytics from filtered array
  const totalEvaluations = filteredReport.length;
  const completed = filteredReport.filter((e: any) => e.status === 'completed').length;
  const pending = filteredReport.filter((e: any) => e.status === 'pending').length;
  const averageScore = (() => {
    const scores = filteredReport.map((e: any) => e.overallScore).filter((s: any) => typeof s === 'number');
    if (!scores.length) return '-';
    return (scores.reduce((a: any, b: any) => a + b, 0) / scores.length).toFixed(1);
  })();

  // Find the selected department object
  const selectedDepartmentObj = departments.find(d => d.id === selectedDept);

  // Calculate completion rate for the selected department
  const deptEvaluations = selectedDept
    ? report.filter((e: any) => e.employee?.departmentId === selectedDept)
    : report;
  const deptCompleted = deptEvaluations.filter((e: any) => e.status === 'completed').length;
  const deptCompletionRate = deptEvaluations.length
    ? ((deptCompleted / deptEvaluations.length) * 100).toFixed(1)
    : '-';

  // Trends over time (by month, filtered)
  const trendsMap: Record<string, { completed: number; pending: number }> = {};
  filteredReport.forEach((e: any) => {
    const month = e.dueDate ? new Date(e.dueDate).toLocaleString('default', { year: 'numeric', month: 'short' }) : 'Unknown';
    if (!trendsMap[month]) trendsMap[month] = { completed: 0, pending: 0 };
    if (e.status === 'completed') trendsMap[month].completed++;
    if (e.status === 'pending') trendsMap[month].pending++;
  });
  const trends = Object.entries(trendsMap).map(([period, stats]) => ({ period, ...stats }));

  return (
    <Layout>
      <div className="max-w-4xl mx-auto mt-8 bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Evaluation Reports & Analytics (HR)</h2>
        <div className="mb-4">
          <label className="mr-2 font-semibold">Department:</label>
          <select
            value={selectedDept || ''}
            onChange={e => setSelectedDept(e.target.value || null)}
            className="border rounded px-2 py-1"
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
        </div>
        {selectedDept && (
          <div className="mb-4 font-semibold">
            Completion Rate for {selectedDepartmentObj?.name}: {deptCompletionRate}%
          </div>
        )}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-2">Evaluation Trends Over Time</h3>
          {trends.length > 0 && (
            <div key={JSON.stringify(trends)}>
              <Bar
                key={JSON.stringify(trends)}
                data={{
                  labels: trends.map((t: any) => t.period),
                  datasets: [
                    {
                      label: 'Completed Evaluations',
                      data: trends.map((t: any) => t.completed),
                      backgroundColor: 'rgba(16,185,129,0.5)',
                    },
                    {
                      label: 'Pending Evaluations',
                      data: trends.map((t: any) => t.pending),
                      backgroundColor: 'rgba(59,130,246,0.5)',
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: { legend: { display: true } },
                  scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                }}
                redraw
              />
            </div>
          )}
          {trends.length === 0 && (
            <div className="text-gray-500 text-sm">No trend data available.</div>
          )}
        </div>
        <div className="mb-4">
          <div className="text-lg font-semibold">Total Evaluations: {totalEvaluations}</div>
          <div className="text-lg font-semibold">Completed: {completed}</div>
          <div className="text-lg font-semibold">Pending: {pending}</div>
          <div className="text-lg font-semibold">Average Score: {averageScore}</div>
        </div>
      </div>
    </Layout>
  );
};

export default HREvaluationReports; 