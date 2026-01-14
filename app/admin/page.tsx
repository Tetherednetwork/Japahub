
'use client';

import { useUser, useFirestore, useMemoFirebase } from '@/firebase/provider';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { UserProfile, Report, Post } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc, collection, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { Shield, Users, Flag, LineChart, Loader2, MoreHorizontal, Trash2, ShieldCheck, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';


function AdminDashboardSkeleton() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <Skeleton className="h-12 w-1/2" />
            <Skeleton className="h-8 w-3/4" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
            </div>
            <Skeleton className="h-96" />
        </div>
    );
}

function UserManagementTab() {
    const firestore = useFirestore();
    const usersCollection = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
    const { data: users, isLoading } = useCollection<UserProfile>(usersCollection);
    const [updating, setUpdating] = useState<Record<string, boolean>>({});

    const handleRoleChange = async (userId: string, newRole: 'user' | 'moderator' | 'admin') => {
        if (!firestore) return;
        setUpdating(prev => ({ ...prev, [userId]: true }));
        const userRef = doc(firestore, 'users', userId);
        try {
            await updateDoc(userRef, { role: newRole });
        } catch (error) {
            console.error("Error updating user role:", error);
        } finally {
            setUpdating(prev => ({ ...prev, [userId]: false }));
        }
    }

    if (isLoading) return <Skeleton className="h-64" />;

    return (
        <Card>
            <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and manage all users on the platform.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users?.map(user => (
                            <TableRow key={user.id}>
                                <TableCell>{user.displayName}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <Select
                                        value={user.role}
                                        onValueChange={(value: 'user' | 'moderator' | 'admin') => handleRoleChange(user.id, value)}
                                        disabled={updating[user.id]}
                                    >
                                        <SelectTrigger className="w-[120px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="user">User</SelectItem>
                                            <SelectItem value="moderator">Moderator</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

function ReportsTab() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const reportsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'reports') : null, [firestore]);
    const { data: reports, isLoading } = useCollection<Report>(reportsCollection);
    const [actionState, setActionState] = useState<Record<string, { inProgress: boolean; error?: string }>>({});


    const handleReportAction = async (report: Report, action: 'delete-content' | 'dismiss') => {
        if (!firestore) return;
        setActionState(prev => ({ ...prev, [report.id]: { inProgress: true } }));

        try {
            if (action === 'delete-content') {
                if (report.reportedContentType === 'post') {
                    const postRef = doc(firestore, 'posts', report.reportedContentId);
                    const postSnap = await getDoc(postRef);
                    if (!postSnap.exists()) {
                        toast({ variant: 'destructive', title: 'Action Failed', description: 'Post does not exist or was already deleted.' });
                        // Also dismiss the report
                        const reportRef = doc(firestore, 'reports', report.id);
                        await updateDoc(reportRef, { status: 'resolved', actionTaken: 'dismiss_deleted' });
                        return;
                    }
                    await deleteDoc(postRef);
                    const reportRef = doc(firestore, 'reports', report.id);
                    await updateDoc(reportRef, { status: 'resolved', actionTaken: 'delete' });
                    toast({ title: 'Post Deleted', description: 'The reported post has been removed.' });
                }
                // Future: Handle other content types like comments
            } else if (action === 'dismiss') {
                const reportRef = doc(firestore, 'reports', report.id);
                await updateDoc(reportRef, { status: 'resolved', actionTaken: 'dismiss' });
                toast({ title: 'Report Dismissed', description: 'The report has been marked as resolved.' });
            }
        } catch (error: any) {
            console.error('Error handling report:', error);
            setActionState(prev => ({ ...prev, [report.id]: { inProgress: false, error: error.message } }));
            toast({ variant: 'destructive', title: 'Action Failed', description: error.message });
        } finally {
            // Let the real-time listener remove the item, so we don't need to set inProgress to false
        }
    };


    if (isLoading) return <Skeleton className="h-64" />;

    const openReports = reports?.filter(r => r.status === 'open');

    return (
        <Card>
            <CardHeader>
                <CardTitle>Open Content Reports</CardTitle>
                <CardDescription>Review and manage user-submitted reports that need attention.</CardDescription>
            </CardHeader>
            <CardContent>
                {openReports && openReports.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Reported Content ID</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {openReports.map(report => (
                                <TableRow key={report.id}>
                                    <TableCell className="font-mono text-xs">{report.reportedContentId}</TableCell>
                                    <TableCell>{report.reportedContentType}</TableCell>
                                    <TableCell className="max-w-xs truncate">{report.reason}</TableCell>
                                    <TableCell>
                                        <span className="bg-red-100 text-red-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full dark:bg-red-900 dark:text-red-300">
                                            {report.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {actionState[report.id]?.inProgress ? (
                                            <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                                        ) : (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem disabled>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View Post
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() => handleReportAction(report, 'delete-content')}>
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete Post
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleReportAction(report, 'dismiss')}>
                                                        <ShieldCheck className="mr-2 h-4 w-4" />
                                                        Dismiss Report
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="text-center text-muted-foreground py-10">
                        <Flag className="mx-auto h-12 w-12" />
                        <h3 className="mt-4 text-lg font-semibold">No Open Reports</h3>
                        <p className="mt-1 text-sm">It's all clear! No content needs moderation.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function AnalyticsTab({ userCount, postCount }: { userCount: number; postCount: number }) {
    const firestore = useFirestore();
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{userCount}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                    <LineChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{postCount}</div>
                </CardContent>
            </Card>
        </div>
    );
}

function AdminDashboard({ userProfile }: { userProfile: UserProfile }) {
    const firestore = useFirestore();
    const usersCollection = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
    const { data: users, isLoading: usersLoading } = useCollection<UserProfile>(usersCollection);
    const postsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'posts') : null, [firestore]);
    const { data: posts, isLoading: postsLoading } = useCollection(postsCollection);

    return (
        <div className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
            </div>
            <Tabs defaultValue="reports" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="reports">Reports</TabsTrigger>
                    <TabsTrigger value="users">Users</TabsTrigger>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                </TabsList>
                <TabsContent value="reports">
                    <ReportsTab />
                </TabsContent>
                <TabsContent value="users">
                    <UserManagementTab />
                </TabsContent>
                <TabsContent value="overview" className="space-y-4">
                    {usersLoading || postsLoading ? (
                        <Skeleton className="h-32" />
                    ) : (
                        <AnalyticsTab userCount={users?.length || 0} postCount={posts?.length || 0} />
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}


export default function AdminPage() {
    const { user: authUser, isUserLoading: authLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const userProfileRef = useMemoFirebase(() => (authUser ? doc(firestore, `users/${authUser.uid}`) : null), [authUser, firestore]);
    const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);

    useEffect(() => {
        if (!authLoading && !authUser) {
            router.replace('/login');
        }
    }, [authUser, authLoading, router]);


    if (authLoading || profileLoading) {
        return <AdminDashboardSkeleton />;
    }

    const isAdminOrModerator = userProfile?.role === 'admin' || userProfile?.role === 'moderator';

    if (!userProfile) {
        // This case can happen briefly if the profile is still being created
        // or if the user is not an admin and doesn't have a full profile yet.
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <Shield className="w-16 h-16 text-destructive" />
                <h1 className="mt-6 text-2xl font-semibold">Access Denied</h1>
                <p className="mt-2 text-muted-foreground">
                    You do not have the necessary permissions to view this page.
                </p>
            </div>
        );
    }

    if (!isAdminOrModerator) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <Shield className="w-16 h-16 text-destructive" />
                <h1 className="mt-6 text-2xl font-semibold">Access Denied</h1>
                <p className="mt-2 text-muted-foreground">
                    You do not have the necessary permissions to view this page.
                </p>
            </div>
        );
    }

    return <AdminDashboard userProfile={userProfile} />;
}
