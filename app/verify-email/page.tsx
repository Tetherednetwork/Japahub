
'use client';

import { useUser } from '@/firebase/provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MailCheck, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { resendVerificationEmail } from '@/firebase/auth/auth';
import { useToast } from '@/hooks/use-toast';
import { signOutUser } from '@/firebase/auth/auth';
import Link from 'next/link';

export default function VerifyEmailPage() {
    const { user, isUserLoading: userLoading } = useUser();
    const router = useRouter();
    const { toast } = useToast();
    const [isResending, setIsResending] = useState(false);

    useEffect(() => {
        const checkVerification = async () => {
            if (user) {
                // Force a reload of the user's profile from Firebase servers
                await user.reload();

                // Now check the latest emailVerified state
                if (user.emailVerified) {
                    toast({
                        title: 'Email Verified!',
                        description: 'Welcome to JapaHub!',
                    });
                    router.replace('/');
                }
            }
        };

        checkVerification();

        // Also, run this check periodically in case the user verifies in another tab
        const interval = setInterval(checkVerification, 5000); // Check every 5 seconds

        return () => clearInterval(interval);
    }, [user, router, toast]);


    const handleResendEmail = async () => {
        setIsResending(true);
        const { error } = await resendVerificationEmail();
        if (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message,
            });
        } else {
            toast({
                title: 'Email Sent!',
                description: 'A new verification link has been sent to your email address.',
            });
        }
        setIsResending(false);
    };

    const handleSignOut = async () => {
        await signOutUser();
        router.replace('/login');
    }

    if (userLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    // If the user lands here but is not logged in, send to login
    if (!user) {
        router.replace('/login');
        return null;
    }


    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="items-center text-center">
                    <div className="rounded-full bg-primary/10 p-3">
                        <MailCheck className="h-10 w-10 text-primary" />
                    </div>
                    <CardTitle className="text-2xl mt-4">Verify Your Email</CardTitle>
                    <CardDescription>
                        A verification link has been sent to <span className="font-semibold text-foreground">{user.email}</span>. Please check your inbox to continue.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 text-center">
                    <p className="text-sm text-muted-foreground">
                        Once you've verified, you should be automatically redirected. If you don't see the email, please check your spam folder.
                    </p>
                    <Button onClick={handleResendEmail} disabled={isResending}>
                        {isResending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Resend Verification Email
                    </Button>
                    <div className="text-sm text-muted-foreground">
                        Wrong email? <Button variant="link" size="sm" className="p-0 h-auto" onClick={handleSignOut}>Sign out and use a different account.</Button>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href="/login">Back to Login</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
