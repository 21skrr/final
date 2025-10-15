import React, { useEffect, useState } from 'react';
import { User } from '../../types/user';
import { UserPlus, Users, CalendarClock, ClipboardList, BarChart, AlertTriangle, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import analyticsService from '../../services/analyticsService';
import { useSupervisorAssessments } from '../../hooks/useSupervisorAssessments';
import { useHRAssessments } from '../../hooks/useHRAssessments';
import { Bar, Pie } from 'react-chartjs-2';
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
  ArcElement,
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

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
  const [onboardingStageDistribution, setOnboardingStageDistribution] = useState<any[]>([]);
  const [supervisorAssessmentCompletion, setSupervisorAssessmentCompletion] = useState<any>(null);
  const [onboardingCompletionTime, setOnboardingCompletionTime] = useState<any[]>([]);
  const [loadingAll, setLoadingAll] = useState(true);
  const [errorAll, setErrorAll] = useState<string | null>(null);
  const { pendingHRApprovals } = useSupervisorAssessments();
  const { pendingCount: pendingHRAssessments } = useHRAssessments();

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
        const [org, comp, feed, survey, train, evals, onboardingStages, supervisorAssessments, onboardingTime] = await Promise.all([
          analyticsService.getOrganizationDashboard(),
          analyticsService.getCompletionRates(),
          analyticsService.getFeedbackParticipation(),
          analyticsService.getSurveyTrends(),
          analyticsService.getTrainingCompletion(),
          analyticsService.getEvaluationEffectiveness(),
          analyticsService.getOnboardingStageDistribution(),
          analyticsService.getSupervisorAssessmentCompletion(),
          analyticsService.getOnboardingCompletionTime(),
        ]);
        setOrgStats(org);
        setCompletionRates(comp);
        setFeedbackParticipation(feed);
        setSurveyTrends(survey);
        setTrainingCompletion(train);
        setEvaluationEffectiveness(evals);
        setOnboardingStageDistribution(onboardingStages);
        setSupervisorAssessmentCompletion(supervisorAssessments);
        setOnboardingCompletionTime(onboardingTime);
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

      {/* Pending HR Approvals */}
      {pendingHRApprovals > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h2 className="text-xl font-bold text-blue-800">Pending HR Approvals</h2>
                <p className="text-blue-600">You have {pendingHRApprovals} supervisor assessment(s) waiting for your approval</p>
              </div>
            </div>
            <Link
              to="/hr/validation-queue"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Review Now
            </Link>
          </div>
        </div>
      )}

      {/* Pending HR Assessments */}
      {pendingHRAssessments > 0 && (
        <div className="bg-green-50 border border-green-200 p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h2 className="text-xl font-bold text-green-800">Pending HR Assessments</h2>
                <p className="text-green-600">You have {pendingHRAssessments} Phase 2 completion assessment(s) waiting for your review</p>
              </div>
            </div>
            <Link
              to="/admin/assessment-queue"
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              Review Now
            </Link>
          </div>
        </div>
      )}

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

      {/* Onboarding Stage Distribution */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Onboarding Stage Distribution</h2>
        {onboardingStageDistribution.length === 0 ? <div className="text-gray-500">No data</div> : (
          <div className="flex items-center justify-center">
            <div className="w-64 h-64">
              <Pie
            data={{
                  labels: onboardingStageDistribution.map((item: any) => {
                    const stageLabels: { [key: string]: string } = {
                      'pre_onboarding': 'Pre-Onboarding',
                      'phase_1': 'Phase 1',
                      'phase_2': 'Phase 2'
                    };
                    return stageLabels[item.stage] || item.stage;
                  }),
              datasets: [
                {
                      data: onboardingStageDistribution.map((item: any) => item.count),
                      backgroundColor: [
                        'rgba(99, 102, 241, 0.8)',
                        'rgba(34, 197, 94, 0.8)',
                        'rgba(251, 191, 36, 0.8)',
                      ],
                      borderColor: [
                        'rgba(99, 102, 241, 1)',
                        'rgba(34, 197, 94, 1)',
                        'rgba(251, 191, 36, 1)',
                      ],
                      borderWidth: 2,
                },
              ],
            }}
            options={{
              responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context: any) {
                          const item = onboardingStageDistribution[context.dataIndex];
                          return `${context.label}: ${item.count} employees (${item.percentage.toFixed(1)}%)`;
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Supervisor Assessment Completion Rates */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Supervisor Assessment Completion</h2>
        {!supervisorAssessmentCompletion ? <div className="text-gray-500">No data</div> : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{supervisorAssessmentCompletion.totalAssessments}</div>
                <div className="text-sm text-gray-600">Total Assessments</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{supervisorAssessmentCompletion.completedAssessments}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{supervisorAssessmentCompletion.completionRate.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Completion Rate</div>
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Status Breakdown</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span>Pending Certificate:</span>
                  <span className="font-medium">{supervisorAssessmentCompletion.statusBreakdown.pendingCertificate}</span>
                </div>
                <div className="flex justify-between">
                  <span>Certificate Uploaded:</span>
                  <span className="font-medium">{supervisorAssessmentCompletion.statusBreakdown.certificateUploaded}</span>
                </div>
                <div className="flex justify-between">
                  <span>Assessment Pending:</span>
                  <span className="font-medium">{supervisorAssessmentCompletion.statusBreakdown.assessmentPending}</span>
                </div>
                <div className="flex justify-between">
                  <span>Assessment Completed:</span>
                  <span className="font-medium">{supervisorAssessmentCompletion.statusBreakdown.assessmentCompleted}</span>
                </div>
                <div className="flex justify-between">
                  <span>Decision Pending:</span>
                  <span className="font-medium">{supervisorAssessmentCompletion.statusBreakdown.decisionPending}</span>
                </div>
                <div className="flex justify-between">
                  <span>Decision Made:</span>
                  <span className="font-medium">{supervisorAssessmentCompletion.statusBreakdown.decisionMade}</span>
                </div>
                <div className="flex justify-between">
                  <span>HR Approval Pending:</span>
                  <span className="font-medium">{supervisorAssessmentCompletion.statusBreakdown.hrApprovalPending}</span>
                </div>
                <div className="flex justify-between">
                  <span>HR Rejected:</span>
                  <span className="font-medium">{supervisorAssessmentCompletion.statusBreakdown.hrRejected}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Onboarding Completion Time by Department */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Onboarding Completion Time by Department</h2>
        {onboardingCompletionTime.length === 0 ? <div className="text-gray-500">No data</div> : (
          <div className="space-y-4">
            <Bar
              data={{
                labels: onboardingCompletionTime.map((item: any) => item.department),
                datasets: [
                  {
                    label: 'Avg Completion Time (Days)',
                    data: onboardingCompletionTime.map((item: any) => item.avgCompletionTimeDays),
                    backgroundColor: 'rgba(37, 99, 235, 0.7)',
                  },
                  {
                    label: 'Completion Rate (%)',
                    data: onboardingCompletionTime.map((item: any) => item.completionRate),
                    backgroundColor: 'rgba(34, 197, 94, 0.7)',
                    yAxisID: 'y1',
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: { 
                  legend: { display: true },
                  tooltip: {
                    callbacks: {
                      afterLabel: function(context: any) {
                        const item = onboardingCompletionTime[context.dataIndex];
                        if (context.datasetIndex === 0) {
                          return `Completed: ${item.completedEmployees}/${item.totalEmployees}`;
                        }
                        return `Total Employees: ${item.totalEmployees}`;
                      }
                    }
                  }
                },
                scales: { 
                  y: { 
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: { display: true, text: 'Days' }
                  },
                  y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: { display: true, text: 'Completion Rate (%)' },
                    grid: { drawOnChartArea: false },
                    max: 100
                  }
                },
            }}
            height={200}
          />
            
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Department Details</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Employees</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Completion Rate</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Avg Time (Days)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {onboardingCompletionTime.map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 font-medium">{item.department}</td>
                        <td className="px-4 py-2">{item.totalEmployees}</td>
                        <td className="px-4 py-2">{item.completedEmployees}</td>
                        <td className="px-4 py-2">{item.completionRate.toFixed(1)}%</td>
                        <td className="px-4 py-2">{item.avgCompletionTimeDays.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Evaluation Effectiveness */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Evaluation Effectiveness & Trends</h2>
        {!evaluationEffectiveness || Object.keys(evaluationEffectiveness).length === 0 ? (
          <div className="text-gray-500">No evaluation data available</div>
        ) : (
          <div className="space-y-6">
            {/* Evaluation Type Distribution */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Evaluation Types Distribution</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {evaluationEffectiveness.typeDistribution?.map((type: any, idx: number) => (
                  <div key={idx} className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-gray-600 capitalize">{type.type.replace('-', ' ')}</div>
                    <div className="text-2xl font-bold text-blue-600">{type.total}</div>
                    <div className="text-xs text-gray-500">
                      {type.completed} completed ({type.completionRate.toFixed(1)}%)
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Evaluation Status Distribution */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Evaluation Status Distribution</h3>
              {evaluationEffectiveness.typeDistribution && evaluationEffectiveness.typeDistribution.length > 0 ? (
                <div className="flex items-center justify-center">
                  <div className="w-64 h-64">
                    <Pie
                      data={{
                        labels: evaluationEffectiveness.typeDistribution.map((type: any) => {
                          const typeLabels: { [key: string]: string } = {
                            '3-month': '3-Month Review',
                            '6-month': '6-Month Review', 
                            '12-month': '12-Month Review',
                            'performance': 'Performance Review',
                            'training': 'Training Evaluation',
                            'probation': 'Probation Review'
                          };
                          return typeLabels[type.type] || type.type;
                        }),
                        datasets: [
                          {
                            data: evaluationEffectiveness.typeDistribution.map((type: any) => type.total),
                            backgroundColor: [
                              'rgba(99, 102, 241, 0.8)',
                              'rgba(34, 197, 94, 0.8)',
                              'rgba(251, 191, 36, 0.8)',
                              'rgba(239, 68, 68, 0.8)',
                              'rgba(168, 85, 247, 0.8)',
                              'rgba(6, 182, 212, 0.8)',
                            ],
                            borderColor: [
                              'rgba(99, 102, 241, 1)',
                              'rgba(34, 197, 94, 1)',
                              'rgba(251, 191, 36, 1)',
                              'rgba(239, 68, 68, 1)',
                              'rgba(168, 85, 247, 1)',
                              'rgba(6, 182, 212, 1)',
                            ],
                            borderWidth: 2,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom',
                          },
                          tooltip: {
                            callbacks: {
                              label: function(context: any) {
                                const type = evaluationEffectiveness.typeDistribution[context.dataIndex];
                                return `${context.label}: ${type.total} total (${type.completed} completed - ${type.completionRate.toFixed(1)}%)`;
                              }
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No evaluation data available.</p>
                  <p className="text-sm mt-1">Evaluation distribution will appear as evaluations are created.</p>
                </div>
              )}
            </div>

            {/* Department Statistics */}
            {evaluationEffectiveness.departmentStats && evaluationEffectiveness.departmentStats.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Department Evaluation Statistics</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Program</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Completion Rate</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Avg Score</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                      {evaluationEffectiveness.departmentStats.map((row: any, idx: number) => (
                  <tr key={idx}>
                          <td className="px-4 py-2 font-medium">{row.department}</td>
                    <td className="px-4 py-2">{row.programType}</td>
                          <td className="px-4 py-2 capitalize">{row.evaluationType.replace('-', ' ')}</td>
                          <td className="px-4 py-2">{row.totalEvaluations}</td>
                          <td className="px-4 py-2">{row.completedEvaluations}</td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              row.completionRate >= 80 ? 'bg-green-100 text-green-800' :
                              row.completionRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {row.completionRate.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            {row.averageScore > 0 ? row.averageScore.toFixed(1) : 'N/A'}
                          </td>
                  </tr>
                ))}
              </tbody>
            </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HRDashboard;