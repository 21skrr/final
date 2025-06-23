import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import api from '../services/api';

const HRChecklistNotifications: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sentNotifications, setSentNotifications] = useState<any[]>([]); // Mocked list

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);
    try {
      await api.post('/notifications', { userId, title, message });
      setSuccess('Notification sent!');
      setSentNotifications([
        { userId, title, message, date: new Date().toLocaleString() },
        ...sentNotifications,
      ]);
      setUserId('');
      setTitle('');
      setMessage('');
    } catch (err) {
      setError('Failed to send notification.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Checklist Notifications</h1>
        <form onSubmit={handleSend} className="space-y-4 bg-white shadow rounded-lg p-6 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700">User ID</label>
            <input type="text" value={userId} onChange={e => setUserId(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Message</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
          </div>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{loading ? 'Sending...' : 'Send Notification'}</button>
          {success && <div className="text-green-600 text-sm mt-2">{success}</div>}
          {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
        </form>
        <div className="bg-white shadow rounded-lg p-6 mt-6 max-w-2xl">
          <h2 className="text-lg font-bold mb-4">Sent Notifications</h2>
          {sentNotifications.length === 0 ? (
            <div className="text-gray-500">No notifications sent yet.</div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {sentNotifications.map((n, idx) => (
                <li key={idx} className="py-2">
                  <div className="font-medium">{n.title}</div>
                  <div className="text-sm text-gray-700">{n.message}</div>
                  <div className="text-xs text-gray-400">To: {n.userId} | {n.date}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default HRChecklistNotifications; 