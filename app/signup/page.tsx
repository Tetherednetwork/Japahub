
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  signUpWithEmail,
  signInWithGoogle,
  isUsernameAvailable
} from '@/firebase/auth/auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css'
import { useDebounce } from 'use-debounce';
import { generateUsernameSuggestions } from '@/lib/username';
import { CountrySelect, countries } from '@/components/country-select';
import { CityCombobox } from '@/components/city-combobox';


const formSchema = z
  .object({
    firstName: z.string().min(2, { message: 'First name must be at least 2 characters.' }),
    lastName: z.string().min(2, { message: 'Last name must be at least 2 characters.' }),
    username: z.string()
      .min(3, { message: 'Username must be at least 3 characters.' })
      .max(30, { message: 'Username must be at most 30 characters.' })
      .regex(/^[a-z0-9_.]+$/, { message: 'Username can only contain lowercase letters, numbers, underscores, and periods.' })
      .refine(val => !val.startsWith('.') && !val.endsWith('.'), { message: 'Username cannot start or end with a period.' })
      .refine(val => !val.includes('..'), { message: 'Username cannot contain consecutive periods.' }),
    city: z.string().min(1, { message: 'City is required.' }),
    country: z.string().min(2, { message: 'Please select your country.' }),
    phoneNumber: z
      .string()
      .refine(isValidPhoneNumber, { message: 'Please enter a valid phone number.' })
      .refine((phone) => !phone.startsWith('+234'), {
        message: 'Nigerian phone numbers are not currently supported.',
      }),
    email: z.string().email({ message: 'Please enter a valid email address.' }),
    password: z
      .string()
      .min(6, { message: 'Password must be at least 6 characters.' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M20.94 11.04c0-.82-.07-1.59-.2-2.31H12v4.37h5.02c-.22 1.41-.86 2.6-1.89 3.42v2.85h3.66c2.13-1.97 3.37-4.89 3.37-8.33z" /><path d="M12 21c2.6 0 4.77-.86 6.36-2.32l-3.66-2.85c-.86.58-1.98.92-3.18.92-2.43 0-4.49-1.64-5.22-3.85H3.04v2.94C4.63 19.33 8.01 21 12 21z" /><path d="M6.78 13.21c-.18-.54-.28-1.12-.28-1.71s.1-1.17.28-1.71V6.85H3.04C2.19 8.69 1.7 10.74 1.7 12.9c0 2.16.49 4.21 1.34 5.95l3.74-2.64z" /></svg>
);

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

export default function SignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setGoogleLoading] = useState(false);

  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      username: '',
      city: '',
      country: '',
      phoneNumber: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onTouched',
  });

  const [debouncedUsername] = useDebounce(form.watch('username'), 500);
  const selectedCountryCode = form.watch('country');

  useEffect(() => {
    const checkUsername = async () => {
      // Basic client-side validation first
      const cleanUsername = debouncedUsername?.toLowerCase();

      if (!cleanUsername || cleanUsername.length < 3 || !/^[a-z0-9_.]+$/.test(cleanUsername)) {
        setUsernameStatus('idle');
        setSuggestions([]);
        return;
      }

      setUsernameStatus('checking');
      const available = await isUsernameAvailable(cleanUsername);
      if (available) {
        setUsernameStatus('available');
        setSuggestions([]);
        form.clearErrors('username');
      } else {
        setUsernameStatus('taken');
        const newSuggestions = await generateUsernameSuggestions(cleanUsername);
        setSuggestions(newSuggestions);
        form.setError('username', { type: 'manual', message: 'This username is already taken.' });
      }
    };
    checkUsername();
  }, [debouncedUsername, form]);

  const anyLoading = isLoading || isGoogleLoading;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (usernameStatus !== 'available') {
      toast({
        variant: 'destructive',
        title: 'Username Unavailable',
        description: 'Please choose an available username before submitting.',
      });
      return;
    }

    setIsLoading(true);
    const { error } = await signUpWithEmail(
      values.email,
      values.password,
      values.firstName,
      values.lastName,
      values.username,
      values.city,
      values.phoneNumber,
      values.country
    );
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: error.message,
      });
    } else {
      toast({
        title: 'Account Created!',
        description: 'Please check your email to verify your account.',
      });
      router.push('/verify-email');
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
        description: "You've been signed in with Google.",
      });
      router.push('/');
    }
    setGoogleLoading(false);
  }

  const handleSuggestionClick = (suggestion: string) => {
    form.setValue('username', suggestion, { shouldValidate: true });
  };

  const renderUsernameStatus = () => {
    switch (usernameStatus) {
      case 'checking':
        return <FormDescription><Loader2 className="h-4 w-4 mr-2 inline animate-spin" />Checking availability...</FormDescription>;
      case 'available':
        return <FormDescription className="text-green-600 flex items-center"><CheckCircle className="h-4 w-4 mr-2 inline" />Username is available!</FormDescription>;
      case 'taken':
        return (
          <>
            <FormMessage />
            {suggestions.length > 0 && (
              <FormDescription>
                Suggestions: {suggestions.map(s => (
                  <Button type="button" variant="link" size="sm" key={s} onClick={() => handleSuggestionClick(s)} className="p-1 h-auto">{s}</Button>
                ))}
              </FormDescription>
            )}
          </>
        );
      default:
        return <FormDescription>Your unique username on JapaHub.</FormDescription>;
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="items-center text-center space-y-4 pt-8">
          <AppLogo />
          <div>
            <CardTitle className="text-2xl">Create an Account</CardTitle>
            <CardDescription>
              Join your local community hub today!
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 gap-4">
            <Button
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={anyLoading}
            >
              {isGoogleLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <GoogleIcon className="mr-2 h-4 w-4" />
              )}
              Sign up with Google
            </Button>
          </div>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or sign up with email
              </span>
            </div>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Tunde" {...field} disabled={anyLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Babatunde" {...field} disabled={anyLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="tunde.b"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toLowerCase())}
                        disabled={anyLoading}
                      />
                    </FormControl>
                    {renderUsernameStatus()}
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <CountrySelect
                        onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue('city', ''); // Reset city on country change
                        }}
                        defaultValue={field.value}
                        value={field.value}
                        disabled={anyLoading}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <CityCombobox
                          countryCode={selectedCountryCode}
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={anyLoading || !selectedCountryCode}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Number</FormLabel>
                    <FormControl>
                      <Controller
                        name="phoneNumber"
                        control={form.control}
                        render={({ field }) => (
                          <PhoneInput
                            id="phoneNumber"
                            placeholder="Enter phone number"
                            international
                            countryCallingCodeEditable={false}
                            defaultCountry={selectedCountryCode as any || 'GB'}
                            {...field}
                            disabled={anyLoading}
                          />
                        )}
                      />
                    </FormControl>
                    <FormDescription>
                      Used for account verification and security.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                          disabled={anyLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                          disabled={anyLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" className="w-full mt-6" disabled={anyLoading || usernameStatus === 'checking' || usernameStatus === 'taken'}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="justify-center text-sm pb-8">
          <p className="text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Log in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
