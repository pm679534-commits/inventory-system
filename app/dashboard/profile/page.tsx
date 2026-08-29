import { createClient } from '@/lib/supabase/server';
import ProfileForm from '@/components/dashboard/ProfileForm';
import { t } from '@/lib/i18n';

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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-2">{t('profile.title')}</h1>
        <p className="text-gray-600 dark:text-gray-400">{t('profile.subtitle')}</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
        <ProfileForm user={user!} profile={profile} />
      </div>
    </div>
  );
}
