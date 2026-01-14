'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Sparkles } from 'lucide-react';

export function SmartSuppressionToggle({ isEnabled }: { isEnabled: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleToggle = (checked: boolean) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));

    if (checked) {
      current.set('smart', 'true');
    } else {
      current.delete('smart');
    }

    const search = current.toString();
    const query = search ? `?${search}` : '';

    router.push(`${pathname}${query}`);
  };

  return (
    <div className="flex items-center space-x-2">
      <Sparkles className="h-4 w-4 text-primary" />
      <Label htmlFor="smart-suppression" className="text-sm font-medium">
        Smart Feed
      </Label>
      <Switch
        id="smart-suppression"
        checked={isEnabled}
        onCheckedChange={handleToggle}
      />
    </div>
  );
}
