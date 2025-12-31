import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET all jobs for current user
export async function GET(request: NextRequest) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
        .from('scheduled_jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_time', { ascending: false })
        .limit(limit);

    if (status && status !== 'all') {
        query = query.eq('status', status);
    }

    const { data: jobs, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(jobs);
}

// POST create new job
export async function POST(request: NextRequest) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        const { data: job, error } = await supabase
            .from('scheduled_jobs')
            .insert({
                user_id: user.id,
                ship_id: body.ship_id || null,
                ship_name: body.ship_name,
                target_email: body.target_email,
                subject: body.subject,
                message: body.message || null,
                file_path: body.file_path,
                file_name: body.file_name,
                file_size: body.file_size || null,
                scheduled_time: body.scheduled_time,
                timezone: body.timezone || 'UTC',
                status: 'pending',
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(job, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
}
