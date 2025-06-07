import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface ProgramCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
  color: string;
  count?: number;
}

const ProgramCard: React.FC<ProgramCardProps> = ({ 
  title, 
  description, 
  icon, 
  link, 
  color,
  count 
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden border-t-4 ${color} hover:shadow-lg transition-shadow duration-200`}>
      <div className="p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {icon}
          </div>
          <div className="ml-4">
            <div className="flex justify-between">
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
              {count !== undefined && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {count} active
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-500">{description}</p>
            <div className="mt-4">
              <Link 
                to={link} 
                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Learn more
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgramCard;