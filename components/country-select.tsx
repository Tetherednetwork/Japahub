
'use client';

import * as React from 'react';
import { countries, getCountryFlag } from '@/lib/countries';
import { Combobox, ComboboxOption } from './ui/combobox';

export { countries };

interface CountrySelectProps {
  onValueChange: (value: string) => void;
  defaultValue?: string;
  value?: string;
  disabled?: boolean;
}

export function CountrySelect({ onValueChange, value, disabled }: CountrySelectProps) {

  const options: ComboboxOption[] = React.useMemo(() => countries.map((country: { code: string; name: string; }) => ({
    value: country.code,
    label: (
      <div className="flex items-center gap-2">
        <span>{getCountryFlag(country.code)}</span>
        <span>{country.name}</span>
      </div>
    ),
    searchText: country.name,
  })), []);

  const selectedLabel = React.useMemo(() => {
    const selectedOption = options.find(option => option.value === value);
    return selectedOption ? selectedOption.label : "Select a country...";
  }, [options, value]);


  return (
    <Combobox
      options={options}
      value={value}
      onValueChange={onValueChange}
      placeholder="Select a country..."
      searchPlaceholder="Search countries..."
      notFoundText="No country found."
      triggerContent={selectedLabel}
      disabled={disabled}
      triggerClassName="w-full"
    />
  );
}
