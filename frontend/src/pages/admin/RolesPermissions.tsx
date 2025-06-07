import React from 'react';
import Layout from '../../components/layout/Layout';
import { Shield, Plus, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const RolesPermissions: React.FC = () => {
  // Mock roles and permissions data
  const roles = [
    {
      id: '1',
      name: 'HR Administrator',
      description: 'Full system access with user management capabilities',
      userCount: 5,
      permissions: {
        userManagement: true,
        programManagement: true,
        evaluations: true,
        reports: true,
        settings: true,
      },
    },
    {
      id: '2',
      name: 'Manager',
      description: 'Team management and reporting capabilities',
      userCount: 12,
      permissions: {
        userManagement: false,
        programManagement: true,
        evaluations: true,
        reports: true,
        settings: false,
      },
    },
    {
      id: '3',
      name: 'Supervisor',
      description: 'Direct team supervision and evaluation capabilities',
      userCount: 25,
      permissions: {
        userManagement: false,
        programManagement: false,
        evaluations: true,
        reports: true,
        settings: false,
      },
    },
    {
      id: '4',
      name: 'Employee',
      description: 'Basic access to personal onboarding and training materials',
      userCount: 150,
      permissions: {
        userManagement: false,
        programManagement: false,
        evaluations: false,
        reports: false,
        settings: false,
      },
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage role definitions and associated permissions
            </p>
          </div>
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
            <Plus className="h-5 w-5 mr-2" />
            Create New Role
          </button>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Users
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User Management
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Program Management
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Evaluations
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reports
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Settings
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {roles.map((role) => (
                  <tr key={role.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <Shield className="h-6 w-6 text-purple-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{role.name}</div>
                          <div className="text-sm text-gray-500">{role.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {role.userCount} users
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {role.permissions.userManagement ? (
                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-red-500 mx-auto" />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {role.permissions.programManagement ? (
                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-red-500 mx-auto" />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {role.permissions.evaluations ? (
                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-red-500 mx-auto" />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {role.permissions.reports ? (
                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-red-500 mx-auto" />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {role.permissions.settings ? (
                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-red-500 mx-auto" />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/admin/roles/${role.id}`} className="text-blue-600 hover:text-blue-900">
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Shield className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Permission Changes
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Changes to role permissions will affect all users assigned to that role. Please review carefully before making changes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RolesPermissions;