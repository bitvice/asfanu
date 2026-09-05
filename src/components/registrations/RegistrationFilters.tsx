'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';

interface RegistrationFiltersProps {
  onFilterChange: (filters: { familyNumber?: string; search?: string; county?: string; city?: string; privacyPolicyAccepted?: boolean }) => void;
}

export function RegistrationFilters({ onFilterChange }: RegistrationFiltersProps) {
  const [familyNumber, setFamilyNumber] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [county, setCounty] = React.useState('');
  const [city, setCity] = React.useState('');
  const [privacyPolicy, setPrivacyPolicy] = React.useState<string>('all');

  const debouncedFamilyNumber = useDebounce(familyNumber, 300);
  const debouncedSearch = useDebounce(search, 300);

  React.useEffect(() => {
    onFilterChange({
      familyNumber: debouncedFamilyNumber || undefined,
      search: debouncedSearch || undefined,
      county: county || undefined,
      city: city || undefined,
      privacyPolicyAccepted: privacyPolicy === 'accepted' ? true : privacyPolicy === 'declined' ? false : undefined,
    });
  }, [debouncedFamilyNumber, debouncedSearch, county, city, privacyPolicy, onFilterChange]);

  function handleClear() {
    setFamilyNumber('');
    setSearch('');
    setCounty('');
    setCity('');
    setPrivacyPolicy('all');
  }

  const hasActiveFilters = familyNumber || search || county || city || privacyPolicy !== 'all';

  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
      <div className="flex flex-wrap lg:flex-nowrap items-center gap-3">
        {/* Family Number Filter - Narrow input for 3-4 chars */}
        <div className="w-24 shrink-0">
          <Input
            value={familyNumber}
            onChange={(e) => setFamilyNumber(e.target.value)}
            placeholder="# Nr."
            maxLength={6}
            className="bg-slate-50 dark:bg-slate-950 text-xs text-center font-mono font-bold placeholder:font-sans"
            title="Filtrează după numărul de familie (ex: 42 sau 042)"
          />
        </div>

        {/* Main Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Căutare după nume, email, telefon sau CNP..."
            className="pl-9 bg-slate-50 dark:bg-slate-950 text-xs w-full"
          />
        </div>

        {/* County Filter */}
        <div className="w-full lg:w-40">
          <Input
            value={county}
            onChange={(e) => setCounty(e.target.value)}
            placeholder="Filtru Județ"
            className="bg-slate-50 dark:bg-slate-950 text-xs w-full"
          />
        </div>

        {/* City Filter */}
        <div className="w-full lg:w-40">
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Filtru Oraș"
            className="bg-slate-50 dark:bg-slate-950 text-xs w-full"
          />
        </div>

        {/* Privacy Policy Filter */}
        <div className="w-full lg:w-48 flex items-center gap-2">
          <select
            value={privacyPolicy}
            onChange={(e) => setPrivacyPolicy(e.target.value)}
            className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-950"
          >
            <option value="all">Toate Politicile Conf.</option>
            <option value="accepted">Doar Acceptate (DA)</option>
            <option value="declined">Neacceptate (NU)</option>
          </select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="gap-1 text-xs text-slate-500 hover:text-slate-900 shrink-0 px-2"
              title="Resetează filtrele"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
