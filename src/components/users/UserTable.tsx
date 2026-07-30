'use client';

import * as React from 'react';
import { UserRole } from '@/lib/security/cnp-masker';
import { RoleDialog } from './RoleDialog';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserCog, UserCheck, Shield } from 'lucide-react';

export interface UserItem {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

interface UserTableProps {
  users: UserItem[];
  onRoleUpdate: (userId: string, newRole: UserRole) => Promise<void>;
}

export function UserTable({ users, onRoleUpdate }: UserTableProps) {
  const [selectedUser, setSelectedUser] = React.useState<UserItem | null>(null);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-950">
            <TableRow>
              <TableHead className="text-xs">Utilizator / Nume</TableHead>
              <TableHead className="text-xs">Adresă Email</TableHead>
              <TableHead className="text-xs">Rol Acces</TableHead>
              <TableHead className="text-xs">Data Creării</TableHead>
              <TableHead className="text-xs text-right">Acțiuni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-xs text-slate-500">
                  Nu există utilizatori înregistrați.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="text-xs font-semibold flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold">
                      <UserCheck className="w-3.5 h-3.5" />
                    </div>
                    <span>{u.full_name}</span>
                  </TableCell>
                  <TableCell className="text-xs font-mono">{u.email}</TableCell>
                  <TableCell className="text-xs">
                    {u.role === 'admin' && (
                      <Badge variant="default" className="gap-1 text-[10px] uppercase font-bold bg-indigo-600">
                        <Shield className="w-3 h-3" /> Admin
                      </Badge>
                    )}
                    {u.role === 'operator' && (
                      <Badge variant="secondary" className="text-[10px] uppercase font-bold">Operator</Badge>
                    )}
                    {u.role === 'viewer' && (
                      <Badge variant="outline" className="text-[10px] uppercase font-bold">Viewer</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-slate-500">
                    {new Date(u.created_at).toLocaleDateString('ro-RO')}
                  </TableCell>
                  <TableCell className="text-xs text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedUser(u)}
                      className="gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800"
                    >
                      <UserCog className="w-3.5 h-3.5" /> Modifică Rol
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedUser && (
        <RoleDialog
          userId={selectedUser.id}
          userName={selectedUser.full_name}
          userEmail={selectedUser.email}
          currentRole={selectedUser.role}
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          onSave={onRoleUpdate}
        />
      )}
    </div>
  );
}
