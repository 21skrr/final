import React, { useState, useEffect } from 'react';
import { Table, Tag } from 'antd';
import resourceService from '../../services/resourceService';
import { Resource } from '../../types/resource';
import toast from 'react-hot-toast';

interface ResourceSummary extends Resource {
  accessCount: number;
}

const ManagerResourceView: React.FC = () => {
  const [summary, setSummary] = useState<ResourceSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const data = await resourceService.getResourceSummary();
        // The endpoint returns an object with resource and accessCount, let's flatten it.
        const formattedData = data.map((item: any) => ({
          ...item.resource,
          accessCount: item.accessCount,
        }));
        setSummary(formattedData);
      } catch (error) {
        toast.error('Failed to load resource summary.');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  const columns = [
    { 
      title: 'Title', 
      dataIndex: 'title', 
      key: 'title',
      sorter: (a: ResourceSummary, b: ResourceSummary) => a.title.localeCompare(b.title),
    },
    { 
      title: 'Type', 
      dataIndex: 'type', 
      key: 'type',
      filters: [
        { text: 'Document', value: 'document' },
        { text: 'Link', value: 'link' },
        { text: 'Video', value: 'video' },
        { text: 'Other', value: 'other' },
      ],
      onFilter: (value: any, record: ResourceSummary) => record.type.indexOf(value) === 0,
      render: (type: string) => <Tag>{type.toUpperCase()}</Tag>
    },
    { 
      title: 'Stage', 
      dataIndex: 'stage', 
      key: 'stage',
      sorter: (a: ResourceSummary, b: ResourceSummary) => a.stage.localeCompare(b.stage),
    },
    { 
      title: 'Access Count', 
      dataIndex: 'accessCount', 
      key: 'accessCount',
      sorter: (a: ResourceSummary, b: ResourceSummary) => a.accessCount - b.accessCount,
      defaultSortOrder: 'descend' as 'descend',
    },
  ];

  return (
    <Table
      dataSource={summary}
      columns={columns}
      rowKey="id"
      loading={loading}
      bordered
      title={() => <h3 style={{ margin: 0 }}>Resource Usage Summary</h3>}
    />
  );
};

export default ManagerResourceView; 