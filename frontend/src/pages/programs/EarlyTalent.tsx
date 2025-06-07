import React from 'react';
import Layout from '../../components/layout/Layout';
import { Users, BookOpen, Target } from 'lucide-react';

const EarlyTalent: React.FC = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-6">
            <Users className="h-8 w-8 text-green-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Early Talent Development Program</h1>
          </div>

          <div className="space-y-6">
            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <BookOpen className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-gray-600">Duration: 18-24 months</span>
              </div>
              <div className="flex items-center">
                <Target className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-gray-600">Program Type: Graduate Development</span>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Program Overview</h2>
              <p className="text-gray-600">
                The Early Talent Development Program is designed to develop key functional capabilities and create a robust junior talent pipeline. This structured program combines hands-on experience with comprehensive training to prepare recent graduates for successful careers at PMI.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Development Components</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-medium text-green-900 mb-2">Classroom Training</h3>
                  <p className="text-green-800">Structured learning sessions covering essential business skills and industry knowledge.</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Case Studies</h3>
                  <p className="text-blue-800">Real-world business scenarios to develop problem-solving and analytical skills.</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-medium text-purple-900 mb-2">On-the-job Learning</h3>
                  <p className="text-purple-800">Practical experience through meaningful project assignments.</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-medium text-yellow-900 mb-2">Mentorship</h3>
                  <p className="text-yellow-800">Guidance from experienced professionals throughout your journey.</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Program Objectives</h2>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <div className="h-2 w-2 bg-green-500 rounded-full mr-3"></div>
                  Develop future leaders for PMI
                </li>
                <li className="flex items-center">
                  <div className="h-2 w-2 bg-green-500 rounded-full mr-3"></div>
                  Build strong functional capabilities
                </li>
                <li className="flex items-center">
                  <div className="h-2 w-2 bg-green-500 rounded-full mr-3"></div>
                  Foster innovation and fresh perspectives
                </li>
                <li className="flex items-center">
                  <div className="h-2 w-2 bg-green-500 rounded-full mr-3"></div>
                  Create a sustainable talent pipeline
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EarlyTalent;