
'use client';

import { Bell, BellRing } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const notifications = [
  // Example data structure
  // {
  //   id: '1',
  //   type: 'comment',
  //   user: { name: 'Buchi', avatar: '/avatars/01.png' },
  //   post: 'your post about the new market',
  //   time: '5m ago',
  // },
  // {
  //   id: '2',
  //   type: 'like',
  //   user: { name: 'Aisha', avatar: '/avatars/02.png' },
  //   post: 'your post about the new market',
  //   time: '1h ago',
  // },
];

function NotificationItem() {
    // This is a skeleton for what a notification item would look like
    return (
        <div className="flex items-start gap-4 p-4 hover:bg-muted/50 rounded-lg">
            <Avatar className="h-10 w-10 border">
              <AvatarImage src="/avatars/01.png" alt="User" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-sm">
                <p>
                    <span className="font-semibold">User Name</span> liked your post.
                </p>
                <p className="text-xs text-muted-foreground">
                    2 hours ago
                </p>
            </div>
            <BellRing className="h-5 w-5 text-primary" />
        </div>
    );
}

export default function NotificationsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16 px-4">
            <Bell className="w-12 h-12 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold">No notifications yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              When someone likes, comments, or shares your posts, you'll see it here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* When notifications are implemented, they will be mapped here */}
            {/* e.g. notifications.map(notification => <NotificationItem key={notification.id} />) */}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
