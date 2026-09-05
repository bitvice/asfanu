'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';

interface RegistrationFiltersProps {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onFilterChange: (filters: {
    familyNumber?: string;
    search?: string;
    county?: string;
    city?: string;
    privacyPolicyAccepted?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => void;
}

export function RegistrationFilters({
  sortBy: externalSortBy = 'family_number',
  sortOrder: externalSortOrder = 'asc',
  onFilterChange,
}: RegistrationFiltersProps) {
  const [familyNumber, setFamilyNumber] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [county, setCounty] = React.useState('');
  const [city, setCity] = React.useState('');
  const [privacyPolicy, setPrivacyPolicy] = React.useState<string>('all');
  const [sortBy, setSortBy] = React.useState<string>(externalSortBy);
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>(externalSortOrder);

  // Keep in sync if controlled externally (e.g. from table header clicks)
  React.useEffect(() => {
    if (externalSortBy) setSortBy(externalSortBy);
    if (externalSortOrder) setSortOrder(externalSortOrder);
  }, [externalSortBy, externalSortOrder]);

  const debouncedFamilyNumber = useDebounce(familyNumber, 300);
  const debouncedSearch = useDebounce(search, 300);

  React.useEffect(() => {
    onFilterChange({
      familyNumber: debouncedFamilyNumber || undefined,
      search: debouncedSearch || undefined,
      county: county || undefined,
      city: city || undefined,
      privacyPolicyAccepted: privacyPolicy === 'accepted' ? true : privacyPolicy === 'declined' ? false : undefined,
      sortBy,
      sortOrder,
    });
  }, [debouncedFamilyNumber, debouncedSearch, county, city, privacyPolicy, sortBy, sortOrder, onFilterChange]);

  function handleClear() {
    setFamilyNumber('');
    setSearch('');
    setCounty('');
    setCity('');
    setPrivacyPolicy('all');
    setSortBy('family_number');
    setSortOrder('asc');
  }

  function toggleSortOrder() {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  }

  const hasActiveFilters = familyNumber || search || county || city || privacyPolicy !== 'all' || sortBy !== 'family_number' || sortOrder !== 'asc';

  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
      <div className="flex flex-wrap lg:flex-nowrap items-center gap-3">
        {/* Family Number Filter */}
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
        <div className="w-full lg:w-36">
          <Input
            value={county}
            onChange={(e) => setCounty(e.target.value)}
            placeholder="Filtru Județ"
            className="bg-slate-50 dark:bg-slate-950 text-xs w-full"
          />
        </div>

        {/* City Filter */}
        <div className="w-full lg:w-36">
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Filtru Oraș"
            className="bg-slate-50 dark:bg-slate-950 text-xs w-full"
          />
        </div>

        {/* Privacy Policy Filter */}
        <div className="w-full lg:w-44">
          <select
            value={privacyPolicy}
            onChange={(e) => setPrivacyPolicy(e.target.value)}
            className="w-full h-9 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-950"
          >
            <option value="all">Toate Politicile</option>
            <option value="accepted">Doar Acceptate (DA)</option>
            <option value="declined">Neacceptate (NU)</option>
          </select>
        </div>

        {/* Sort Controls */}
        <div className="w-full lg:w-auto flex items-center gap-1.5 shrink-0 bg-slate-50 dark:bg-slate-950 p-1 rounded-md border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] text-slate-500 pl-1.5 font-medium whitespace-nowrap">Sortează:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-7 border-0 bg-transparent text-xs font-semibold text-indigo-700 dark:text-indigo-400 focus:outline-none cursor-pointer pr-1"
          >
            <option value="family_number"># Nr. Familie</option>
            <option value="parent_last_name">Nume Familie</option>
            <option value="children_count">Număr Copii</option>
          </select>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleSortOrder}
            className="h-7 w-7 p-0 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 shrink-0"
            title={`Ordonare ${sortOrder === 'asc' ? 'Crescătoare (ASC)' : 'Descrescătoare (DESC)'}`}
          >
            {sortOrder === 'asc' ? (
              <span className="text-xs font-bold font-mono flex items-center gap-0.5">ASC ↑</span>
            ) : (
              <span className="text-xs font-bold font-mono flex items-center gap-0.5">DESC ↓</span>
            )}
          </Button>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="gap-1 text-xs text-slate-500 hover:text-slate-900 shrink-0 px-2 h-7"
              title="Resetează toate filtrele"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
