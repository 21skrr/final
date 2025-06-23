import React, { useEffect, useState } from 'react';
import { Book, Video, Link as LinkIcon, Download, AlertCircle } from 'lucide-react';
import resourceService from '../../services/resourceService';
import { ResourceAssignment } from '../../types/resource';

const ResourceIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'document':
      return <Book className="h-6 w-6 text-blue-500" />;
    case 'video':
      return <Video className="h-6 w-6 text-red-500" />;
    case 'link':
      return <LinkIcon className="h-6 w-6 text-green-500" />;
    default:
      return <Book className="h-6 w-6 text-gray-500" />;
  }
};

const EmployeeResources: React.FC = () => {
  const [assignments, setAssignments] = useState<ResourceAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const data = await resourceService.getAssignedResources();
        setAssignments(data);
      } catch (err) {
        setError('Failed to load resources.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchResources();
  }, []);

  if (loading) return <div>Loading resources...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div>
      {assignments.length === 0 ? (
        <div className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Resources Assigned</h3>
          <p className="mt-1 text-sm text-gray-500">You do not have any resources assigned to you at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-5">
                <div className="flex items-center">
                  <ResourceIcon type={assignment.resource.type} />
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{assignment.resource.title}</h3>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${assignment.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {assignment.status}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-sm text-gray-500">
                  {assignment.resource.description || 'No description available.'}
                </p>
              </div>
              <div className="px-5 py-3 bg-gray-50">
                <a
                  href={assignment.resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  View Resource
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmployeeResources;
