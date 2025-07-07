import React, { useState, useEffect } from 'react';
import { Table, Tag, Tabs } from 'antd';
import resourceService from '../../services/resourceService';
import { Resource } from '../../types/resource';
import toast from 'react-hot-toast';

interface ResourceSummary extends Resource {
  accessCount: number;
}

const ManagerResourceView: React.FC = () => {
  const [summary, setSummary] = useState<ResourceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<Resource[]>([]);
  const [recLoading, setRecLoading] = useState(false);

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

    const fetchRecommendations = async () => {
      setRecLoading(true);
      try {
        const data = await resourceService.getResourceRecommendations();
        setRecommendations(data);
      } catch (error) {
        toast.error('Failed to load recommendations.');
      } finally {
        setRecLoading(false);
      }
    };

    fetchSummary();
    fetchRecommendations();
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
    <Tabs defaultActiveKey="summary">
      <Tabs.TabPane tab="Summary" key="summary">
        <Table
          dataSource={summary}
          columns={columns}
          rowKey="id"
          loading={loading}
          bordered
          title={() => <h3 style={{ margin: 0 }}>Resource Usage Summary</h3>}
        />
      </Tabs.TabPane>
      <Tabs.TabPane tab="Recommendations" key="recommendations">
        {recLoading ? (
          <div>Loading recommendations...</div>
        ) : (
          <ul>
            {recommendations.map(res => (
              <li key={res.id}>{res.title} ({res.type})</li>
            ))}
          </ul>
        )}
      </Tabs.TabPane>
    </Tabs>
  );
};

export default ManagerResourceView; 