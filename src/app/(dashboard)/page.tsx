import { createClient } from '@/lib/supabase/server';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { CalendarView } from '@/components/dashboard/CalendarView';
import { JobsTable } from '@/components/dashboard/JobsTable';
import { Button } from '@/components/ui/button';
import { CalendarPlus, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { startOfDay, endOfDay } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return null;
    }

    // Fetch stats
    const today = new Date();
    const startOfToday = startOfDay(today).toISOString();
    const endOfToday = endOfDay(today).toISOString();

    // Get pending count
    const { count: pendingCount } = await supabase
        .from('scheduled_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'pending');

    // Get sent today count
    const { count: sentTodayCount } = await supabase
        .from('scheduled_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'sent')
        .gte('sent_at', startOfToday)
        .lte('sent_at', endOfToday);

    // Get failed count
    const { count: failedCount } = await supabase
        .from('scheduled_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'failed');

    // Get recent jobs
    const { data: recentJobs } = await supabase
        .from('scheduled_jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_time', { ascending: false })
        .limit(10);

    // Get all jobs for calendar
    const { data: allJobs } = await supabase
        .from('scheduled_jobs')
        .select('*')
        .eq('user_id', user.id)
        .gte('scheduled_time', new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString())
        .lte('scheduled_time', new Date(today.getFullYear(), today.getMonth() + 2, 0).toISOString());

    return (
        <div className="space-y-6 sm:space-y-8 animate-fade-in">
            {/* Header - Responsive */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Command Center</h1>
                    <p className="text-sm sm:text-base text-muted-foreground mt-1">
                        Monitor and manage your scheduled email deliveries
                    </p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                    <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                        <RefreshCw className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Refresh</span>
                    </Button>
                    <Link href="/schedule" className="flex-1 sm:flex-none">
                        <Button className="w-full bg-gradient-ocean hover:opacity-90 text-white">
                            <CalendarPlus className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Schedule New</span>
                            <span className="sm:hidden">New</span>
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <StatsCards
                pending={pendingCount || 0}
                sentToday={sentTodayCount || 0}
                failed={failedCount || 0}
            />

            {/* Calendar and Table - Responsive */}
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-5">
                <div className="lg:col-span-2 order-2 lg:order-1">
                    <CalendarView jobs={allJobs || []} />
                </div>
                <div className="lg:col-span-3 order-1 lg:order-2">
                    <JobsTable jobs={recentJobs || []} />
                </div>
            </div>
        </div>
    );
}

