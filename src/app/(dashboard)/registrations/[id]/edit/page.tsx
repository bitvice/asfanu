'use client';

import * as React from 'react';
import { RegistrationForm } from '@/components/registrations/RegistrationForm';
import { fetchRegistrationByIdAction, updateRegistrationAction } from '@/features/registrations/actions';
import { RegistrationFormValues } from '@/lib/validation/registration.schema';

export default function EditRegistrationPage() {
  const [initialValues, setInitialValues] = React.useState<RegistrationFormValues | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [id, setId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    const editIndex = pathParts.indexOf('edit');
    if (editIndex > 0) {
      setId(pathParts[editIndex - 1]);
    }
  }, []);

  React.useEffect(() => {
    if (!id) return;
    async function loadData() {
      setLoading(true);
      try {
        const res = await fetchRegistrationByIdAction(id!, true);
        setInitialValues(res as unknown as RegistrationFormValues);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-400">
        Se încarcă înregistrarea pentru editare...
      </div>
    );
  }

  if (!id || !initialValues) {
    return <div className="text-center py-8 text-xs text-red-500">Înregistrarea nu a fost găsită.</div>;
  }

  return (
    <div className="py-4">
      <RegistrationForm
        initialValues={initialValues}
        onSubmitAction={(data) => updateRegistrationAction(id, data)}
        isEditMode={true}
      />
    </div>
  );
}
