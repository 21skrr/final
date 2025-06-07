import React from 'react';
import Layout from '../components/layout/Layout';
import { User, Mail, Phone, Building, Calendar, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Profile: React.FC = () => {
  const { user } = useAuth();

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="bg-blue-600 px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-white">Profile Information</h3>
            <p className="mt-1 max-w-2xl text-sm text-blue-100">Personal details and application settings.</p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <div className="flex items-center space-x-4">
              <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
                <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>

            <dl className="mt-6 space-y-6 divide-y divide-gray-200">
              <div className="pt-6">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Mail className="h-5 w-5 mr-2 text-gray-400" />
                  Email Address
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{user?.email}</dd>
              </div>

              <div className="pt-6">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Building className="h-5 w-5 mr-2 text-gray-400" />
                  Department
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{user?.department}</dd>
              </div>

              <div className="pt-6">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-gray-400" />
                  Start Date
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{user?.startDate}</dd>
              </div>

              {user?.programType && (
                <div className="pt-6">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <BookOpen className="h-5 w-5 mr-2 text-gray-400" />
                    Program
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 capitalize">
                    {user.programType.replace(/([A-Z])/g, ' $1').trim()}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Account Settings</h3>
            <div className="mt-6 space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="mt-1">
                  <input
                    type="email"
                    name="email"
                    id="email"
                    defaultValue={user?.email}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Change Password
                </label>
                <div className="mt-1">
                  <input
                    type="password"
                    name="password"
                    id="password"
                    placeholder="Enter new password"
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;