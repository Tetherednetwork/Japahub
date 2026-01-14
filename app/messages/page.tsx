
import { MessageSquare, Users, Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function MessagesPage() {
  return (
    <div className="grid md:grid-cols-3 gap-6 h-full min-h-[80vh]">
        {/* Left Panel - Conversation List */}
        <Card className="md:col-span-1 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Conversations</CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                    <Pencil className="h-4 w-4" />
                </Button>
            </CardHeader>
            <Separator />
            <CardContent className="p-4 flex-grow flex flex-col items-center justify-center text-center">
                 <Users className="w-10 h-10 text-muted-foreground" />
                 <p className="mt-4 text-sm font-medium">No Conversations</p>
                 <p className="text-xs text-muted-foreground">Your chats will appear here.</p>
            </CardContent>
        </Card>

        {/* Right Panel - Chat Window */}
        <Card className="md:col-span-2 flex flex-col items-center justify-center text-center bg-muted/30 border-dashed">
            <div className="p-10">
                <MessageSquare className="w-16 h-16 text-muted-foreground" />
                <h1 className="mt-6 text-2xl font-semibold">Messaging is Coming Soon</h1>
                <p className="mt-2 text-muted-foreground">
                    You'll be able to chat with other members of the community directly.
                </p>
                 <p className="mt-1 text-sm text-muted-foreground">
                    Select a conversation to start chatting.
                </p>
            </div>
        </Card>
    </div>
  );
}
