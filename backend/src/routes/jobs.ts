import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET all jobs for current user
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
    const { supabase, user } = req;
    if (!supabase || !user) return; // Should be handled by middleware

    const status = req.query.status as string;
    const limit = parseInt((req.query.limit as string) || '50');

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
        res.status(500).json({ error: error.message });
        return;
    }

    res.json(jobs);
});

// GET single job
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
    const { supabase, user } = req;
    if (!supabase || !user) return;

    const { id } = req.params;

    const { data: job, error } = await supabase
        .from('scheduled_jobs')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

    if (error) {
        res.status(500).json({ error: error.message });
        return;
    }

    if (!job) {
        res.status(404).json({ error: 'Job not found' });
        return;
    }

    res.json(job);
});

// POST create new job
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
    const { supabase, user } = req;
    if (!supabase || !user) return;

    try {
        const body = req.body;

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
            res.status(500).json({ error: error.message });
            return;
        }

        res.status(201).json(job);
    } catch {
        res.status(400).json({ error: 'Invalid request body' });
    }
});

// PATCH update job
router.patch('/:id', async (req: AuthenticatedRequest, res: Response) => {
    const { supabase, user } = req;
    if (!supabase || !user) return;

    const { id } = req.params;

    try {
        const body = req.body;
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
            res.status(400).json({ error: 'No valid updates provided' });
            return;
        }

        const { data: job, error } = await supabase
            .from('scheduled_jobs')
            .update(updates)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) {
            res.status(500).json({ error: error.message });
            return;
        }

        res.json(job);
    } catch {
        res.status(400).json({ error: 'Invalid request body' });
    }
});

// DELETE job
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
    const { supabase, user } = req;
    if (!supabase || !user) return;

    const { id } = req.params;

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
        res.status(500).json({ error: error.message });
        return;
    }

    res.json({ success: true });
});

export default router;
