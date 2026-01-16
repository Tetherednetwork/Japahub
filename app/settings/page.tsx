
'use client';

import { useUser, useFirestore, useMemoFirebase } from '@/firebase/provider';
import { useDoc } from '@/firebase/firestore/use-doc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, ShieldCheck, ShieldAlert, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CityCombobox } from "@/components/city-combobox";
import { CountrySelect } from "@/components/country-select";

function VerificationStatusBadge({ level }: { level: UserProfile['verificationLevel'] }) {
    switch (level) {
        case 'id':
            return <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200"><ShieldCheck className="h-3 w-3 mr-1" />ID Verified</Badge>;
        case 'phone':
            return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200"><ShieldCheck className="h-3 w-3 mr-1" />Phone Verified</Badge>;
        case 'unverified':
        default:
            return <Badge variant="destructive" className="bg-amber-100 text-amber-800 border-amber-200"><ShieldAlert className="h-3 w-3 mr-1" />Unverified</Badge>;
    }
}

function SettingsSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-32 w-full" />
        </div>
    )
}

function SettingsPageContent({ authUser }: { authUser: NonNullable<ReturnType<typeof useUser>['user']> }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const userProfileRef = useMemoFirebase(() => doc(firestore, `users/${authUser.uid}`), [authUser.uid, firestore]);
    const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);

    const [phoneNumber, setPhoneNumber] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (userProfile?.phoneNumber) {
            setPhoneNumber(userProfile.phoneNumber);
        }
    }, [userProfile]);

    const handlePhoneNumberSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phoneNumber.trim() || !userProfileRef) return;

        setIsSubmitting(true);
        try {
            await updateDoc(userProfileRef, { phoneNumber: phoneNumber });
            toast({
                title: "Phone Number Updated",
                description: "Next, we'll send a verification code to this number.",
            });
            // Here you would trigger the SMS sending logic in a real app
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: "Update Failed",
                description: error.message || "Could not update your phone number.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (profileLoading || !userProfile) {
        return <SettingsSkeleton />
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Settings</CardTitle>
                    <CardDescription>Manage your account, verification, and notification preferences.</CardDescription>
                </CardHeader>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Account Verification</CardTitle>
                    <CardDescription>Verify your account to access all features and build trust within the community.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-1">
                            <h4 className="font-medium">Verification Status</h4>
                            <p className="text-sm text-muted-foreground">Your current trust level on the platform.</p>
                        </div>
                        <VerificationStatusBadge level={userProfile.verificationLevel} />
                    </div>
                    {userProfile.verificationLevel === 'unverified' && (
                        <form onSubmit={handlePhoneNumberSubmit}>
                            <div className="rounded-lg border p-4">
                                <Label htmlFor="phone-number" className="flex flex-col space-y-1">
                                    <span>Step 1: Phone Number</span>
                                    <span className="font-normal leading-snug text-muted-foreground">
                                        Enter your phone number including country code to receive a verification code.
                                    </span>
                                </Label>
                                <div className="flex gap-2 mt-3">
                                    <Input
                                        id="phone-number"
                                        placeholder="+1 (555) 123-4567"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        disabled={isSubmitting}
                                    />
                                    <Button type="submit" disabled={isSubmitting || !phoneNumber}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save & Continue
                                    </Button>
                                </div>
                            </div>
                        </form>
                    )}
                    {userProfile.verificationLevel === 'phone' && (
                        <div className="rounded-lg border p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="phone-number" className="flex flex-col space-y-1">
                                    <span>Step 2: Identity Verification</span>
                                    <span className="font-normal leading-snug text-muted-foreground">
                                        To fully protect our community, upload a proof of address to get the final verification badge.
                                    </span>
                                </Label>
                                <Button disabled>Upload Document (Coming Soon)</Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Location Settings</CardTitle>
                    <CardDescription>Update your home location to see relevant content in your feed.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-lg border p-4 space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="country-select">Country</Label>
                            <CountrySelect
                                value={userProfile?.country}
                                onValueChange={async (val) => {
                                    if (!userProfileRef) return;
                                    await updateDoc(userProfileRef, { country: val, city: '' }); // Reset city on country change
                                    toast({ title: "Location Updated", description: "Country updated successfully." });
                                }}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="city-combobox">City</Label>
                            <CityCombobox
                                countryCode={userProfile?.country}
                                value={userProfile?.city}
                                onValueChange={async (val) => {
                                    if (!userProfileRef) return;
                                    await updateDoc(userProfileRef, { city: val });
                                    toast({ title: "Location Updated", description: "City updated successfully. Your feed will now show posts from this city." });
                                }}
                                disabled={!userProfile?.country}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Notifications</CardTitle>
                    <CardDescription>Choose what you want to be notified about.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between space-x-2 p-4 rounded-lg border">
                        <Label htmlFor="comments-notifications" className="flex flex-col space-y-1">
                            <span>Comments on my posts</span>
                            <span className="font-normal leading-snug text-muted-foreground">
                                Get notified when someone comments on your posts.
                            </span>
                        </Label>
                        <Switch id="comments-notifications" defaultChecked disabled />
                    </div>
                    <div className="flex items-center justify-between space-x-2 p-4 rounded-lg border">
                        <Label htmlFor="likes-notifications" className="flex flex-col space-y-1">
                            <span>Likes on my posts</span>
                            <span className="font-normal leading-snug text-muted-foreground">
                                Get notified when someone likes one of your posts.
                            </span>
                        </Label>
                        <Switch id="likes-notifications" defaultChecked disabled />
                    </div>
                    <div className="flex items-center justify-between space-x-2 p-4 rounded-lg border">
                        <Label htmlFor="new-follower-notifications" className="flex flex-col space-y-1">
                            <span>New followers</span>
                            <span className="font-normal leading-snug text-muted-foreground">
                                Get notified when someone new follows you.
                            </span>
                        </Label>
                        <Switch id="new-follower-notifications" disabled />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                    <CardDescription>These actions are permanent and cannot be undone.</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-between items-center p-4 border-t border-destructive/20">
                    <div className="flex-1">
                        <p className="font-semibold">Delete Account</p>
                        <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data.</p>
                    </div>
                    <Button variant="destructive" disabled>Delete Account</Button>
                </CardContent>
            </Card>
        </div >
    );
}


export default function SettingsPage() {
    const { user: authUser, isUserLoading: authLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !authUser) {
            router.replace('/login');
        }
    }, [authUser, authLoading, router]);

    if (authLoading || !authUser) {
        return <SettingsSkeleton />;
    }

    return <SettingsPageContent authUser={authUser} />;
}
