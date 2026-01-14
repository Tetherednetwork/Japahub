
'use client';

import Link from 'next/link';
import { Home, Search, Users, Briefcase, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Input } from '../ui/input';
import { useUser } from '@/firebase/provider';
import { signOutUser } from '@/firebase/auth/auth';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Skeleton } from '../ui/skeleton';

function AppHeaderContent() {
  const { user, isUserLoading: loading } = useUser();
  const router = useRouter();

  const handleLogout = async () => {
    await signOutUser();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="mr-4 flex items-center gap-2 text-xl font-bold text-primary"
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M16 4L28 10V22L16 28L4 22V10L16 4Z"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M16 20C18.2091 20 20 18.2091 20 16C20 13.7909 18.2091 12 16 12C13.7909 12 12 13.7909 12 16C12 18.2091 13.7909 20 16 20Z"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="hidden sm:inline-block">JapaHub</span>
        </Link>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="h-10 w-full rounded-full bg-muted pl-10"
          />
        </div>

        <nav className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <Home className="h-6 w-6" />
              <span className="sr-only">Home</span>
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/services">
              <Users className="h-6 w-6" />
              <span className="sr-only">Services</span>
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/events">
              <Briefcase className="h-6 w-6" />
              <span className="sr-only">Events</span>
            </Link>
          </Button>
          <Button variant="ghost" size="icon">
            <MessageCircle className="h-6 w-6" />
            <span className="sr-only">Messages</span>
          </Button>
        </nav>

        <div className="flex items-center gap-2">
          {loading ? (
            <div className="h-10 w-10 animate-pulse rounded-full bg-muted"></div>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 overflow-hidden rounded-full"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} />
                    <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user.displayName || user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/support">Support</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="outline">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function HeaderSkeleton() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-full rounded-full" />
        <div className="hidden items-center gap-2 md:flex">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    </header>
  )
}


export function AppHeader() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <HeaderSkeleton />;
  }

  return <AppHeaderContent />;
}

