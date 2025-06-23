import React, { useState, useEffect } from 'react';
import { Form, Select, Switch, Button, Spin, notification, Card, Typography, Row, Col } from 'antd';
import settingsService from '../../services/settingsService';
import { useAuth } from '../../context/AuthContext';

const { Option } = Select;
const { Text } = Typography;

const UserSettingsForm: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      setLoading(true);
      settingsService.getUserSettings(user.id)
        .then(settings => {
          form.setFieldsValue(settings);
          setLoading(false);
        })
        .catch(() => {
          notification.error({ message: 'Failed to load user settings.' });
          setLoading(false);
        });
    }
  }, [user, form]);

  const handleSave = async (values: any) => {
    if (!user) return;
    setSaving(true);
    try {
      await settingsService.updateUserSettings(user.id, values);
      notification.success({ message: 'Settings saved successfully!' });
    } catch (error) {
      notification.error({ message: 'Failed to save settings.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Spin tip="Loading settings..." />;
  }

  return (
    <Form form={form} layout="vertical" onFinish={handleSave}>
      <Card title="Notification Settings" style={{ marginBottom: 24 }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Text strong>Email Notifications</Text>
            <br />
            <Text type="secondary">Receive notifications via email</Text>
          </Col>
          <Col>
            <Form.Item name="emailNotifications" valuePropName="checked" noStyle>
              <Switch />
            </Form.Item>
          </Col>
        </Row>
        <hr style={{ border: 'none', borderTop: '1px solid #f0f0f0', margin: '16px 0' }} />
        <Row align="middle" justify="space-between">
          <Col>
            <Text strong>Push Notifications</Text>
            <br />
            <Text type="secondary">Receive in-app notifications</Text>
          </Col>
          <Col>
            <Form.Item name="pushNotifications" valuePropName="checked" noStyle>
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title="Privacy Settings" style={{ marginBottom: 24 }}>
         <Form.Item label="Profile Visibility" name="profileVisibility">
             <Text type="secondary">Control who can see your profile information</Text>
            <Select>
                <Option value="public">Everyone</Option>
                <Option value="team">Team Only</Option>
                <Option value="private">Supervisors & Admins Only</Option>
            </Select>
        </Form.Item>
        <hr style={{ border: 'none', borderTop: '1px solid #f0f0f0', margin: '16px 0' }} />
        <Row align="middle" justify="space-between">
            <Col>
                <Text strong>Activity Status</Text>
                <br />
                <Text type="secondary">Show when you're active on the platform</Text>
            </Col>
            <Col>
                <Form.Item name="activityStatus" valuePropName="checked" noStyle>
                    <Switch />
                </Form.Item>
            </Col>
        </Row>
      </Card>

      <Card title="Appearance">
        <Form.Item label="Theme" name="theme">
            <Text type="secondary">Choose your preferred color theme</Text>
            <Select>
                <Option value="light">Light</Option>
                <Option value="dark">Dark</Option>
                <Option value="system">System Default</Option>
            </Select>
        </Form.Item>
        <hr style={{ border: 'none', borderTop: '1px solid #f0f0f0', margin: '16px 0' }} />
        <Row align="middle" justify="space-between">
            <Col>
                <Text strong>Compact Mode</Text>
                <br />
                <Text type="secondary">Use a more compact layout</Text>
            </Col>
            <Col>
                <Form.Item name="compactMode" valuePropName="checked" noStyle>
                    <Switch />
                </Form.Item>
            </Col>
        </Row>
      </Card>

      <Form.Item style={{ marginTop: 24 }}>
        <Button type="primary" htmlType="submit" loading={saving}>
          Save Changes
        </Button>
      </Form.Item>
    </Form>
  );
};

export default UserSettingsForm;