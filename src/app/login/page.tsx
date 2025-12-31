'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Anchor, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { loginSchema, type LoginFormData } from '@/lib/validations/schemas';

export default function LoginPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        try {
            const supabase = createClient();
            const { error } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            });

            if (error) {
                toast.error('Login failed', {
                    description: error.message,
                });
                return;
            }

            toast.success('Welcome back!', {
                description: 'Redirecting to dashboard...',
            });
            router.push('/');
            router.refresh();
        } catch {
            toast.error('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full overflow-hidden">
            {/* Background image with overlay */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: `url('https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=2070&auto=format&fit=crop')`,
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-800/85 to-slate-900/90" />
            </div>

            {/* Animated wave overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-32 overflow-hidden">
                <svg
                    className="absolute bottom-0 w-full text-background/10"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 1440 320"
                >
                    <path
                        fill="currentColor"
                        fillOpacity="1"
                        d="M0,160L48,170.7C96,181,192,203,288,192C384,181,480,139,576,128C672,117,768,139,864,165.3C960,192,1056,224,1152,218.7C1248,213,1344,171,1392,149.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                    />
                </svg>
            </div>

            {/* Login card */}
            <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
                <Card className="w-full max-w-md bg-card/95 backdrop-blur-sm shadow-2xl border-0 animate-slide-up">
                    <CardHeader className="space-y-4 text-center pb-2">
                        {/* Logo */}
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-ocean shadow-lg">
                            <Anchor className="h-9 w-9 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-bold">PortMail</CardTitle>
                            <CardDescription className="text-muted-foreground">
                                Maritime Logistics Scheduler
                            </CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            {/* Email field */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium">
                                    Email Address
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="captain@shipping.com"
                                        className="pl-10 h-11"
                                        {...register('email')}
                                        disabled={isLoading}
                                    />
                                </div>
                                {errors.email && (
                                    <p className="text-sm text-destructive">{errors.email.message}</p>
                                )}
                            </div>

                            {/* Password field */}
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-medium">
                                    Password
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        className="pl-10 pr-10 h-11"
                                        {...register('password')}
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-sm text-destructive">{errors.password.message}</p>
                                )}
                            </div>

                            {/* Forgot password link */}
                            <div className="flex justify-end">
                                <Link
                                    href="/forgot-password"
                                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                >
                                    Forgot password?
                                </Link>
                            </div>

                            {/* Submit button */}
                            <Button
                                type="submit"
                                className="w-full h-11 bg-gradient-ocean hover:opacity-90 transition-opacity text-white font-semibold shadow-lg"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    'Sign In'
                                )}
                            </Button>
                        </form>

                        {/* Sign up link */}
                        <div className="mt-6 text-center">
                            <p className="text-sm text-muted-foreground">
                                Don&apos;t have an account?{' '}
                                <Link
                                    href="/signup"
                                    className="font-medium text-primary hover:underline"
                                >
                                    Create account
                                </Link>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
