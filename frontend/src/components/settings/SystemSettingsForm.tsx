import React, { useState, useEffect } from 'react';
import { Form, Select, Button, Spin, notification, InputNumber, Switch } from 'antd';
import settingsService from '../../services/settingsService';

const { Option } = Select;

const SystemSettingsForm: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    settingsService.getSystemSettings()
      .then(settings => {
        // Antd Form needs a flat structure for fields, so we flatten the passwordPolicy
        const flatSettings = {
          ...settings,
          ...settings.passwordPolicy,
        };
        delete flatSettings.passwordPolicy;
        form.setFieldsValue(flatSettings);
        setLoading(false);
      })
      .catch(() => {
        notification.error({ message: 'Failed to load system settings.' });
        setLoading(false);
      });
  }, [form]);

  const handleSave = async (values: any) => {
    setSaving(true);
    // Reconstruct the nested passwordPolicy object before sending to the API
    const structuredSettings = {
      sessionTimeout: values.sessionTimeout,
      defaultRole: values.defaultRole,
      mfaRequired: values.mfaRequired,
      passwordPolicy: {
        minLength: values.minLength,
        requireUppercase: values.requireUppercase,
        requireNumbers: values.requireNumbers,
        requireSymbols: values.requireSymbols,
      },
    };

    try {
      await settingsService.updateSystemSettings(structuredSettings);
      notification.success({ message: 'System settings saved successfully!' });
    } catch (error) {
      notification.error({ message: 'Failed to save system settings.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Spin tip="Loading system settings..." />;
  }

  return (
    <Form form={form} layout="vertical" onFinish={handleSave}>
      <Form.Item name="sessionTimeout" label="Session Timeout (minutes)">
        <InputNumber min={1} max={120} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item name="defaultRole" label="Default Role for New Users">
        <Select>
          <Option value="employee">Employee</Option>
          <Option value="supervisor">Supervisor</Option>
          <Option value="manager">Manager</Option>
        </Select>
      </Form.Item>

      <Form.Item name="mfaRequired" label="Multi-Factor Authentication (MFA) Requirement">
        <Select>
          <Option value="all">Required for All Users</Option>
          <Option value="admins">Required for Admins Only</Option>
          <Option value="none">Not Required</Option>
        </Select>
      </Form.Item>

      <fieldset style={{ border: '1px solid #d9d9d9', padding: '16px', borderRadius: '2px', marginBottom: '24px' }}>
        <legend>Password Policy</legend>
        <Form.Item name="minLength" label="Minimum Length">
          <InputNumber min={6} max={32} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="requireUppercase" label="Require Uppercase Letter" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="requireNumbers" label="Require Number" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="requireSymbols" label="Require Symbol" valuePropName="checked">
          <Switch />
        </Form.Item>
      </fieldset>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={saving}>
          Save System Settings
        </Button>
      </Form.Item>
    </Form>
  );
};

export default SystemSettingsForm;