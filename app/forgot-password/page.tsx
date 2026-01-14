'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { sendPasswordResetLink } from '@/firebase/auth/auth';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Loader2, Mail } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

const AppLogo = () => (
    <div className="flex items-center justify-center gap-2 text-2xl font-bold text-primary">
        <svg
            width="36"
            height="36"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
              d="M16 4L28 10V22L16 28L4 22V10L16 4Z"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M16 20C18.2091 20 20 18.2091 20 16C20 13.7909 18.2091 12 16 12C13.7909 12 12 13.7909 12 16C12 18.2091 13.7909 20 16 20Z"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
        </svg>
        <span>JapaHub</span>
    </div>
);


export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const { error } = await sendPasswordResetLink(values.email);
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } else {
      toast({
        title: 'Reset Link Sent!',
        description: 'Please check your email for instructions to reset your password.',
      });
      setIsSent(true);
    }
    setIsLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="items-center text-center space-y-4 pt-8">
                <AppLogo />
                <div>
                    <CardTitle className="text-2xl">Forgot Your Password?</CardTitle>
                    <CardDescription>
                        No problem. Enter your email and we'll send you a reset link.
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="p-8">
                {isSent ? (
                    <div className="text-center">
                        <Mail className="mx-auto h-12 w-12 text-primary" />
                        <h3 className="mt-4 text-lg font-semibold">Check Your Inbox</h3>
                        <p className="mt-2 text-muted-foreground">
                            A password reset link has been sent to the email address you provided.
                        </p>
                        <Button asChild className="mt-6 w-full">
                            <Link href="/login">Back to Login</Link>
                        </Button>
                    </div>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                <Input
                                    placeholder="you@example.com"
                                    {...field}
                                    disabled={isLoading}
                                />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send Reset Link
                        </Button>
                        </form>
                    </Form>
                )}
            </CardContent>
             <div className="pb-8 text-center text-sm">
                <Link href="/login" className="font-semibold text-primary hover:underline">
                    Remembered your password? Log in
                </Link>
             </div>
        </Card>
    </div>
  );
}
