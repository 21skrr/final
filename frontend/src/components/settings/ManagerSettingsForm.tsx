import React, { useState, useEffect } from 'react';
import { Form, Select, Button, Spin, notification } from 'antd';
import settingsService from '../../services/settingsService';

const { Option } = Select;

const ManagerSettingsForm: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    settingsService.getManagerPreferences()
      .then(preferences => {
        form.setFieldsValue(preferences);
        setLoading(false);
      })
      .catch(() => {
        notification.error({ message: 'Failed to load preferences.' });
        setLoading(false);
      });
  }, [form]);

  const handleSave = async (values: any) => {
    setSaving(true);
    try {
      await settingsService.updateManagerPreferences(values);
      notification.success({ message: 'Preferences saved successfully!' });
    } catch (error) {
      notification.error({ message: 'Failed to save preferences.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Spin tip="Loading preferences..." />;
  }

  return (
    <Form form={form} layout="vertical" onFinish={handleSave}>
      <Form.Item name="notificationFrequency" label="Notification Frequency">
        <Select>
          <Option value="daily">Daily</Option>
          <Option value="weekly">Weekly</Option>
          <Option value="immediate">Immediate</Option>
        </Select>
      </Form.Item>

      <Form.Item name="dashboardLayout" label="Dashboard Layout">
        <Select>
          <Option value="compact">Compact</Option>
          <Option value="detailed">Detailed</Option>
        </Select>
      </Form.Item>

      <Form.Item name="teamVisibility" label="Team Visibility">
        <Select>
          <Option value="all">All Team Members</Option>
          <Option value="direct_reports">Direct Reports Only</Option>
        </Select>
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={saving}>
          Save Preferences
        </Button>
      </Form.Item>
    </Form>
  );
};

export default ManagerSettingsForm;