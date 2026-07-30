import { Sidebar } from '@/components/shared/Sidebar';
import { Header } from '@/components/shared/Header';
import { getCurrentUserProfile } from '@/services/auth.service';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentUserProfile();

  return (
    <div className="flex min-h-screen dashboard-bg transition-colors relative">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50/70 dark:bg-slate-950/80 backdrop-blur-[2px]">
        <Header
          userEmail={profile?.email}
          userName={profile?.fullName}
          userRole={profile?.role}
        />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
