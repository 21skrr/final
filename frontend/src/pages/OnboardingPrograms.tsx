import React from 'react';
import Layout from '../components/layout/Layout';
import { BookOpen, Users, GraduationCap, Briefcase, Clock } from 'lucide-react';

const OnboardingPrograms: React.FC = () => {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* General Onboarding Programs */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-8">General Onboarding Programs</h2>
          
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">New Joiners Capability Building Plan</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <p className="ml-4"><span className="font-medium">Welcome Initiation:</span> Introduction to PMI, its brands, and categories.</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <p className="ml-4"><span className="font-medium">Digital Onboarding:</span> Access to the NEW2PMI Onboarding platform.</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <p className="ml-4"><span className="font-medium">Face-to-Face (F2F) Special Trainings:</span> Includes cycle meetings and language trainings.</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <p className="ml-4"><span className="font-medium">Buddy Program:</span> New hires are paired with a buddy for guidance.</p>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Core Onboarding Phases</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900">Prepare</h4>
                  <p className="text-sm text-blue-700 mt-2">Offer – Day 0: Completion of recruiting tasks, communication of location and start time.</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900">Orient</h4>
                  <p className="text-sm text-green-700 mt-2">Day 1: Induction, system training, equipment handover, team introduction.</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-medium text-yellow-900">Land</h4>
                  <p className="text-sm text-yellow-700 mt-2">Day 2-6: Start of self-study activities, introduction to buddy program, shadowing customer interactions.</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium text-purple-900">Integrate</h4>
                  <p className="text-sm text-purple-700 mt-2">Day 7-10: System autonomy, completion of final knowledge assessment.</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-medium text-red-900">Excel</h4>
                  <p className="text-sm text-red-700 mt-2">After Day 10: Focus on KPIs, individual career development plan, coaching sessions.</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Specialized Trainings</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900">Mandatory Trainings</h4>
                  <p className="text-gray-600 mt-2">Essential for all employees.</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900">Multicategory Trainings</h4>
                  <p className="text-gray-600 mt-2">Based on the employee's role and needs.</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900">Functional Trainings</h4>
                  <p className="text-gray-600 mt-2">Specific to the employee's function.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Early Careers Onboarding Programs */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Early Careers Onboarding Programs</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <GraduationCap className="h-8 w-8 text-blue-600" />
                <h3 className="text-xl font-semibold text-gray-900 ml-3">INKOMPASS Internship</h3>
              </div>
              <div className="space-y-3">
                <p><span className="font-medium">Duration:</span> 3-12 months</p>
                <p><span className="font-medium">Objective:</span> Identify future talent for full-time roles.</p>
                <p><span className="font-medium">Onboarding:</span> Buddy, local induction, organizational overview, and networking events.</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <Users className="h-8 w-8 text-green-600" />
                <h3 className="text-xl font-semibold text-gray-900 ml-3">Early Talent Development</h3>
              </div>
              <div className="space-y-3">
                <p><span className="font-medium">Duration:</span> 18-24 months</p>
                <p><span className="font-medium">Objective:</span> Develop key functional capabilities and create a junior talent pipeline.</p>
                <p><span className="font-medium">Onboarding:</span> Structured development via classroom training, case studies, and on-the-job learning.</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <BookOpen className="h-8 w-8 text-yellow-600" />
                <h3 className="text-xl font-semibold text-gray-900 ml-3">Apprenticeship</h3>
              </div>
              <div className="space-y-3">
                <p><span className="font-medium">Duration:</span> Varies by location</p>
                <p><span className="font-medium">Objective:</span> Combine working hours with a defined curriculum for specialist qualification.</p>
                <p><span className="font-medium">Onboarding:</span> Buddy, local induction, and networking events.</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <Briefcase className="h-8 w-8 text-purple-600" />
                <h3 className="text-xl font-semibold text-gray-900 ml-3">Academic Placement</h3>
              </div>
              <div className="space-y-3">
                <p><span className="font-medium">Duration:</span> 3-12 months</p>
                <p><span className="font-medium">Objective:</span> Provide students with business experience linked to their curriculum.</p>
                <p><span className="font-medium">Onboarding:</span> Buddy, local induction, and networking events.</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <Clock className="h-8 w-8 text-red-600" />
                <h3 className="text-xl font-semibold text-gray-900 ml-3">Work Experience</h3>
              </div>
              <div className="space-y-3">
                <p><span className="font-medium">Duration:</span> 1-12 months</p>
                <p><span className="font-medium">Objective:</span> Address short-term resourcing needs and provide students with business experience.</p>
                <p><span className="font-medium">Onboarding:</span> Buddy, local induction, and networking events.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default OnboardingPrograms;