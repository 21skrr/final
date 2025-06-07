import React from 'react';
import Layout from '../components/layout/Layout';
import { Users, UserPlus, BarChart2, Filter } from 'lucide-react';

const Team: React.FC = () => {
  const teamMembers = [
    {
      id: '1',
      name: 'Alex Johnson',
      role: 'Marketing Analyst',
      program: 'Early Talent',
      stage: 'land',
      progress: 60,
      daysInProgram: 15,
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    },
    {
      id: '2',
      name: 'Priya Sharma',
      role: 'Junior Developer',
      program: 'Apprenticeship',
      stage: 'integrate',
      progress: 85,
      daysInProgram: 48,
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    },
    {
      id: '3',
      name: 'Marco Torres',
      role: 'Operations Trainee',
      program: 'INKOMPASS',
      stage: 'excel',
      progress: 95,
      daysInProgram: 89,
      avatar: 'https://randomuser.me/api/portraits/men/67.jpg',
    },
  ];

  const getStageClass = (stage: string) => {
    switch (stage) {
      case 'prepare': return 'bg-gray-100 text-gray-800';
      case 'orient': return 'bg-blue-100 text-blue-800';
      case 'land': return 'bg-yellow-100 text-yellow-800';
      case 'integrate': return 'bg-purple-100 text-purple-800';
      case 'excel': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              Oversee and support your team members through their onboarding journey
            </p>
          </div>
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
            <UserPlus className="h-5 w-5 mr-2" />
            Add Team Member
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="rounded-full bg-blue-100 p-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Total Members</h3>
                <p className="text-2xl font-bold text-blue-600">{teamMembers.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="rounded-full bg-yellow-100 p-3">
                <BarChart2 className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Avg Progress</h3>
                <p className="text-2xl font-bold text-yellow-600">
                  {Math.round(teamMembers.reduce((acc, member) => acc + member.progress, 0) / teamMembers.length)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search team members..."
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <Filter className="h-5 w-5 mr-2 text-gray-400" />
                Filters
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Program
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stage
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Days
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teamMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <img className="h-10 w-10 rounded-full" src={member.avatar} alt="" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{member.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{member.role}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{member.program}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStageClass(member.stage)}`}>
                        {member.stage}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 max-w-[100px]">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{ width: `${member.progress}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{member.progress}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.daysInProgram}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900">View Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Team;