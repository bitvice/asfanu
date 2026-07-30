'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registrationSchema, RegistrationFormValues } from '@/lib/validation/registration.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Save, ArrowLeft, User, Baby, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface RegistrationFormProps {
  initialValues?: Partial<RegistrationFormValues>;
  onSubmitAction: (values: RegistrationFormValues) => Promise<{ error?: string; success?: boolean; registrationId?: string }>;
  isEditMode?: boolean;
}

export function RegistrationForm({ initialValues, onSubmitAction, isEditMode = false }: RegistrationFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      parent_first_name: initialValues?.parent_first_name || '',
      parent_last_name: initialValues?.parent_last_name || '',
      primary_email: initialValues?.primary_email || '',
      secondary_email: initialValues?.secondary_email || '',
      phone: initialValues?.phone || '',
      postal_address: initialValues?.postal_address || '',
      county: initialValues?.county || '',
      city: initialValues?.city || '',
      comments: initialValues?.comments || '',
      privacy_policy_accepted: initialValues?.privacy_policy_accepted ?? true,
      family_details: initialValues?.family_details || '',
      notification_email: initialValues?.notification_email || '',
      internal_notes: initialValues?.internal_notes || '',
      children: initialValues?.children || [
        { first_name: '', last_name: '', cnp: '', email: '', age: undefined, birth_date: '' },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'children',
  });

  async function onFormSubmit(data: RegistrationFormValues) {
    setServerError(null);
    setSubmitting(true);
    try {
      const res = await onSubmitAction(data);
      if (res?.error) {
        setServerError(res.error);
      } else if (res?.success) {
        router.push(res.registrationId ? `/registrations/${res.registrationId}` : '/registrations');
      }
    } catch {
      setServerError('A apărut o eroare neașteptată la salvarea înregistrării.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/registrations">
            <Button variant="outline" size="sm" type="button" className="gap-1 text-xs">
              <ArrowLeft className="w-4 h-4" />
              Înapoi
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {isEditMode ? 'Editare Înregistrare' : 'Adăugare Înregistrare Nouă'}
          </h1>
        </div>
        <Button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 font-medium">
          <Save className="w-4 h-4" />
          {submitting ? 'Se salvează...' : 'Salvează Înregistrarea'}
        </Button>
      </div>

      {serverError && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Parent Information Card */}
      <Card>
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
            <User className="w-5 h-5" />
            Date Părinte / Înregistrare Principală
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 pt-6">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Prenume Părinte *
            </label>
            <Input {...register('parent_first_name')} placeholder="Ion" className="mt-1" />
            {errors.parent_first_name && (
              <p className="text-xs text-red-500 mt-1">{errors.parent_first_name.message}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Nume de Familie Părinte *
            </label>
            <Input {...register('parent_last_name')} placeholder="Popescu" className="mt-1" />
            {errors.parent_last_name && (
              <p className="text-xs text-red-500 mt-1">{errors.parent_last_name.message}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Email Principal *
            </label>
            <Input {...register('primary_email')} type="email" placeholder="ion.popescu@gmail.com" className="mt-1" />
            {errors.primary_email && (
              <p className="text-xs text-red-500 mt-1">{errors.primary_email.message}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Număr de Telefon
            </label>
            <Input {...register('phone')} placeholder="0721234567" className="mt-1" />
            {errors.phone && (
              <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Județ *
            </label>
            <Input {...register('county')} placeholder="Brașov" className="mt-1" />
            {errors.county && (
              <p className="text-xs text-red-500 mt-1">{errors.county.message}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Oraș *
            </label>
            <Input {...register('city')} placeholder="Brașov" className="mt-1" />
            {errors.city && (
              <p className="text-xs text-red-500 mt-1">{errors.city.message}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Adresă Poștală Complete
            </label>
            <Input {...register('postal_address')} placeholder="Str. Republicii, Nr. 12, Bl. A, Ap. 4" className="mt-1" />
          </div>

          <div className="md:col-span-2 flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="privacy"
              {...register('privacy_policy_accepted')}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <label htmlFor="privacy" className="text-xs text-slate-700 dark:text-slate-300">
              Acceptă Politica de Confidențialitate & Prelucrarea Datelor cu Caracter Personal
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Children List Card */}
      <Card>
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <Baby className="w-5 h-5" />
            Copii Înregistrați ({fields.length})
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ first_name: '', last_name: '', cnp: '', email: '', age: undefined, birth_date: '' })}
            className="gap-1 text-xs"
          >
            <Plus className="w-4 h-4" />
            Adaugă Copil
          </Button>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {fields.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">Nu a fost adăugat niciun copil încă.</p>
          ) : (
            fields.map((field, index) => (
              <div
                key={field.id}
                className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 relative space-y-4"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-[10px] font-bold">
                    Copil #{index + 1}
                  </Badge>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Prenume Copil *
                    </label>
                    <Input {...register(`children.${index}.first_name`)} placeholder="Andrei" className="mt-1 bg-white dark:bg-slate-950" />
                    {errors.children?.[index]?.first_name && (
                      <p className="text-xs text-red-500 mt-1">{errors.children[index]?.first_name?.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Nume de Familie Copil *
                    </label>
                    <Input {...register(`children.${index}.last_name`)} placeholder="Popescu" className="mt-1 bg-white dark:bg-slate-950" />
                    {errors.children?.[index]?.last_name && (
                      <p className="text-xs text-red-500 mt-1">{errors.children[index]?.last_name?.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Anul sau Data Nașterii
                    </label>
                    <Input
                      {...register(`children.${index}.birth_date`)}
                      placeholder="ex: 2018 sau 2018-05-15"
                      className="mt-1 bg-white dark:bg-slate-950 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      CNP Copil (13 cifre)
                    </label>
                    <Input {...register(`children.${index}.cnp`)} placeholder="5010101410018" className="mt-1 bg-white dark:bg-slate-950 font-mono" />
                    {errors.children?.[index]?.cnp && (
                      <p className="text-xs text-red-500 mt-1">{errors.children[index]?.cnp?.message}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </form>
  );
}
