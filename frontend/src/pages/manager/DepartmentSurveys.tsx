import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../../components/layout/Layout';
import surveyService from '../../services/surveyService';
import { useAuth } from '../../context/AuthContext';
import { BarChart2, TrendingUp, Users, Target, AlertTriangle, Filter, Eye } from 'lucide-react';

// Simplified types for the new unified API response
interface SupervisorPerformance {
  id: string;
  name: string;
  teamSize: number;
  completionRate: number;
  avgSatisfaction: number;
}

interface Analytics {
  totalSurveys: number;
  totalResponses: number;
  participationRate: number;
  averageSatisfaction: number;
}

interface Insights {
  keyFindings: {
    strengths: { question: string; averageRating: number }[];
    areasForImprovement: { question: string; averageRating: number }[];
  };
}

const DepartmentSurveys: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Analytics');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for the unified API response
  const [analyticsData, setAnalyticsData] = useState<Analytics | null>(null);
  const [insightsData, setInsightsData] = useState<Insights | null>(null);
  const [supervisorPerformanceData, setSupervisorPerformanceData] = useState<SupervisorPerformance[]>([]);
  
  // Filters
  const [filters, setFilters] = useState({
    department: user?.department || '',
    timeframe: '6months',
    surveyType: 'all',
    programType: 'all',
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await surveyService.getDepartmentSurveyAnalytics(filters);
        setAnalyticsData(res.data.analytics);
        setInsightsData(res.data.insights);
        setSupervisorPerformanceData(res.data.supervisorPerformance);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch department survey data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const renderContent = () => {
    if (loading) return <div className="text-center p-8">Loading...</div>;
    if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

    switch (activeTab) {
      case 'Analytics':
        return <AnalyticsTab data={analyticsData} />;
      case 'Insights':
        return <InsightsTab data={insightsData} />;
      case 'Supervisor Performance':
        return <SupervisorPerformanceTab data={supervisorPerformanceData} />;
      case 'Interventions':
          return <div className="p-8 text-center text-gray-500">Interventions tab is under construction.</div>;
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold">Department Survey Management</h1>
        <p className="text-gray-600 mt-1">Monitor survey performance across teams, evaluate supervisors, and identify areas needing intervention.</p>

        {/* Filters */}
        <div className="my-6 p-4 border rounded-lg bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Department, Timeframe, etc. filters go here */}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {['Analytics', 'Insights', 'Supervisor Performance', 'Interventions'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-4">{renderContent()}</div>
      </div>
    </Layout>
  );
};

// --- Tab Components ---

const AnalyticsTab: React.FC<{ data: Analytics | null }> = ({ data }) => {
  if (!data) return <div className="p-8 text-center">No analytics data available.</div>;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard icon={BarChart2} title="Total Surveys" value={data.totalSurveys} />
      <StatCard icon={Users} title="Total Responses" value={data.totalResponses} />
      <StatCard icon={TrendingUp} title="Participation Rate" value={`${data.participationRate.toFixed(1)}%`} />
      <StatCard icon={Target} title="Avg. Satisfaction" value={data.averageSatisfaction.toFixed(2)} />
    </div>
  );
};

const InsightsTab: React.FC<{ data: Insights | null }> = ({ data }) => {
  if (!data) return <div className="p-8 text-center">No insights data available.</div>;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <h3 className="font-semibold text-lg">Key Strengths</h3>
        <ul className="mt-2 list-disc list-inside">
          {data.keyFindings.strengths.map(item => (
            <li key={item.question}>{item.question} (Avg: {item.averageRating.toFixed(2)})</li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="font-semibold text-lg text-red-600">Areas for Improvement</h3>
         <ul className="mt-2 list-disc list-inside">
          {data.keyFindings.areasForImprovement.map(item => (
            <li key={item.question} className="text-red-500">{item.question} (Avg: {item.averageRating.toFixed(2)})</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const SupervisorPerformanceTab: React.FC<{ data: SupervisorPerformance[] }> = ({ data }) => {
  if (!data.length) return <div className="p-8 text-center">No supervisor performance data available.</div>;
  return (
    <table className="min-w-full bg-white">
      <thead>
        <tr>
          <th className="py-2">Supervisor</th>
          <th className="py-2">Team Size</th>
          <th className="py-2">Completion Rate</th>
          <th className="py-2">Avg. Satisfaction</th>
        </tr>
      </thead>
      <tbody>
        {data.map(supervisor => (
          <tr key={supervisor.id} className="text-center border-t">
            <td className="py-2">{supervisor.name}</td>
            <td className="py-2">{supervisor.teamSize}</td>
            <td className="py-2">{supervisor.completionRate.toFixed(1)}%</td>
            <td className="py-2">{supervisor.avgSatisfaction.toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};


const StatCard: React.FC<{ icon: React.ElementType; title: string; value: string | number }> = ({ icon: Icon, title, value }) => (
  <div className="bg-white p-4 rounded-lg shadow">
    <div className="flex items-center">
      <div className="p-2 bg-blue-100 rounded-full">
        <Icon className="h-6 w-6 text-blue-600" />
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  </div>
);


export default DepartmentSurveys; 