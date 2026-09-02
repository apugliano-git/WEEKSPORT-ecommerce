import { redirect } from 'next/navigation';
import { AdminNav } from '@/components/admin/AdminNav';
import { createClient } from '@/lib/supabase/server';
import { isAdminUser } from '@/lib/security/auth';

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!isAdminUser(user)) redirect('/admin/login');

  return (
    <div className="min-h-screen bg-[#0F0F12] font-sans text-white">
      <AdminNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
