
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  signInWithEmail,
  signInWithGoogle,
} from '@/firebase/auth/auth';
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
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"


const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z
    .string()
    .min(1, { message: 'Password is required.' }),
});

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M20.94 11.04c0-.82-.07-1.59-.2-2.31H12v4.37h5.02c-.22 1.41-.86 2.6-1.89 3.42v2.85h3.66c2.13-1.97 3.37-4.89 3.37-8.33z" /><path d="M12 21c2.6 0 4.77-.86 6.36-2.32l-3.66-2.85c-.86.58-1.98.92-3.18.92-2.43 0-4.49-1.64-5.22-3.85H3.04v2.94C4.63 19.33 8.01 21 12 21z" /><path d="M6.78 13.21c-.18-.54-.28-1.12-.28-1.71s.1-1.17.28-1.71V6.85H3.04C2.19 8.69 1.7 10.74 1.7 12.9c0 2.16.49 4.21 1.34 5.95l3.74-2.64z" /></svg>
);

const AppLogo = () => (
  <div className="flex items-center gap-2 text-2xl font-bold text-primary">
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

function LoginPageContent() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setGoogleLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const anyLoading = isLoading || isGoogleLoading;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const { error } = await signInWithEmail(values.email, values.password);
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: error.message,
      });
    } else {
      toast({
        title: 'Success!',
        description: "You've been logged in.",
      });
      router.push('/');
    }
    setIsLoading(false);
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Google Sign-In Error',
        description: error.message,
      });
    } else {
      toast({
        title: 'Success!',
        description: "You've been logged in with Google.",
      });
      router.push('/');
    }
    setGoogleLoading(false);
  }

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
      <div className="relative hidden lg:flex flex-col items-center justify-between bg-gray-800 text-white p-10 text-center">
        <Image
          src="https://picsum.photos/seed/loginfashion/1080/1920"
          alt="Woman in traditional Nigerian attire"
          fill
          priority
          sizes="50vw"
          className="object-cover"
          data-ai-hint="nigerian fashion"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 w-full max-w-md self-start">
          <AppLogo />
        </div>
        <div className="relative z-10 w-full max-w-md">
          <Carousel
            opts={{
              loop: true,
            }}
            plugins={[
              Autoplay({
                delay: 5000,
              }),
            ]}
          >
            <CarouselContent>
              <CarouselItem>
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold">New Country. New City.</h2>
                  <p className="text-lg text-gray-300">Moving abroad shouldn't mean starting alone. JapaHub exists to bring people together after arrival.</p>
                </div>
              </CarouselItem>
              <CarouselItem>
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold">What is JapaHub?</h2>
                  <p className="text-lg text-gray-300">A shared space to connect with others in your city, ask questions, find trusted services, and support each other.</p>
                </div>
              </CarouselItem>
              <CarouselItem>
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold">You are not alone here.</h2>
                  <p className="text-lg text-gray-300">Your people dey. Abroad is not the end of connection. It is just another place to belong.</p>
                </div>
              </CarouselItem>
            </CarouselContent>
          </Carousel>
        </div>
        <div className="relative z-10 text-xs self-end">
          © {new Date().getFullYear()} JapaHub
        </div>
      </div>
      <div className="relative flex items-center justify-center p-6 sm:p-12">
        <Image
          src="https://picsum.photos/seed/loginpattern/1080/1920"
          alt="Green abstract pattern"
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
          data-ai-hint="abstract pattern"
        />
        <div className="absolute inset-0 bg-background/90" />
        <div className="relative z-10 mx-auto grid w-[380px] gap-6">
          <div className="grid gap-2 text-center">
            <div className="lg:hidden mb-6">
              <AppLogo />
            </div>
            <h1 className="text-3xl font-bold">Login</h1>
            <p className="text-balance text-muted-foreground">
              Enter your email below to login to your account
            </p>
          </div>

          <Button
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={anyLoading}
            className="w-full bg-background/80"
          >
            {isGoogleLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <GoogleIcon className="mr-2 h-4 w-4" />
            )}
            Login with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background/90 px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
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
                        disabled={anyLoading}
                        className="bg-background/80"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center">
                      <FormLabel>Password</FormLabel>
                      <Link
                        href="/forgot-password"
                        className="ml-auto inline-block text-sm underline"
                      >
                        Forgot your password?
                      </Link>
                    </div>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        disabled={anyLoading}
                        className="bg-background/80"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full mt-2" disabled={anyLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Login
              </Button>
            </form>
          </Form>

          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="underline font-semibold">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


export default function LoginPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // Return a placeholder or skeleton here to avoid layout shifts
    return <div className="min-h-screen w-full bg-background" />;
  }

  return <LoginPageContent />;
}





