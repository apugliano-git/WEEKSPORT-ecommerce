import { AdminNav } from '@/components/admin/AdminNav';

export const metadata = {
  title: 'Panel Admin — WEEKSPORT',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-white">
      <AdminNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
