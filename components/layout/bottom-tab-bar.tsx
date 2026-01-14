
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Briefcase, MessageCircle, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/services', icon: Users, label: 'Services' },
  { href: '/events', icon: Briefcase, label: 'Events' },
  { href: '/notifications', icon: Bell, label: 'Alerts' },
  { href: '/messages', icon: MessageCircle, label: 'Messages' },
];

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm md:hidden">
      <nav className="container mx-auto flex h-16 max-w-7xl items-center justify-around px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center gap-1 text-muted-foreground">
              <item.icon className={cn('h-6 w-6', isActive && 'text-primary')} />
              <span className={cn('text-xs', isActive && 'text-primary font-semibold')}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
