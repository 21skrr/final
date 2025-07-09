import React, { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { Settings, Save } from 'lucide-react';
import api from '../../services/api';

const SystemSettings: React.FC = () => {
  const [cron3, setCron3] = useState('0 2 * * *');
  const [cron6, setCron6] = useState('0 3 * * *');
  const [cron12, setCron12] = useState('0 4 * * *');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/settings/system').then(res => {
      setCron3(res.data.evaluationAutomationCron_3month || '0 2 * * *');
      setCron6(res.data.evaluationAutomationCron_6month || '0 3 * * *');
      setCron12(res.data.evaluationAutomationCron_12month || '0 4 * * *');
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      await api.put('/settings/system', {
        evaluationAutomationCron_3month: cron3,
        evaluationAutomationCron_6month: cron6,
        evaluationAutomationCron_12month: cron12,
      });
      setSuccess(true);
    } catch (err) {
      setError('Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage system-wide configurations and preferences
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6">
          {/* Automation Schedules */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <Settings className="h-5 w-5 mr-2 text-gray-500" />
                Evaluation Automation Schedules
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">3-Month Evaluation Cron</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={cron3}
                  onChange={e => setCron3(e.target.value)}
                  disabled={loading || saving}
                />
                <p className="text-xs text-gray-500 mt-1">e.g. 0 2 * * * for 2:00 AM daily</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">6-Month Evaluation Cron</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={cron6}
                  onChange={e => setCron6(e.target.value)}
                  disabled={loading || saving}
                />
                <p className="text-xs text-gray-500 mt-1">e.g. 0 3 * * * for 3:00 AM daily</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">12-Month Evaluation Cron</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={cron12}
                  onChange={e => setCron12(e.target.value)}
                  disabled={loading || saving}
                />
                <p className="text-xs text-gray-500 mt-1">e.g. 0 4 * * * for 4:00 AM daily</p>
              </div>
              <p className="text-xs text-gray-500 mt-1">Use <a href="https://crontab.guru/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">crontab.guru</a> to build your schedule.</p>
              {success && <div className="text-green-600">Saved!</div>}
              {error && <div className="text-red-600">{error}</div>}
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={handleSave}
            disabled={loading || saving}
          >
            <Save className="h-5 w-5 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default SystemSettings;