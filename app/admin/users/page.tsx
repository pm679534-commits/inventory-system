import { createClient } from '@/lib/supabase/server';
import UserManagementTable from '@/components/admin/UserManagementTable';

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
        <p className="text-gray-600">Manage user accounts and permissions</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200">
        <UserManagementTable profiles={profiles || []} />
      </div>
    </div>
  );
}
