import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET single ship
export async function GET(request: NextRequest, { params }: RouteParams) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: ship, error } = await supabase
        .from('ships')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!ship) {
        return NextResponse.json({ error: 'Ship not found' }, { status: 404 });
    }

    return NextResponse.json(ship);
}

// PATCH update ship
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        const { data: ship, error } = await supabase
            .from('ships')
            .update({
                name: body.name,
                imo_number: body.imo_number || null,
                default_email: body.default_email,
                vessel_type: body.vessel_type || null,
                flag_country: body.flag_country || null,
                notes: body.notes || null,
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(ship);
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
}

// DELETE ship
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
        .from('ships')
        .delete()
        .eq('id', id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
