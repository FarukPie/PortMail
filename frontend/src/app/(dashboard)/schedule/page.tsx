import { createClient } from '@/lib/supabase/server';
import { ScheduleForm } from '@/components/schedule/ScheduleForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function SchedulePage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return null;
    }

    // Fetch ships for the dropdown
    const { data: ships } = await supabase
        .from('ships')
        .select('*')
        .order('name');

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/">
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Schedule New Email</h1>
                    <p className="text-muted-foreground">
                        Schedule an automated email with an Excel attachment
                    </p>
                </div>
            </div>

            {/* Form */}
            <ScheduleForm ships={ships || []} userId={user.id} />
        </div>
    );
}
