import React from 'react';
import Layout from '../../components/layout/Layout';
import { Settings, Bell, Lock, Mail, Users, Database, Save } from 'lucide-react';

const SystemSettings: React.FC = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage system-wide configurations and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* General Settings */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <Settings className="h-5 w-5 mr-2 text-gray-500" />
                General Settings
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  System Name
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  defaultValue="PMI Onboarding Portal"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Time Zone
                </label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  defaultValue="UTC"
                >
                  <option value="UTC">UTC</option>
                  <option value="EST">Eastern Time</option>
                  <option value="CST">Central Time</option>
                  <option value="PST">Pacific Time</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date Format
                </label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  defaultValue="MM/DD/YYYY"
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <Bell className="h-5 w-5 mr-2 text-gray-500" />
                Notification Settings
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-4">
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
                    <span className="translate-x-5 pointer-events-none relative inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200">
                      <span className="opacity-0 ease-in duration-200 absolute inset-0 h-full w-full flex items-center justify-center transition-opacity" aria-hidden="true">
                        <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 12 12">
                          <path d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </span>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">System Notifications</h3>
                    <p className="text-sm text-gray-500">Receive in-app notifications</p>
                  </div>
                  <button
                    type="button"
                    className="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 bg-blue-600"
                    role="switch"
                    aria-checked="true"
                  >
                    <span className="translate-x-5 pointer-events-none relative inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200">
                      <span className="opacity-0 ease-in duration-200 absolute inset-0 h-full w-full flex items-center justify-center transition-opacity" aria-hidden="true">
                        <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 12 12">
                          <path d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <Lock className="h-5 w-5 mr-2 text-gray-500" />
                Security Settings
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password Requirements
                </label>
                <div className="mt-2 space-y-4">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                        defaultChecked
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label className="font-medium text-gray-700">Require uppercase letters</label>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                        defaultChecked
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label className="font-medium text-gray-700">Require numbers</label>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                        defaultChecked
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label className="font-medium text-gray-700">Require special characters</label>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Minimum Password Length
                </label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  defaultValue="8"
                >
                  <option value="6">6 characters</option>
                  <option value="8">8 characters</option>
                  <option value="10">10 characters</option>
                  <option value="12">12 characters</option>
                </select>
              </div>
            </div>
          </div>

          {/* Integration Settings */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <Database className="h-5 w-5 mr-2 text-gray-500" />
                Integration Settings
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  API Key
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300"
                    placeholder="Enter API key"
                  />
                  <button
                    type="button"
                    className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 text-sm"
                  >
                    Generate
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Webhook URL
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="https://"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Save className="h-5 w-5 mr-2" />
            Save Changes
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default SystemSettings;