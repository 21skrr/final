import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import surveyService from '../../services/surveyService';
import { useAuth } from '../../context/AuthContext';
import { BarChart, Users, CheckCircle, Clock } from 'lucide-react';

interface TeamStats {
    totalTeamMembers: number;
    totalSurveys: number;
    averageCompletionRate: number;
    surveyBreakdown: {
        surveyId: string;
        title: string;
        completionRate: number;
    }[];
}

interface MemberDetails {
    employeeId: string;
    employeeName: string;
    completionRate: number;
    surveys: {
        surveyTitle: string;
        status: string;
        isOverdue: boolean;
    }[];
}

const TeamSurveys: React.FC = () => {
    const { user } = useAuth();
    const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
    const [memberDetails, setMemberDetails] = useState<MemberDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTeamSurveyStatus = async () => {
            if (user?.role !== 'supervisor') {
                setError("You are not authorized to view this page.");
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const res = await surveyService.getTeamSurveyCompletionStatus();
                setTeamStats(res.data.teamStats);
                setMemberDetails(res.data.memberDetails);
                setError(null);
            } catch (err: any) {
                setError(err.response?.data?.message || "Failed to fetch team survey status.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchTeamSurveyStatus();
    }, [user]);

    if (loading) {
        return <Layout><div className="p-8"><p>Loading team survey data...</p></div></Layout>;
    }

    if (error) {
        return <Layout><div className="p-8 text-red-500">{error}</div></Layout>;
    }

    return (
        <Layout>
            <div className="p-8 bg-gray-50 min-h-screen">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Team Survey Dashboard</h1>
                    <p className="mt-2 text-gray-600">
                        Monitor your team's survey completion status and participation rates.
                    </p>
                </header>

                {teamStats && (
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
                            <Users className="w-12 h-12 text-blue-500 mr-4" />
                            <div>
                                <p className="text-sm text-gray-500">Team Members</p>
                                <p className="text-2xl font-bold text-gray-800">{teamStats.totalTeamMembers}</p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
                            <BarChart className="w-12 h-12 text-green-500 mr-4" />
                            <div>
                                <p className="text-sm text-gray-500">Avg. Completion</p>
                                <p className="text-2xl font-bold text-gray-800">{teamStats.averageCompletionRate.toFixed(1)}%</p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
                            <CheckCircle className="w-12 h-12 text-indigo-500 mr-4" />
                            <div>
                                <p className="text-sm text-gray-500">Active Surveys</p>
                                <p className="text-2xl font-bold text-gray-800">{teamStats.totalSurveys}</p>
                            </div>
                        </div>
                    </section>
                )}
                
                <section className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Team Member Progress</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Rate</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Survey Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {memberDetails.map(member => (
                                    <tr key={member.employeeId}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <p className="text-sm font-medium text-gray-900">{member.employeeName}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${member.completionRate}%` }}></div>
                                                </div>
                                                <span className="ml-3 text-sm font-medium text-gray-700">{member.completionRate.toFixed(0)}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="space-y-2">
                                                {member.surveys.map(survey => (
                                                    <div key={survey.surveyTitle} className="flex items-center text-sm">
                                                        {survey.status === 'completed' ? <CheckCircle className="w-4 h-4 text-green-500 mr-2" /> : <Clock className="w-4 h-4 text-yellow-500 mr-2" />}
                                                        <span className="text-gray-700">{survey.surveyTitle}</span>
                                                        {survey.isOverdue && <span className="ml-2 text-xs font-semibold text-red-600">(Overdue)</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </Layout>
    );
};

export default TeamSurveys; 