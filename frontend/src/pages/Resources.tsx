import React from 'react';
import Layout from '../components/layout/Layout';
import { FileText, Video, Book, Download, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const Resources: React.FC = () => {
  const resources = [
    {
      title: 'Onboarding Guide',
      description: 'Comprehensive guide to your onboarding journey at PMI',
      type: 'document',
      link: '/documents/onboarding-guide.pdf',
      icon: <FileText className="h-6 w-6" />,
    },
    {
      title: 'Welcome to PMI',
      description: 'Introduction video from our CEO',
      type: 'video',
      link: '/videos/welcome',
      icon: <Video className="h-6 w-6" />,
    },
    {
      title: 'Company Policies',
      description: 'Essential policies and procedures',
      type: 'document',
      link: '/documents/policies.pdf',
      icon: <Book className="h-6 w-6" />,
    },
  ];

  const quickLinks = [
    { title: 'IT Support Portal', link: '/it-support' },
    { title: 'HR Portal', link: '/hr' },
    { title: 'Learning Platform', link: '/learning' },
    { title: 'Benefits Information', link: '/benefits' },
  ];

  const downloadableResources = [
    {
      title: 'Employee Handbook',
      size: '2.4 MB',
      format: 'PDF',
      link: '/downloads/handbook.pdf',
    },
    {
      title: 'Benefits Guide',
      size: '1.8 MB',
      format: 'PDF',
      link: '/downloads/benefits.pdf',
    },
    {
      title: 'IT Setup Guide',
      size: '956 KB',
      format: 'PDF',
      link: '/downloads/it-setup.pdf',
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Resources & Help</h1>
          <p className="text-gray-600">
            Access guides, documentation, and helpful resources for your journey at PMI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {resources.map((resource) => (
            <div key={resource.title} className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-blue-600 mb-4">{resource.icon}</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">{resource.title}</h3>
              <p className="text-gray-600 mb-4">{resource.description}</p>
              <Link
                to={resource.link}
                className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
              >
                Access Resource
                <ExternalLink className="h-4 w-4 ml-2" />
              </Link>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-purple-600 text-white p-4">
              <h2 className="text-lg font-medium">Quick Links</h2>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {quickLinks.map((link) => (
                  <Link
                    key={link.title}
                    to={link.link}
                    className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-150"
                  >
                    <span className="text-gray-900">{link.title}</span>
                    <ExternalLink className="h-4 w-4 ml-2 text-gray-400" />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-green-600 text-white p-4">
              <h2 className="text-lg font-medium">Downloadable Resources</h2>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                {downloadableResources.map((resource) => (
                  <div
                    key={resource.title}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-150"
                  >
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{resource.title}</h3>
                      <p className="text-xs text-gray-500">{resource.size} • {resource.format}</p>
                    </div>
                    <Link
                      to={resource.link}
                      className="text-green-600 hover:text-green-800"
                    >
                      <Download className="h-5 w-5" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Need Additional Help?</h2>
          <p className="text-gray-600 mb-4">
            Can't find what you're looking for? Our support team is here to help you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/contact"
              className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Contact Support
            </Link>
            <Link
              to="/faq"
              className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              View FAQ
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Resources;