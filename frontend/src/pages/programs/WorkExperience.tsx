import React from 'react';
import Layout from '../../components/layout/Layout';
import { Clock, Briefcase, Users } from 'lucide-react';

const WorkExperience: React.FC = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-6">
            <Briefcase className="h-8 w-8 text-red-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Work Experience Program</h1>
          </div>

          <div className="space-y-6">
            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-gray-600">Duration: 1-12 months</span>
              </div>
              <div className="flex items-center">
                <Users className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-gray-600">Program Type: Short-term Placement</span>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Program Overview</h2>
              <p className="text-gray-600">
                The Work Experience Program is designed to address short-term resourcing needs while providing students with valuable business experience. This program offers flexible opportunities for hands-on learning in a professional environment.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Program Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="font-medium text-red-900 mb-2">Flexible Duration</h3>
                  <p className="text-red-800">Programs ranging from 1 to 12 months to suit different needs and schedules.</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Practical Experience</h3>
                  <p className="text-blue-800">Hands-on exposure to real business operations and projects.</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-medium text-green-900 mb-2">Mentorship</h3>
                  <p className="text-green-800">Support and guidance from experienced professionals.</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-medium text-yellow-900 mb-2">Skill Development</h3>
                  <p className="text-yellow-800">Opportunities to develop professional and technical skills.</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Support Structure</h2>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Onboarding Support</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Comprehensive buddy system</li>
                    <li>• Local office induction</li>
                    <li>• Regular check-ins</li>
                    <li>• Networking opportunities</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Program Benefits</h2>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <div className="h-2 w-2 bg-red-500 rounded-full mr-3"></div>
                  Real-world business experience
                </li>
                <li className="flex items-center">
                  <div className="h-2 w-2 bg-red-500 rounded-full mr-3"></div>
                  Professional network development
                </li>
                <li className="flex items-center">
                  <div className="h-2 w-2 bg-red-500 rounded-full mr-3"></div>
                  Career exploration opportunities
                </li>
                <li className="flex items-center">
                  <div className="h-2 w-2 bg-red-500 rounded-full mr-3"></div>
                  Flexible program duration
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default WorkExperience;