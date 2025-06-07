import React from 'react';
import Layout from '../../components/layout/Layout';
import { GraduationCap, Users, Clock } from 'lucide-react';

const Inkompass: React.FC = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-6">
            <GraduationCap className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">INKOMPASS Internship</h1>
          </div>

          <div className="space-y-6">
            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-gray-600">Duration: 3-12 months</span>
              </div>
              <div className="flex items-center">
                <Users className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-gray-600">Program Type: Internship</span>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Program Objective</h2>
              <p className="text-gray-600">
                INKOMPASS is designed to identify future talent for full-time roles at PMI. This global internship program gives university students valuable exposure to PMI's business operations and culture.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Onboarding Components</h2>
              <div className="space-y-3">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Buddy Program</h3>
                  <p className="text-blue-800">Each intern is paired with an experienced PMI employee who provides guidance and support throughout the internship.</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-medium text-green-900 mb-2">Local Induction</h3>
                  <p className="text-green-800">Comprehensive introduction to your local office, team, and immediate responsibilities.</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-medium text-purple-900 mb-2">Organizational Overview</h3>
                  <p className="text-purple-800">Deep dive into PMI's structure, strategy, and transformation journey.</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-medium text-yellow-900 mb-2">Networking Events</h3>
                  <p className="text-yellow-800">Regular opportunities to connect with other interns and PMI professionals.</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">What You'll Gain</h2>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <div className="h-2 w-2 bg-blue-500 rounded-full mr-3"></div>
                  Hands-on experience in a global organization
                </li>
                <li className="flex items-center">
                  <div className="h-2 w-2 bg-blue-500 rounded-full mr-3"></div>
                  Mentorship from industry professionals
                </li>
                <li className="flex items-center">
                  <div className="h-2 w-2 bg-blue-500 rounded-full mr-3"></div>
                  Exposure to innovative projects and initiatives
                </li>
                <li className="flex items-center">
                  <div className="h-2 w-2 bg-blue-500 rounded-full mr-3"></div>
                  Potential pathway to full-time employment
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Inkompass;