'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

import {
    MessageCircle,
    Megaphone,
    Briefcase,
    Building,
    HomeIcon,
    Calendar,
    BarChart2
} from 'lucide-react';


const TABS = [
  { value: 'all', label: 'All Posts', icon: MessageCircle },
  { value: 'alert', label: 'Alerts', icon: Megaphone },
  { value: 'job', label: 'Jobs', icon: Briefcase },
  { value: 'housing', label: 'Housing', icon: Building },
  { value: 'service', label: 'Services', icon: HomeIcon },
  { value: 'event', label: 'Events', icon: Calendar },
  { value: 'poll', label: 'Polls', icon: BarChart2 },
];

export function FeedTabs({ activeTab }: { activeTab: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleTabChange = (value: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    
    if (value === 'all') {
        current.delete('tab');
    } else {
        current.set('tab', value);
    }
    
    const search = current.toString();
    const query = search ? `?${search}` : '';
    
    router.push(`${pathname}${query}`);
  };

  return (
    <nav className="flex flex-col gap-1">
        {TABS.map((tab) => (
            <Button
                key={tab.value}
                variant={activeTab === tab.value ? 'secondary' : 'ghost'}
                className="justify-start gap-2"
                onClick={() => handleTabChange(tab.value)}
            >
                <tab.icon className="h-4 w-4" />
                {tab.label}
            </Button>
        ))}
    </nav>
  );
}
