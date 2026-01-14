'use client';
import {
  Home,
  Users,
  Bell,
  MessageSquare,
  Bookmark,
  Settings,
  Newspaper,
  Calendar,
  Building2,
  Briefcase,
  Megaphone,
  Shield,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase/provider';
import { useDoc } from '@/firebase/firestore/use-doc';
import type { UserProfile } from '@/lib/types';
import { doc } from 'firebase/firestore';
import { signOutUser } from '@/firebase/auth/auth';


const mainNav = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/notifications', icon: Bell, label: 'Notifications' },
  { href: '/messages', icon: MessageSquare, label: 'Messages' },
  { href: '/bookmarks', icon: Bookmark, label: 'Bookmarks' },
  { href: '/profile', icon: Users, label: 'Profile' },
];

const discoverNav = [
  { href: '/news', icon: Newspaper, label: 'News' },
  { href: '/events', icon: Calendar, label: 'Events' },
  { href: '/services', icon: Building2, label: 'Services' },
  { href: '/jobs', icon: Briefcase, label: 'Jobs' },
  { href: '/alerts', icon: Megaphone, label: 'Alerts' },
]

function AdminNav() {
  const { user: authUser, isUserLoading: userLoading } = useUser();
  const firestore = useFirestore();
  const userProfileRef = useMemoFirebase(() => authUser ? doc(firestore, `users/${authUser.uid}`) : null, [authUser, firestore]);
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);
  const pathname = usePathname();

  const isAdminOrModerator = userProfile?.role === 'admin' || userProfile?.role === 'moderator';

  if (!isAdminOrModerator) {
    return null;
  }

  return (
    <>
      <Separator className="my-4" />
      <h3 className="px-4 py-2 text-sm font-semibold text-muted-foreground">Admin</h3>
      <nav className="flex flex-col gap-1">
        <Button
          variant={pathname.startsWith('/admin') ? 'secondary' : 'ghost'}
          className="justify-start gap-3"
          asChild
        >
          <Link href="/admin">
            <Shield className="h-5 w-5" />
            <span className="text-base">Dashboard</span>
          </Link>
        </Button>
      </nav>
    </>
  )

}

export function LeftSidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await signOutUser();
    router.push('/login');
  };

  return (
    <aside className={cn('flex-col', className)}>
      <nav className="flex flex-col gap-1">
        {mainNav.map((item) => (
          <Button
            key={item.href}
            variant={pathname === item.href ? 'secondary' : 'ghost'}
            className="justify-start gap-3"
            asChild
          >
            <Link href={item.href}>
              <item.icon className="h-5 w-5" />
              <span className="text-base">{item.label}</span>
            </Link>
          </Button>
        ))}
      </nav>
      <Separator className='my-4' />
      <h3 className="px-4 py-2 text-sm font-semibold text-muted-foreground">Discover</h3>
      <nav className="flex flex-col gap-1">
        {discoverNav.map((item) => (
          <Button
            key={item.href}
            variant={pathname.startsWith(item.href) ? 'secondary' : 'ghost'}
            className="justify-start gap-3"
            asChild
          >
            <Link href={item.href}>
              <item.icon className="h-5 w-5" />
              <span className="text-base">{item.label}</span>
            </Link>
          </Button>
        ))}
      </nav>

      <AdminNav />

      <div className="mt-auto flex flex-col gap-2">
        <Button
          variant="ghost"
          className="justify-start gap-3"
          asChild
        >
          <Link href="/settings">
            <Settings className="h-5 w-5" />
            <span className="text-base">Settings</span>
          </Link>
        </Button>
        <Button
          variant={'ghost'}
          className="justify-start gap-3 w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          <span className="text-base">Logout</span>
        </Button>
      </div>
    </aside>
  );
}
