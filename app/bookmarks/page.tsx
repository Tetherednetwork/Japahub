
import { Bookmark } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function BookmarksPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Bookmarks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center text-center py-16 px-4">
          <Bookmark className="w-12 h-12 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">No Saved Bookmarks</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            You haven't bookmarked any posts yet.
          </p>
           <p className="mt-1 text-xs text-muted-foreground">
            Find a post you want to save and click the bookmark icon.
          </p>
          <Button variant="secondary" className="mt-6" asChild>
            <a href="/">Explore Feed</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
