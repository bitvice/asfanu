'use client';

import * as React from 'react';
import { UserTable, UserItem } from '@/components/users/UserTable';
import { fetchUsersAction, updateUserRoleAction } from '@/features/users/actions';
import { UserRole } from '@/lib/security/cnp-masker';
import { Button } from '@/components/ui/button';
import { UserCog, RefreshCw } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = React.useState<UserItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadUsers = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUsersAction();
      setUsers(data as unknown as UserItem[]);
    } catch (err: unknown) {
      setError((err as Error).message || 'Nu aveți permisiunea de a accesa această pagină.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function handleRoleUpdate(userId: string, newRole: UserRole) {
    const res = await updateUserRoleAction(userId, newRole);
    if (res?.error) {
      alert(res.error);
    } else {
      loadUsers();
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <UserCog className="w-6 h-6 text-indigo-600" />
            Gestionare Utilizatori & Permisiuni
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Administrați rolurile de acces (`admin`, `operator`, `viewer`) ale utilizatorilor aplicației.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={loadUsers} disabled={loading} className="gap-1.5 text-xs">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Reîmprospătează
        </Button>
      </div>

      {error ? (
        <div className="p-8 text-center bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl text-red-700 dark:text-red-300 text-xs">
          {error}
        </div>
      ) : loading ? (
        <div className="h-48 flex items-center justify-center text-xs text-slate-400">
          Se încarcă lista de utilizatori...
        </div>
      ) : (
        <UserTable users={users} onRoleUpdate={handleRoleUpdate} />
      )}
    </div>
  );
}
