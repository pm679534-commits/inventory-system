import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardNav from '@/components/dashboard/DashboardNav';

// Disable caching to always fetch fresh profile data from Supabase
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Always fetch fresh profile data from Supabase (no caching)
  // This ensures plan changes in the database reflect immediately on the website
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardNav user={user} profile={profile} />
      <main className="lg:pl-64">
        <div className="py-8 px-4 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
