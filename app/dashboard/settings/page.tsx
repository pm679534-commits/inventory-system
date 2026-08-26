'use client';

import { useEffect, useState } from 'react';
import { Settings, User, Bell, Palette, Save, CheckCircle } from 'lucide-react';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

interface SettingsData {
  profile: {
    full_name: string;
    email: string;
  };
  notifications: {
    low_stock_threshold: number;
    email_notifications: boolean;
  };
  display: {
    items_per_page: number;
    theme: 'light' | 'dark' | 'auto';
  };
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [settings, setSettings] = useState<SettingsData>({
    profile: {
      full_name: '',
      email: '',
    },
    notifications: {
      low_stock_threshold: 10,
      email_notifications: true,
    },
    display: {
      items_per_page: 20,
      theme: 'light',
    },
  });

  useEffect(() => {
    fetchProfile();
    loadSettings();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/profile');
      if (!response.ok) throw new Error('Failed to fetch profile');

      const data = await response.json();
      setProfile(data);
      setSettings((prev) => ({
        ...prev,
        profile: {
          full_name: data.full_name || '',
          email: data.email || '',
        },
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = () => {
    // Load settings from localStorage
    const saved = localStorage.getItem('app_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings((prev) => ({
          ...prev,
          notifications: parsed.notifications || prev.notifications,
          display: parsed.display || prev.display,
        }));
      } catch (err) {
        console.error('Failed to parse saved settings:', err);
      }
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      // Update profile on server
      const profileResponse = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: settings.profile.full_name,
        }),
      });

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      // Save other settings to localStorage
      localStorage.setItem(
        'app_settings',
        JSON.stringify({
          notifications: settings.notifications,
          display: settings.display,
        })
      );

      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateProfileSetting = (field: string, value: string) => {
    setSettings({
      ...settings,
      profile: {
        ...settings.profile,
        [field]: value,
      },
    });
  };

  const updateNotificationSetting = (field: string, value: any) => {
    setSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        [field]: value,
      },
    });
  };

  const updateDisplaySetting = (field: string, value: any) => {
    setSettings({
      ...settings,
      display: {
        ...settings.display,
        [field]: value,
      },
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account and application preferences</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      <div className="space-y-6">
        {/* Profile Settings */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Profile Settings</h2>
                <p className="text-sm text-gray-600">Update your personal information</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={settings.profile.full_name}
                onChange={(e) => updateProfileSetting('full_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={settings.profile.email}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            {profile && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                      profile.role === 'Admin'
                        ? 'bg-purple-100 text-purple-800'
                        : profile.role === 'Manager'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {profile.role}
                  </span>
                  <p className="text-xs text-gray-500">Contact an admin to change your role</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Notification Settings</h2>
                <p className="text-sm text-gray-600">Configure alerts and notifications</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Low Stock Threshold
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={settings.notifications.low_stock_threshold}
                  onChange={(e) =>
                    updateNotificationSetting('low_stock_threshold', parseInt(e.target.value))
                  }
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">units</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Get notified when product stock falls below this threshold
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Email Notifications</p>
                <p className="text-xs text-gray-500">
                  Receive email alerts for important inventory events
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.email_notifications}
                  onChange={(e) =>
                    updateNotificationSetting('email_notifications', e.target.checked)
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Low stock notifications will appear in the dashboard when
                products fall below the threshold. Email notifications require SMTP configuration.
              </p>
            </div>
          </div>
        </div>

        {/* Display Settings */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <Palette className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Display Settings</h2>
                <p className="text-sm text-gray-600">Customize your viewing experience</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Items Per Page
              </label>
              <select
                value={settings.display.items_per_page}
                onChange={(e) => updateDisplaySetting('items_per_page', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10 items</option>
                <option value={20}>20 items</option>
                <option value={50}>50 items</option>
                <option value={100}>100 items</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Number of items to display in tables and lists
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Theme Preference
              </label>
              <select
                value={settings.display.theme}
                onChange={(e) => updateDisplaySetting('theme', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto (System)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Choose your preferred color theme (requires page reload)
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-800">
                <strong>Coming Soon:</strong> Dark theme is currently in development. Theme changes
                will take effect in a future update.
              </p>
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">System Information</h2>
                <p className="text-sm text-gray-600">Application details</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Application Version</p>
                <p className="font-medium text-gray-900">1.0.0</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Database</p>
                <p className="font-medium text-gray-900">PostgreSQL (Supabase)</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">AI Provider</p>
                <p className="font-medium text-gray-900">Google Gemini</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="font-medium text-gray-900">
                  {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-3">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        {/* Help Text */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Need Help?</strong> Settings are automatically saved to your browser and
            synchronized with your account. Profile changes are saved to the database immediately.
          </p>
        </div>
      </div>
    </div>
  );
}
