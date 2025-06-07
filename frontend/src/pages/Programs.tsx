import React from 'react';
import Layout from '../components/layout/Layout';
import ProgramCard from '../components/features/ProgramCard';
import { Briefcase, GraduationCap, BookOpen, Users, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Programs: React.FC = () => {
  const { user } = useAuth();
  
  // Mock data for program counts (only visible to HR and Manager roles)
  const programCounts = {
    inkompass: 8,
    earlyTalent: 12,
    apprenticeship: 6,
    academicPlacement: 3,
    workExperience: 2,
  };
  
  const showCounts = user?.role === 'hr' || user?.role === 'manager';
  
  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Early Careers Programs</h1>
          <p className="text-gray-600">
            Explore PMI's various programs for early career professionals. Each program has a customized onboarding journey.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ProgramCard 
            title="INKOMPASS Internship" 
            description="A global internship program designed to give university students exposure to PMI's business operations."
            icon={<GraduationCap className="h-8 w-8 text-blue-600" />}
            link="/programs/inkompass"
            color="border-blue-500"
            count={showCounts ? programCounts.inkompass : undefined}
          />
          
          <ProgramCard 
            title="Early Talent Development" 
            description="A structured program for recent graduates to develop skills and knowledge in their chosen field."
            icon={<Briefcase className="h-8 w-8 text-green-600" />}
            link="/programs/early-talent"
            color="border-green-500"
            count={showCounts ? programCounts.earlyTalent : undefined}
          />
          
          <ProgramCard 
            title="Apprenticeship" 
            description="Hands-on training and education for developing practical skills in specific roles."
            icon={<BookOpen className="h-8 w-8 text-yellow-600" />}
            link="/programs/apprenticeship"
            color="border-yellow-500"
            count={showCounts ? programCounts.apprenticeship : undefined}
          />
          
          <ProgramCard 
            title="Academic Placement" 
            description="Opportunities for students to apply academic knowledge in a professional environment."
            icon={<Users className="h-8 w-8 text-purple-600" />}
            link="/programs/academic-placement"
            color="border-purple-500"
            count={showCounts ? programCounts.academicPlacement : undefined}
          />
          
          <ProgramCard 
            title="Work Experience" 
            description="Short-term placements providing insights into workplace operations and career paths."
            icon={<Clock className="h-8 w-8 text-red-600" />}
            link="/programs/work-experience"
            color="border-red-500"
            count={showCounts ? programCounts.workExperience : undefined}
          />
        </div>
        
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Looking for Help?</h2>
          <p className="text-gray-600 mb-4">
            If you have questions about any of our early careers programs or need assistance with the onboarding process, our team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="/resources"
              className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              View Resources
            </a>
            <a
              href="/contact"
              className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              Contact HR Team
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Programs;