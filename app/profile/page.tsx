'use client';

import { useUser, useFirestore, useMemoFirebase } from '@/firebase/provider';
import { useDoc } from '@/firebase/firestore/use-doc';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Camera, Mail, Shield, User as UserIcon, Loader2, AtSign, MapPin } from 'lucide-react';
import type { UserProfile } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { EditProfileSheet } from '@/components/edit-profile-sheet';
import { getCountryFlag } from '@/lib/countries';
import { uploadImage } from '@/firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { updateProfile } from 'firebase/auth';

function ProfileSkeleton() {
    return (
        <div className="space-y-6">
            <Card className="overflow-hidden">
                <Skeleton className="h-24 w-full" />
                <CardContent className="flex flex-col items-center p-6 text-center -mt-16">
                    <div className="relative">
                        <Skeleton className="h-32 w-32 rounded-full border-4 border-background" />
                    </div>
                    <div className="mt-4 space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-5 w-64" />
                    </div>
                    <Skeleton className="mt-6 h-10 w-32" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-3">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-4/5" />
                </CardContent>
            </Card>
        </div>
    )
}

function ProfilePageContent({ authUser }: { authUser: NonNullable<ReturnType<typeof useUser>['user']> }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const userProfileRef = useMemoFirebase(() => doc(firestore, `users/${authUser.uid}`), [authUser.uid, firestore]);
    const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);
    const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || !event.target.files[0] || !firestore || !userProfileRef) return;

        const file = event.target.files[0];
        setIsUploading(true);

        try {
            const path = `avatars/${authUser.uid}/${file.name}`;
            const imageUrl = await uploadImage(file, path);

            // Update both Firestore and Firebase Auth profile
            await updateDoc(userProfileRef, { avatar: imageUrl });
            if (authUser) {
                await updateProfile(authUser, { photoURL: imageUrl });
            }

            toast({
                title: "Profile Picture Updated",
                description: "Your new avatar has been saved.",
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Upload Failed",
                description: "There was an error changing your profile picture.",
            });
            console.error("Error updating profile picture:", error);
        } finally {
            setIsUploading(false);
        }
    };


    if (profileLoading) {
        return <ProfileSkeleton />;
    }

    if (!userProfile) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <UserIcon className="w-16 h-16 text-muted-foreground" />
                <h1 className="mt-6 text-2xl font-semibold">Profile Not Found</h1>
                <p className="mt-2 text-muted-foreground">
                    There was an issue loading your profile data. It may not have been created yet.
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                    Try logging out and logging back in.
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6">
                <Card className="overflow-hidden">
                    <div className="h-24 bg-muted" />
                    <CardContent className="flex flex-col items-center p-6 text-center -mt-16">
                        <div className="relative">
                            <Avatar className="h-32 w-32 border-4 border-background">
                                <AvatarImage src={userProfile.avatar || authUser.photoURL || undefined} alt={userProfile.displayName} />
                                <AvatarFallback className="text-4xl">{userProfile.displayName?.charAt(0) || authUser.email?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <Button
                                variant="outline"
                                size="icon"
                                className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-background"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                            >
                                {isUploading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Camera className="h-4 w-4" />
                                )}
                                <span className="sr-only">Change profile picture</span>
                            </Button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleAvatarChange}
                                className="hidden"
                                accept="image/*"
                            />
                        </div>

                        <div className="mt-4 space-y-1">
                            <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
                                {userProfile.displayName || authUser.displayName}
                                {userProfile.isVerified && <Shield className="h-5 w-5 text-blue-500" />}
                            </h1>
                            <p className="text-muted-foreground flex items-center justify-center gap-2">
                                <AtSign className="h-4 w-4" />
                                {userProfile.username}
                            </p>
                            {userProfile.city && userProfile.country && (
                                <p className="text-muted-foreground flex items-center justify-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    {userProfile.city}, {getCountryFlag(userProfile.country)}
                                </p>
                            )}
                        </div>
                        <Button className="mt-6" onClick={() => setIsEditSheetOpen(true)}>Edit Profile</Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>My Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Your recent posts and comments will appear here.</p>
                    </CardContent>
                </Card>
            </div>
            <EditProfileSheet
                isOpen={isEditSheetOpen}
                onOpenChange={setIsEditSheetOpen}
                userProfile={userProfile}
            />
        </>
    );
}


export default function ProfilePage() {
    const { user: authUser, isUserLoading: authLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !authUser) {
            router.replace('/login');
        }
    }, [authUser, authLoading, router]);

    if (authLoading || !authUser) {
        return <ProfileSkeleton />;
    }

    return <ProfilePageContent authUser={authUser} />;
}
