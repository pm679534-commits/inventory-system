'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, UserCog, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDateTime } from '@/lib/utils';
import type { Profile, UserRole } from '@/lib/types';

interface UserManagementTableProps {
  profiles: Profile[];
}

export default function UserManagementTable({ profiles }: UserManagementTableProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setIsUpdating(userId);
    setMessage(null);

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) {
        setMessage({ type: 'error', text: error.message });
        return;
      }

      setMessage({ type: 'success', text: `Role updated to ${newRole}` });
      router.refresh();

      setTimeout(() => {
        setMessage(null);
      }, 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setIsUpdating(null);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'Admin':
        return <Shield className="w-4 h-4" />;
      case 'Manager':
        return <UserCog className="w-4 h-4" />;
      case 'Staff':
        return <User className="w-4 h-4" />;
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Manager':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Staff':
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (profiles.length === 0) {
    return (
      <div className="p-12 text-center">
        <p className="text-gray-600">No users found</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {message && (
        <div
          className={`mb-4 p-4 rounded-lg ${
            message.type === 'error'
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-green-50 text-green-800 border border-green-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">User</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Role</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Joined</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {profiles.map((profile) => (
              <tr key={profile.id} className="hover:bg-gray-50">
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {profile.full_name || 'No name'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <p className="text-sm text-gray-600">{profile.email}</p>
                </td>
                <td className="py-4 px-4">
                  <span
                    className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(
                      profile.role
                    )}`}
                  >
                    {getRoleIcon(profile.role)}
                    <span>{profile.role}</span>
                  </span>
                </td>
                <td className="py-4 px-4">
                  <p className="text-sm text-gray-600">{formatDateTime(profile.created_at)}</p>
                </td>
                <td className="py-4 px-4">
                  <select
                    value={profile.role}
                    onChange={(e) => handleRoleChange(profile.id, e.target.value as UserRole)}
                    disabled={isUpdating === profile.id}
                    className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="Staff">Staff</option>
                    <option value="Manager">Manager</option>
                    <option value="Admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          Total users: <span className="font-semibold text-gray-900">{profiles.length}</span>
        </p>
      </div>
    </div>
  );
}
