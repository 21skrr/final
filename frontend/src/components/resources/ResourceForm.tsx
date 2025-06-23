import React from 'react';
import { Resource } from '../../types/resource';
import { Modal, Input, Select, Button, Form } from 'antd';

const { Option } = Select;

interface ResourceFormProps {
  open: boolean;
  onCancel: () => void;
  onFinish: (values: any) => void;
  initialValues?: Partial<Resource>;
  loading: boolean;
}

const ResourceForm: React.FC<ResourceFormProps> = ({ open, onCancel, onFinish, initialValues, loading }) => {
  const [form] = Form.useForm();

  React.useEffect(() => {
    if (open && initialValues) {
      form.setFieldsValue(initialValues);
    } else if (!open) {
      form.resetFields();
    }
  }, [initialValues, open, form]);

  const handleOk = () => {
    form
      .validateFields()
      .then(values => {
        onFinish(values);
      })
      .catch(info => {
        console.log('Validate Failed:', info);
      });
  };

  return (
    <Modal
      title={initialValues ? 'Edit Resource' : 'Add New Resource'}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      destroyOnClose
      footer={[
        <Button key="back" onClick={onCancel}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleOk}>
          {initialValues ? 'Save Changes' : 'Create Resource'}
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" initialValues={initialValues}>
        <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Please enter a title' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="url" label="URL" rules={[{ required: true, message: 'Please enter a URL' }, { type: 'url', message: 'Please enter a valid URL' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="type" label="Type" rules={[{ required: true, message: 'Please select a type' }]}>
          <Select>
            <Option value="document">Document</Option>
            <Option value="link">Link</Option>
            <Option value="video">Video</Option>
            <Option value="other">Other</Option>
          </Select>
        </Form.Item>
        <Form.Item name="stage" label="Stage" rules={[{ required: true, message: 'Please select a stage' }]}>
          <Select>
            <Option value="all">All</Option>
            <Option value="prepare">Prepare</Option>
            <Option value="orient">Orient</Option>
            <Option value="land">Land</Option>
            <Option value="integrate">Integrate</Option>
            <Option value="excel">Excel</Option>
          </Select>
        </Form.Item>
        <Form.Item name="programType" label="Program Type" initialValue="all">
          <Select placeholder="Select a program type">
            <Option value="all">All Programs</Option>
            <Option value="inkompass">Inkompass</Option>
            <Option value="earlyTalent">Early Talent</Option>
            <Option value="apprenticeship">Apprenticeship</Option>
            <Option value="academicPlacement">Academic Placement</Option>
            <Option value="workExperience">Work Experience</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ResourceForm; 