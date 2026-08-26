import { createClient } from '@/lib/supabase/server';
import ProfileForm from '@/components/dashboard/ProfileForm';

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single();

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
        <p className="text-gray-600">Manage your account information</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <ProfileForm user={user!} profile={profile} />
      </div>
    </div>
  );
}
