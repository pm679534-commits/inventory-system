'use client';

import { useState, useEffect } from 'react';
import { Bell, User, Shield, Database } from 'lucide-react';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
}

interface Settings {
  lowStockThreshold: number;
  criticalStockThreshold: number;
  emailNotifications: boolean;
  orderNotifications: boolean;
  stockAlerts: boolean;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [settings, setSettings] = useState<Settings>({
    lowStockThreshold: 10,
    criticalStockThreshold: 5,
    emailNotifications: true,
    orderNotifications: true,
    stockAlerts: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);

      // Load user profile
      const profileRes = await fetch('/api/profile');
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData);
      }

      // Load settings from localStorage (in a real app, this would come from the database)
      const savedSettings = localStorage.getItem('userSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setMessage(null);

      // Save to localStorage (in a real app, this would save to database)
      localStorage.setItem('userSettings', JSON.stringify(settings));

      setMessage({ type: 'success', text: 'Settings saved successfully!' });

      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleResetSettings = () => {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      const defaultSettings: Settings = {
        lowStockThreshold: 10,
        criticalStockThreshold: 5,
        emailNotifications: true,
        orderNotifications: true,
        stockAlerts: true,
      };
      setSettings(defaultSettings);
      localStorage.setItem('userSettings', JSON.stringify(defaultSettings));
      setMessage({ type: 'success', text: 'Settings reset to default' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account and application preferences</p>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'error'
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-green-50 text-green-800 border border-green-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        {/* Profile Information */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
              <p className="text-sm text-gray-600">Your account details</p>
            </div>
          </div>

          {profile && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={profile.full_name || ''}
                  disabled
                  placeholder="Not set"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-gray-500" />
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded">
                    {profile.role}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notification Preferences */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
              <p className="text-sm text-gray-600">Configure how you receive alerts</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">Email Notifications</div>
                <div className="text-sm text-gray-600">Receive notifications via email</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) =>
                    setSettings({ ...settings, emailNotifications: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">Order Notifications</div>
                <div className="text-sm text-gray-600">Get notified about new orders and status changes</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.orderNotifications}
                  onChange={(e) =>
                    setSettings({ ...settings, orderNotifications: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">Stock Alerts</div>
                <div className="text-sm text-gray-600">Alerts when stock levels are low or critical</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.stockAlerts}
                  onChange={(e) => setSettings({ ...settings, stockAlerts: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Inventory Thresholds */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Inventory Thresholds</h2>
              <p className="text-sm text-gray-600">Define when to trigger stock level alerts</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Low Stock Threshold
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="number"
                  min="1"
                  value={settings.lowStockThreshold}
                  onChange={(e) =>
                    setSettings({ ...settings, lowStockThreshold: parseInt(e.target.value) || 10 })
                  }
                  className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <span className="text-sm text-gray-600">
                  Alert when available stock falls below this number
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Critical Stock Threshold
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="number"
                  min="0"
                  value={settings.criticalStockThreshold}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      criticalStockThreshold: parseInt(e.target.value) || 5,
                    })
                  }
                  className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <span className="text-sm text-gray-600">
                  Critical alert when available stock falls below this number
                </span>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Critical threshold should be lower than low stock threshold.
                Current: Low Stock = {settings.lowStockThreshold}, Critical = {settings.criticalStockThreshold}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleResetSettings}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Reset to Default
          </button>
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
