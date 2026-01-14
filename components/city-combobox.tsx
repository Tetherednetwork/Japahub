
'use client';

import * as React from 'react';
import { useDebounce } from 'use-debounce';
import { fetchCitySuggestions } from '@/ai/flows/fetch-city-suggestions';
import type { CitySuggestion } from '@/lib/types';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';

interface CityComboboxProps {
  countryCode: string;
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export function CityCombobox({
  countryCode,
  value,
  onValueChange,
  disabled = false,
}: CityComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value || '');
  const [suggestions, setSuggestions] = React.useState<CitySuggestion[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [debouncedSearchTerm] = useDebounce(inputValue, 300);

  React.useEffect(() => {
    // When the controlled `value` prop changes from the outside (e.g., form reset),
    // update the internal `inputValue`.
    if (value !== inputValue) {
      setInputValue(value);
    }
  }, [value]);

  React.useEffect(() => {
    if (debouncedSearchTerm && debouncedSearchTerm.length > 2 && countryCode) {
      setIsLoading(true);
      fetchCitySuggestions({ input: debouncedSearchTerm, country: countryCode })
        .then(setSuggestions)
        .finally(() => setIsLoading(false));
    } else {
      setSuggestions([]);
    }
  }, [debouncedSearchTerm, countryCode]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          <span className="truncate">{value || "Select a city..."}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search for a city..."
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            {isLoading && (
              <div className="p-4 flex items-center justify-center text-sm">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
              </div>
            )}
            {!isLoading && !suggestions.length && debouncedSearchTerm.length > 2 && (
              <CommandEmpty>No city found.</CommandEmpty>
            )}
            <CommandGroup>
              {suggestions.map((suggestion) => (
                <CommandItem
                  key={suggestion.place_id}
                  value={suggestion.description}
                  onSelect={() => {
                    // We only care about the main city name part for our form
                    const cityName = suggestion.description.split(',')[0];
                    onValueChange(cityName);
                    setInputValue(cityName);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === suggestion.description.split(',')[0] ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {suggestion.description}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
