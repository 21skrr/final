import React from 'react';
import Layout from '../../components/layout/Layout';
import { GraduationCap, Clock, Users } from 'lucide-react';

const AcademicPlacement: React.FC = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-6">
            <GraduationCap className="h-8 w-8 text-purple-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Academic Placement Program</h1>
          </div>

          <div className="space-y-6">
            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-gray-600">Duration: 3-12 months</span>
              </div>
              <div className="flex items-center">
                <Users className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-gray-600">Program Type: Student Placement</span>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Program Overview</h2>
              <p className="text-gray-600">
                The Academic Placement Program provides students with valuable business experience directly linked to their academic curriculum. This program bridges the gap between academic theory and practical application in a professional environment.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Program Components</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-medium text-purple-900 mb-2">Practical Experience</h3>
                  <p className="text-purple-800">Real-world application of academic knowledge in a business context.</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Academic Integration</h3>
                  <p className="text-blue-800">Projects and assignments aligned with your course requirements.</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-medium text-green-900 mb-2">Professional Development</h3>
                  <p className="text-green-800">Skills development and career guidance opportunities.</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-medium text-yellow-900 mb-2">Industry Exposure</h3>
                  <p className="text-yellow-800">Insight into PMI's operations and industry practices.</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Support Structure</h2>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Buddy System</h3>
                  <p className="text-gray-700">Each student is paired with an experienced colleague for day-to-day support.</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Local Induction</h3>
                  <p className="text-gray-700">Comprehensive introduction to PMI's local operations and team.</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Networking Events</h3>
                  <p className="text-gray-700">Regular opportunities to connect with other placement students and professionals.</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Learning Outcomes</h2>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <div className="h-2 w-2 bg-purple-500 rounded-full mr-3"></div>
                  Professional work experience
                </li>
                <li className="flex items-center">
                  <div className="h-2 w-2 bg-purple-500 rounded-full mr-3"></div>
                  Industry-specific knowledge
                </li>
                <li className="flex items-center">
                  <div className="h-2 w-2 bg-purple-500 rounded-full mr-3"></div>
                  Practical skills development
                </li>
                <li className="flex items-center">
                  <div className="h-2 w-2 bg-purple-500 rounded-full mr-3"></div>
                  Career pathway opportunities
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AcademicPlacement;