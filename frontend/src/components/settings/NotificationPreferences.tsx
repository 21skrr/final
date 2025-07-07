import React, { useState, useEffect } from 'react';
import { Bell, Mail, Smartphone, Clock, Save, X } from 'lucide-react';
import notificationService, { NotificationPreferences } from '../../services/notificationService';

interface NotificationPreferencesProps {
  onClose?: () => void;
}

const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({ onClose }) => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: {
      checklistAssignments: true,
      reminders: true,
      feedbackForms: true,
      documents: true,
      coachingSessions: true,
    },
    inAppNotifications: {
      checklistAssignments: true,
      reminders: true,
      feedbackForms: true,
      documents: true,
      coachingSessions: true,
    },
    pushNotifications: {
      checklistAssignments: false,
      reminders: true,
      feedbackForms: false,
      documents: false,
      coachingSessions: false,
    },
    frequency: 'daily',
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getPreferences();
      setPreferences(data);
    } catch (error) {
      console.error('Error loading preferences:', error);
      // Keep default preferences if loading fails
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await notificationService.updatePreferences(preferences);
      setMessage({ type: 'success', text: 'Preferences saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage({ type: 'error', text: 'Failed to save preferences. Please try again.' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const updateChannelPreference = (channel: keyof NotificationPreferences, type: string, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [type]: value,
      },
    }));
  };

  const updateFrequency = (frequency: 'daily' | 'weekly' | 'monthly') => {
    setPreferences(prev => ({
      ...prev,
      frequency,
    }));
  };

  const updateQuietHours = (field: 'enabled' | 'start' | 'end', value: boolean | string) => {
    setPreferences(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        [field]: value,
      },
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Notification Preferences</h2>
            <p className="text-gray-600">Customize how and when you receive notifications</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-8">
        {/* Notification Channels */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Channels</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Email Notifications */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center mb-4">
                <Mail className="h-5 w-5 text-blue-500 mr-2" />
                <h4 className="font-medium text-gray-900">Email Notifications</h4>
              </div>
              <div className="space-y-3">
                {Object.entries(preferences.emailNotifications).map(([key, value]) => (
                  <label key={key} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => updateChannelPreference('emailNotifications', key, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* In-App Notifications */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center mb-4">
                <Bell className="h-5 w-5 text-green-500 mr-2" />
                <h4 className="font-medium text-gray-900">In-App Notifications</h4>
              </div>
              <div className="space-y-3">
                {Object.entries(preferences.inAppNotifications).map(([key, value]) => (
                  <label key={key} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => updateChannelPreference('inAppNotifications', key, e.target.checked)}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Push Notifications */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center mb-4">
                <Smartphone className="h-5 w-5 text-purple-500 mr-2" />
                <h4 className="font-medium text-gray-900">Push Notifications</h4>
              </div>
              <div className="space-y-3">
                {Object.entries(preferences.pushNotifications).map(([key, value]) => (
                  <label key={key} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => updateChannelPreference('pushNotifications', key, e.target.checked)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Frequency Settings */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Frequency</h3>
          <div className="space-y-3">
            {[
              { value: 'daily', label: 'Daily digest' },
              { value: 'weekly', label: 'Weekly summary' },
              { value: 'monthly', label: 'Monthly report' },
            ].map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="radio"
                  name="frequency"
                  value={option.value}
                  checked={preferences.frequency === option.value}
                  onChange={(e) => updateFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')}
                  className="border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center mb-4">
            <Clock className="h-5 w-5 text-orange-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Quiet Hours</h3>
          </div>
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.quietHours.enabled}
                onChange={(e) => updateQuietHours('enabled', e.target.checked)}
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <span className="ml-2 text-sm text-gray-700">Enable quiet hours</span>
            </label>
            
            {preferences.quietHours.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={preferences.quietHours.start}
                    onChange={(e) => updateQuietHours('start', e.target.value)}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={preferences.quietHours.end}
                    onChange={(e) => updateQuietHours('end', e.target.value)}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferences; 