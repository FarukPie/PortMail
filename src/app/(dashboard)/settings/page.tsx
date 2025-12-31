'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Settings, User, Bell, Shield, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/database';

const profileSchema = z.object({
    full_name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email').optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function SettingsPage() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isDirty },
    } = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
    });

    useEffect(() => {
        const fetchProfile = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profileData) {
                    setProfile(profileData);
                    reset({
                        full_name: profileData.full_name || '',
                        email: profileData.email,
                    });
                }
            }
            setIsLoading(false);
        };

        fetchProfile();
    }, [reset]);

    const onSubmit = async (data: ProfileFormData) => {
        if (!profile) return;

        setIsSaving(true);
        try {
            const supabase = createClient();
            const { error } = await supabase
                .from('profiles')
                .update({ full_name: data.full_name })
                .eq('id', profile.id);

            if (error) throw error;

            toast.success('Profile updated successfully');
            setProfile({ ...profile, full_name: data.full_name });
        } catch (error) {
            toast.error('Failed to update profile', {
                description: error instanceof Error ? error.message : 'An error occurred',
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in max-w-3xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Settings className="h-6 w-6" />
                    Settings
                </h1>
                <p className="text-muted-foreground">
                    Manage your account and application preferences
                </p>
            </div>

            {/* Profile Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <User className="h-5 w-5 text-primary" />
                        Profile
                    </CardTitle>
                    <CardDescription>
                        Your personal information and account details
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="full_name">Full Name</Label>
                                <Input
                                    id="full_name"
                                    placeholder="Captain John Smith"
                                    {...register('full_name')}
                                />
                                {errors.full_name && (
                                    <p className="text-sm text-destructive">{errors.full_name.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    disabled
                                    className="bg-muted"
                                    {...register('email')}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Email cannot be changed
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Role</Label>
                            <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm capitalize">{profile?.role || 'Operator'}</span>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={!isDirty || isSaving}>
                                {isSaving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Separator />

            {/* Notification Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Bell className="h-5 w-5 text-primary" />
                        Notifications
                    </CardTitle>
                    <CardDescription>
                        Configure how you receive notifications
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Email notifications</Label>
                            <p className="text-sm text-muted-foreground">
                                Receive email notifications when jobs complete or fail
                            </p>
                        </div>
                        <Switch defaultChecked />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Failed job alerts</Label>
                            <p className="text-sm text-muted-foreground">
                                Get immediate alerts when a scheduled email fails
                            </p>
                        </div>
                        <Switch defaultChecked />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Weekly summary</Label>
                            <p className="text-sm text-muted-foreground">
                                Receive a weekly summary of all email activity
                            </p>
                        </div>
                        <Switch />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
