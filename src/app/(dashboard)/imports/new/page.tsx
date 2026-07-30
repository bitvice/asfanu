'use client';

import * as React from 'react';
import { ImportWizard } from '@/components/imports/ImportWizard';
import { executeBatchImportAction } from '@/features/imports/actions';
import { fetchRegistrationsAction } from '@/features/registrations/actions';

export default function NewImportPage() {
  const [existingRegs, setExistingRegs] = React.useState<Array<{
    id: string;
    parent_first_name: string;
    parent_last_name: string;
    primary_email: string;
    phone: string;
    county: string;
    city: string;
    children: Array<{ cnp: string }>;
  }>>([]);

  React.useEffect(() => {
    async function loadExisting() {
      try {
        const res = await fetchRegistrationsAction({ pageSize: 500 });
        setExistingRegs(res.registrations as unknown as typeof existingRegs);
      } catch {
        // Fallback quiet
      }
    }
    loadExisting();
  }, []);

  return (
    <div className="py-4">
      <ImportWizard
        existingRegistrations={existingRegs}
        onExecuteImportAction={executeBatchImportAction}
      />
    </div>
  );
}
