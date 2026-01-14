'use client';

import { useUser, useFirestore, useMemoFirebase } from '@/firebase/provider';
import { useDoc } from '@/firebase/firestore/use-doc';
import { usePathname, useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { AppHeader } from '@/components/layout/header';
import { LeftSidebar } from '@/components/layout/left-sidebar';
import { RightSidebar } from '@/components/layout/right-sidebar';
import { BottomTabBar } from '@/components/layout/bottom-tab-bar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEffect } from 'react';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import React from 'react';

export function ClientLayout({ children }: { children: React.ReactNode }) {
    const { user, isUserLoading: authLoading } = useUser();
    const firestore = useFirestore();
    const pathname = usePathname();
    const router = useRouter();
    const isMobile = useIsMobile();

    const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/verify-email' || pathname === '/forgot-password';

    const userProfileRef = useMemoFirebase(() => (user ? doc(firestore, `users/${user.uid}`) : null), [user, firestore]);
    const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);

    useEffect(() => {
        const loading = authLoading || profileLoading;
        if (loading) return; // Wait until user status and profile are resolved

        const isPrivilegedUser = userProfile?.role === 'admin' || userProfile?.role === 'moderator';

        if (user && !user.emailVerified && !isAuthPage && !isPrivilegedUser) {
            // If user is logged in but email is not verified, not on an auth page,
            // and is not an admin/moderator, redirect them to the verification page.
            router.replace('/verify-email');
        } else if (!user && !isAuthPage) {
            // If user is not logged in and not on an auth page, redirect to login.
            router.replace('/login');
        }
    }, [user, userProfile, authLoading, profileLoading, isAuthPage, router]);


    if (isAuthPage) {
        return <main>{children}</main>;
    }

    const isLoading = authLoading || profileLoading;
    const isPrivilegedUser = userProfile?.role === 'admin' || userProfile?.role === 'moderator';

    if (isLoading || (user && !user.emailVerified && !isPrivilegedUser)) {
        // Show a loading state while checking auth/profile or if user needs to verify.
        return (
            <>
                <AppHeader />
                <div className="container mx-auto grid grid-cols-12 gap-8 px-4 sm:px-6 lg:px-8">
                    {!isMobile && <Skeleton className="col-span-2 h-[80vh] hidden md:block" />}
                    <div className="col-span-12 py-6 md:col-span-7 space-y-4">
                        <Skeleton className="h-40 w-full" />
                        <Skeleton className="h-64 w-full" />
                    </div>
                    {!isMobile && <Skeleton className="col-span-3 h-[60vh] hidden lg:block" />}
                </div>
                {isMobile && <Skeleton className="fixed bottom-0 left-0 right-0 h-16 border-t" />}
            </>
        );
    }

    // Only render the main app layout if user is fully authenticated and verified (or is privileged)
    return (
        <>
            <AppHeader />
            <div className="grid grid-cols-12 gap-8 px-4 sm:px-6 lg:px-8">
                {!isMobile && <LeftSidebar className="col-span-2 hidden py-6 md:flex" />}
                <main className="col-span-12 py-6 md:col-span-7">{children}</main>
                {!isMobile && <RightSidebar className="col-span-3 hidden py-6 lg:block" />}
            </div>
            {isMobile && <BottomTabBar />}
        </>
    );
}
