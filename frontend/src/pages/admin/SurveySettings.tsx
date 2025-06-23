import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import surveyService from '../../services/surveyService';
import { Save } from 'lucide-react';
import { SurveySettingsData } from '../../types/survey';

const defaultSettings = {
  defaultAnonymous: false,
  allowComments: true,
  requireEvidence: false,
  autoReminders: true,
  reminderFrequency: 7,
  responseDeadlineDays: 14,
};

const SurveySettings: React.FC = () => {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await surveyService.getSurveySettings();
      setSettings(res.data || res);
    } catch (err: any) {
      setError('Failed to load settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess('');
    try {
      await surveyService.updateSurveySettings(settings);
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err: any) {
      setError('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
        <Layout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </Layout>
      );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {success && <div className="mb-4 text-green-600">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Survey Settings</h1>
              <p className="mt-2 text-gray-600">Configure global settings for surveys and automation.</p>
            </div>
            <button type="submit" disabled={saving} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
              <Save size={16} className="mr-2" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6 space-y-6">
            {error && <div className="text-red-600">{error}</div>}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="defaultAnonymous"
                checked={settings.defaultAnonymous}
                onChange={handleChange}
                className="h-4 w-4"
                disabled={saving}
              />
              <label htmlFor="defaultAnonymous" className="font-medium">Default Anonymous</label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="allowComments"
                checked={settings.allowComments}
                onChange={handleChange}
                className="h-4 w-4"
                disabled={saving}
              />
              <label htmlFor="allowComments" className="font-medium">Allow Comments</label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="requireEvidence"
                checked={settings.requireEvidence}
                onChange={handleChange}
                className="h-4 w-4"
                disabled={saving}
              />
              <label htmlFor="requireEvidence" className="font-medium">Require Evidence</label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="autoReminders"
                checked={settings.autoReminders}
                onChange={handleChange}
                className="h-4 w-4"
                disabled={saving}
              />
              <label htmlFor="autoReminders" className="font-medium">Auto Reminders</label>
            </div>
            <div className="flex items-center gap-3">
              <label htmlFor="reminderFrequency" className="font-medium w-48">Reminder Frequency (days)</label>
              <input
                type="number"
                name="reminderFrequency"
                value={settings.reminderFrequency}
                onChange={handleChange}
                className="border rounded px-3 py-2 w-24"
                min={1}
                disabled={saving}
              />
            </div>
            <div className="flex items-center gap-3">
              <label htmlFor="responseDeadlineDays" className="font-medium w-48">Response Deadline (days)</label>
              <input
                type="number"
                name="responseDeadlineDays"
                value={settings.responseDeadlineDays}
                onChange={handleChange}
                className="border rounded px-3 py-2 w-24"
                min={1}
                disabled={saving}
              />
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default SurveySettings; 