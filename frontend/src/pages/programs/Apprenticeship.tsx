import React from 'react';
import Layout from '../../components/layout/Layout';
import { BookOpen, Clock, Award } from 'lucide-react';

const Apprenticeship: React.FC = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-6">
            <BookOpen className="h-8 w-8 text-yellow-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Apprenticeship Program</h1>
          </div>

          <div className="space-y-6">
            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-gray-600">Duration: Varies by location</span>
              </div>
              <div className="flex items-center">
                <Award className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-gray-600">Program Type: Specialist Qualification</span>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Program Overview</h2>
              <p className="text-gray-600">
                The Apprenticeship Program combines practical work experience with structured learning, allowing participants to earn while they learn. This program is designed to develop specialist qualifications through a combination of on-the-job training and formal education.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Program Components</h2>
              <div className="space-y-4">
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-medium text-yellow-900 mb-2">Work-Based Learning</h3>
                  <p className="text-yellow-800">Hands-on experience in your chosen specialization area, working alongside experienced professionals.</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Formal Education</h3>
                  <p className="text-blue-800">Structured curriculum leading to recognized qualifications in your field.</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-medium text-green-900 mb-2">Mentorship Support</h3>
                  <p className="text-green-800">Guidance from experienced mentors throughout your apprenticeship journey.</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Key Features</h2>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <div className="h-2 w-2 bg-yellow-500 rounded-full mr-3"></div>
                  Earn while you learn
                </li>
                <li className="flex items-center">
                  <div className="h-2 w-2 bg-yellow-500 rounded-full mr-3"></div>
                  Recognized qualifications
                </li>
                <li className="flex items-center">
                  <div className="h-2 w-2 bg-yellow-500 rounded-full mr-3"></div>
                  Practical work experience
                </li>
                <li className="flex items-center">
                  <div className="h-2 w-2 bg-yellow-500 rounded-full mr-3"></div>
                  Career progression opportunities
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Support Structure</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <ul className="space-y-2 text-gray-600">
                  <li>• Dedicated buddy system</li>
                  <li>• Regular progress reviews</li>
                  <li>• Professional development workshops</li>
                  <li>• Networking opportunities</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Apprenticeship;