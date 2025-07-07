import React, { useEffect, useState } from 'react';
import { User } from '../../types/user';
import { UserPlus, Users, CalendarClock, ClipboardList, BarChart, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import analyticsService from '../../services/analyticsService';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

interface HRDashboardProps {
  user: User;
}

const HRDashboard: React.FC<HRDashboardProps> = ({ user }) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orgStats, setOrgStats] = useState<any>(null);
  const [completionRates, setCompletionRates] = useState<any[]>([]);
  const [feedbackParticipation, setFeedbackParticipation] = useState<any[]>([]);
  const [surveyTrends, setSurveyTrends] = useState<any[]>([]);
  const [trainingCompletion, setTrainingCompletion] = useState<any[]>([]);
  const [evaluationEffectiveness, setEvaluationEffectiveness] = useState<any[]>([]);
  const [loadingAll, setLoadingAll] = useState(true);
  const [errorAll, setErrorAll] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await analyticsService.getOrganizationDashboard();
        setMetrics(data);
      } catch {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      setLoadingAll(true);
      setErrorAll(null);
      try {
        const [org, comp, feed, survey, train, evals] = await Promise.all([
          analyticsService.getOrganizationDashboard(),
          analyticsService.getCompletionRates(),
          analyticsService.getFeedbackParticipation(),
          analyticsService.getSurveyTrends(),
          analyticsService.getTrainingCompletion(),
          analyticsService.getEvaluationEffectiveness(),
        ]);
        setOrgStats(org);
        setCompletionRates(comp);
        setFeedbackParticipation(feed);
        setSurveyTrends(survey);
        setTrainingCompletion(train);
        setEvaluationEffectiveness(evals);
      } catch (e) {
        setErrorAll('Failed to load analytics data');
      } finally {
        setLoadingAll(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  if (loadingAll) return <div>Loading analytics...</div>;
  if (errorAll) return <div className="text-red-500">{errorAll}</div>;

  // Fallbacks for missing data
  const activeEmployees = metrics?.activeEmployees ?? 0;
  const pendingOnboarding = metrics?.pendingOnboarding ?? 0;
  const completedThisMonth = metrics?.completedThisMonth ?? 0;
  const retentionRate = metrics?.retentionRate ?? 0;
  const programDistribution = metrics?.programDistribution ?? [];
  const attentionItems = metrics?.attentionItems ?? [];
  const recentActivities = metrics?.recentActivities ?? [];

  // --- Org Stats ---
  const totalUsers = orgStats?.totalUsers ?? 0;
  const totalTeams = orgStats?.totalTeams ?? 0;
  const departments = orgStats?.departments ?? 0;
  const roleBreakdown = orgStats?.roleBreakdown ?? [];
  const departmentStats = orgStats?.departmentStats ?? [];

  // --- Completion Rates ---
  // ...
  // --- Feedback Participation ---
  // ...
  // --- Survey Trends ---
  // ...
  // --- Training Completion ---
  // ...
  // --- Evaluation Effectiveness ---
  // ...

  return (
    <div className="space-y-8">
      {/* Welcome & Org Stats */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome, {user.name}!</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4">
          <div className="text-center">
            <span className="block text-3xl font-bold text-blue-700">{totalUsers}</span>
            <span className="text-sm text-gray-500">Total Users</span>
          </div>
          <div className="text-center">
            <span className="block text-3xl font-bold text-green-700">{totalTeams}</span>
            <span className="text-sm text-gray-500">Teams</span>
          </div>
          <div className="text-center">
            <span className="block text-3xl font-bold text-purple-700">{departments}</span>
            <span className="text-sm text-gray-500">Departments</span>
          </div>
          <div className="text-center">
            <span className="block text-3xl font-bold text-yellow-600">{roleBreakdown.reduce((a: number, r: any) => a + (r.count || 0), 0)}</span>
            <span className="text-sm text-gray-500">Roles</span>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Role Breakdown</h3>
            <ul>
              {roleBreakdown.map((r: any) => (
                <li key={r.role} className="flex justify-between text-sm mb-1">
                  <span>{r.role}</span>
                  <span className="font-bold">{r.count}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Department Stats</h3>
            <ul>
              {departmentStats.map((d: any) => (
                <li key={d.department} className="flex justify-between text-sm mb-1">
                  <span>{d.department || 'N/A'}</span>
                  <span className="font-bold">{d.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Completion Rates */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Completion Rates by Department/Program</h2>
        {completionRates.length === 0 ? <div className="text-gray-500">No data</div> : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Program</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Completion Rate</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {completionRates.map((row: any, idx: number) => (
                  <tr key={idx}>
                    <td className="px-4 py-2">{row.department}</td>
                    <td className="px-4 py-2">{row.programType}</td>
                    <td className="px-4 py-2">{row.totalEmployees}</td>
                    <td className="px-4 py-2">{row.employeesWithCompletedRequiredCourse}</td>
                    <td className="px-4 py-2">{row.completionRate.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Feedback Participation */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Feedback Participation</h2>
        {feedbackParticipation.length === 0 ? <div className="text-gray-500">No data</div> : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Program</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">3 Months</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">6 Months</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">12 Months</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {feedbackParticipation.map((row: any, idx: number) => (
                  <tr key={idx}>
                    <td className="px-4 py-2">{row.department}</td>
                    <td className="px-4 py-2">{row.programType}</td>
                    <td className="px-4 py-2">{row.feedbackParticipation.threeMonths.rate.toFixed(1)}%</td>
                    <td className="px-4 py-2">{row.feedbackParticipation.sixMonths.rate.toFixed(1)}%</td>
                    <td className="px-4 py-2">{row.feedbackParticipation.twelveMonths.rate.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Survey Trends */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Survey Trends</h2>
        {surveyTrends.length === 0 ? <div className="text-gray-500">No data</div> : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Survey</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Responses</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Avg. Rating</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {surveyTrends.map((row: any, idx: number) => (
                  <tr key={idx}>
                    <td className="px-4 py-2">{row.title}</td>
                    <td className="px-4 py-2">{row.type}</td>
                    <td className="px-4 py-2">{row.status}</td>
                    <td className="px-4 py-2">{row.totalResponses}</td>
                    <td className="px-4 py-2">{typeof row.averageRating === 'number' ? row.averageRating.toFixed(2) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Training Completion */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Training Completion by Role</h2>
        {trainingCompletion.length === 0 ? <div className="text-gray-500">No data</div> : (
          <Bar
            data={{
              labels: trainingCompletion.map((row: any) => row.role),
              datasets: [
                {
                  label: 'Completion Rate (%)',
                  data: trainingCompletion.map((row: any) => row.completionRate),
                  backgroundColor: 'rgba(37, 99, 235, 0.7)',
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: { y: { min: 0, max: 100, ticks: { callback: (v: number) => v + '%' } } },
            }}
            height={200}
          />
        )}
      </div>

      {/* Evaluation Effectiveness */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Evaluation & Coaching Effectiveness</h2>
        {evaluationEffectiveness.length === 0 ? <div className="text-gray-500">No data</div> : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Program</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Evaluations Completed</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Coaching Sessions Completed</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {evaluationEffectiveness.map((row: any, idx: number) => (
                  <tr key={idx}>
                    <td className="px-4 py-2">{row.department}</td>
                    <td className="px-4 py-2">{row.programType}</td>
                    <td className="px-4 py-2">{row.evaluation.employeesWithCompletedEvaluation}</td>
                    <td className="px-4 py-2">{row.coaching.employeesWithCompletedCoachingSession}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HRDashboard;