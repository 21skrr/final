import React, { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { getEvaluationReports } from '../../services/evaluationService';
import { Bar } from 'react-chartjs-2';

const ManagerEvaluationReports: React.FC = () => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  if (!report) return <Layout><div>No report data available.</div></Layout>;

  // Helper: Calculate averages by employee and supervisor
  const averagesByEmployee = report?.evaluationsByEmployee || [];
  const averagesBySupervisor = report?.evaluationsBySupervisor || [];
  const trends = report?.trends || [];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto mt-8 bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Evaluation Reports & Analytics</h2>
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-2">Average Scores by Employee</h3>
          <table className="min-w-full divide-y divide-gray-200 mb-4">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Avg Score</th>
              </tr>
            </thead>
            <tbody>
              {averagesByEmployee.map((row: any) => (
                <tr key={row.employeeId}>
                  <td className="px-4 py-2">{row.employeeName}</td>
                  <td className="px-4 py-2">{row.averageScore?.toFixed(2) ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3 className="text-lg font-semibold mb-2">Average Scores by Supervisor</h3>
          <table className="min-w-full divide-y divide-gray-200 mb-4">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Supervisor</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Avg Score</th>
              </tr>
            </thead>
            <tbody>
              {averagesBySupervisor.map((row: any) => (
                <tr key={row.supervisorId}>
                  <td className="px-4 py-2">{row.supervisorName}</td>
                  <td className="px-4 py-2">{row.averageScore?.toFixed(2) ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-2">Score Trends Over Time</h3>
          {trends.length > 0 ? (
            <Bar
              data={{
                labels: trends.map((t: any) => t.period),
                datasets: [
                  {
                    label: 'Average Score',
                    data: trends.map((t: any) => t.averageScore),
                    backgroundColor: 'rgba(59,130,246,0.5)',
                  },
                ],
              }}
              options={{ responsive: true, plugins: { legend: { display: false } } }}
            />
          ) : (
            <div className="text-gray-500 text-sm">No trend data available.</div>
          )}
        </div>
        <div className="mb-4">
          <div className="text-lg font-semibold">Total Evaluations: {report.totalEvaluations}</div>
          <div className="text-lg font-semibold">Completed: {report.completed}</div>
          <div className="text-lg font-semibold">Pending: {report.pending}</div>
          <div className="text-lg font-semibold">Average Score: {report.averageScore}</div>
        </div>
      </div>
    </Layout>
  );
};

export default ManagerEvaluationReports; 