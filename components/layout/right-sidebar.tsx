import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function RightSidebar({ className }: { className?: string }) {
    return (
        <aside className={className}>
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Upcoming Events</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-center">
                       <p className="text-sm text-muted-foreground">No upcoming events right now. Check back soon!</p>
                       <Button variant="outline" size="sm" className="w-full" asChild>
                            <Link href="/events">View Events Page</Link>
                       </Button>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Local Directory</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                       <p className="text-sm text-muted-foreground">Find and support local businesses in your area.</p>
                       <Button size="sm" className="w-full" asChild>
                            <Link href="/services">Explore Directory</Link>
                       </Button>
                    </CardContent>
                </Card>
            </div>
        </aside>
    )
}
