'use client';

import { RegistrationForm } from '@/components/registrations/RegistrationForm';
import { createRegistrationAction } from '@/features/registrations/actions';

export default function NewRegistrationPage() {
  return (
    <div className="py-4">
      <RegistrationForm onSubmitAction={createRegistrationAction} isEditMode={false} />
    </div>
  );
}
