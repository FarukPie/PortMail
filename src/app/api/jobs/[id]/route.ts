import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET single job
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: job, error } = await supabase
        .from('scheduled_jobs')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json(job);
}

// PATCH update job (cancel, retry, etc.)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const updates: Record<string, unknown> = {};

        // Handle cancel action
        if (body.action === 'cancel') {
            updates.status = 'cancelled';
        }

        // Handle retry action
        else if (body.action === 'retry') {
            updates.status = 'pending';
            updates.error_log = null;
            updates.sent_at = null;
        }

        // Handle direct status update
        else if (body.status) {
            updates.status = body.status;
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 });
        }

        const { data: job, error } = await supabase
            .from('scheduled_jobs')
            .update(updates)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(job);
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
}

// DELETE job
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the job to check for file cleanup
    const { data: job } = await supabase
        .from('scheduled_jobs')
        .select('file_path')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

    if (job?.file_path) {
        // Clean up the uploaded file
        await supabase.storage.from('ship-attachments').remove([job.file_path]);
    }

    const { error } = await supabase
        .from('scheduled_jobs')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
