
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useAuth, useFirestore } from '@/firebase/provider';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { CountrySelect, countries } from './country-select';
import { updateProfile } from 'firebase/auth';
import { validateLocation } from '@/ai/flows/validate-location';
import { CityCombobox } from './city-combobox';

const profileFormSchema = z.object({
  displayName: z.string().min(2, { message: 'Display name must be at least 2 characters.' }),
  username: z.string(),
  city: z.string().min(1, { message: 'City is required.' }),
  country: z.string().min(2, { message: 'Please select a country.' }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface EditProfileSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  userProfile: UserProfile;
}

export function EditProfileSheet({
  isOpen,
  onOpenChange,
  userProfile,
}: EditProfileSheetProps) {
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: userProfile.displayName || '',
      username: userProfile.username || '',
      city: userProfile.city || '',
      country: userProfile.country || '',
    },
  });

  const selectedCountryCode = form.watch('country');

  useEffect(() => {
    if (isOpen) {
      form.reset({
        displayName: userProfile.displayName || '',
        username: userProfile.username || '',
        city: userProfile.city || '',
        country: userProfile.country || '',
      });
    }
  }, [isOpen, userProfile, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!firestore || !auth.currentUser) return;
    setIsSubmitting(true);

    // The validation is now implicitly handled by selecting from the combobox
    const userProfileRef = doc(firestore, 'users', userProfile.id);
    const updateData: Partial<UserProfile> = {
      displayName: data.displayName,
      country: data.country,
      city: data.city,
    };

    try {
      // Update Firestore document
      await updateDoc(userProfileRef, updateData);

      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, {
        displayName: data.displayName,
      });

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'There was an error updating your profile.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit Profile</SheetTitle>
          <SheetDescription>
            Make changes to your profile here. Click save when you're done.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 py-8">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="your_username" {...field} disabled />
                  </FormControl>
                  <FormDescription>
                    Your username cannot be changed.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <CountrySelect
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue('city', ''); // Reset city when country changes
                    }}
                    defaultValue={field.value}
                    value={field.value}
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
                      disabled={!selectedCountryCode || isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <SheetFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
