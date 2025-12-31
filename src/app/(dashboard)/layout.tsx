import { Sidebar } from '@/components/layout/Sidebar';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Toaster } from '@/components/ui/sonner';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Fetch user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    return (
        <div className="flex min-h-screen">
            <Sidebar
                user={{
                    email: user.email,
                    full_name: profile?.full_name,
                    avatar_url: profile?.avatar_url,
                }}
            />
            <main className="flex-1 overflow-auto bg-background pt-14 lg:pt-0">
                <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl">
                    {children}
                </div>
            </main>
            <Toaster position="top-right" richColors />
        </div>
    );
}

