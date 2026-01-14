
import { LifeBuoy, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export default function SupportPage() {
  return (
    <div className="space-y-6">
       <div className="bg-card p-6 rounded-lg border">
            <h1 className="text-3xl font-bold flex items-center gap-2">
                <LifeBuoy className="w-8 h-8" />
                Support Center
            </h1>
            <p className="text-muted-foreground">We're here to help. Find answers to your questions below.</p>
        </div>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Frequently Asked Questions
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger>What is JapaHub?</AccordionTrigger>
                        <AccordionContent>
                        JapaHub is a community platform designed to connect Nigerians in the diaspora with their local city communities. It's a place to find local services, get help, and stay connected.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                        <AccordionTrigger>How do I post an alert?</AccordionTrigger>
                        <AccordionContent>
                        The ability to post different categories of content, including alerts, will be available soon. For now, all posts are categorized as "general".
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                        <AccordionTrigger>How is my data protected?</AccordionTrigger>
                        <AccordionContent>
                        We take your privacy seriously. All data is securely stored and we adhere to modern security practices. For more details, you can review our (future) privacy policy.
                        </AccordionContent>
                    </AccordionItem>
                     <AccordionItem value="item-4">
                        <AccordionTrigger>How can I become a verified user?</AccordionTrigger>
                        <AccordionContent>
                        The user verification system is a planned feature that will be implemented in a future update to enhance trust and safety within the community.
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
        </Card>
    </div>
  );
}

    