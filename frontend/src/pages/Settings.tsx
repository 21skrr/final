import React from 'react';
import Layout from '../components/layout/Layout';
import { Bell, Lock, Eye, Globe, Moon, Volume2 } from 'lucide-react';

const Settings: React.FC = () => {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900">Notification Settings</h2>
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
                  <p className="text-sm text-gray-500">Receive notifications via email</p>
                </div>
                <button
                  type="button"
                  className="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 bg-blue-600"
                  role="switch"
                  aria-checked="true"
                >
                  <span className="translate-x-5 pointer-events-none relative inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200"></span>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Push Notifications</h3>
                  <p className="text-sm text-gray-500">Receive in-app notifications</p>
                </div>
                <button
                  type="button"
                  className="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 bg-blue-600"
                  role="switch"
                  aria-checked="true"
                >
                  <span className="translate-x-5 pointer-events-none relative inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200"></span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900">Privacy Settings</h2>
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Profile Visibility</h3>
                  <p className="text-sm text-gray-500">Control who can see your profile information</p>
                </div>
                <select className="mt-1 block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                  <option>Everyone</option>
                  <option>Team Only</option>
                  <option>Supervisors Only</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Activity Status</h3>
                  <p className="text-sm text-gray-500">Show when you're active on the platform</p>
                </div>
                <button
                  type="button"
                  className="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 bg-gray-200"
                  role="switch"
                  aria-checked="false"
                >
                  <span className="translate-x-0 pointer-events-none relative inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200"></span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900">Appearance</h2>
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Theme</h3>
                  <p className="text-sm text-gray-500">Choose your preferred color theme</p>
                </div>
                <select className="mt-1 block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                  <option>Light</option>
                  <option>Dark</option>
                  <option>System</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Compact Mode</h3>
                  <p className="text-sm text-gray-500">Use a more compact layout</p>
                </div>
                <button
                  type="button"
                  className="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 bg-gray-200"
                  role="switch"
                  aria-checked="false"
                >
                  <span className="translate-x-0 pointer-events-none relative inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200"></span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Save Changes
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;