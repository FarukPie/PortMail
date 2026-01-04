import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

// GET all ships
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
    const { supabase } = req;
    if (!supabase) return;

    const { data: ships, error } = await supabase
        .from('ships')
        .select('*')
        .order('name');

    if (error) {
        res.status(500).json({ error: error.message });
        return;
    }

    res.json(ships);
});

// GET single ship
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
    const { supabase } = req;
    if (!supabase) return;

    const { id } = req.params;

    const { data: ship, error } = await supabase
        .from('ships')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        res.status(500).json({ error: error.message });
        return;
    }

    if (!ship) {
        res.status(404).json({ error: 'Ship not found' });
        return;
    }

    res.json(ship);
});

// POST create new ship
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
    const { supabase, user } = req;
    if (!supabase || !user) return;

    try {
        const body = req.body;

        const { data: ship, error } = await supabase
            .from('ships')
            .insert({
                name: body.name,
                imo_number: body.imo_number || null,
                default_email: body.default_email,
                vessel_type: body.vessel_type || null,
                flag_country: body.flag_country || null,
                notes: body.notes || null,
                created_by: user.id,
            })
            .select()
            .single();

        if (error) {
            res.status(500).json({ error: error.message });
            return;
        }

        res.status(201).json(ship);
    } catch {
        res.status(400).json({ error: 'Invalid request body' });
    }
});

// PATCH update ship
router.patch('/:id', async (req: AuthenticatedRequest, res: Response) => {
    const { supabase } = req;
    if (!supabase) return;

    const { id } = req.params;

    try {
        const body = req.body;

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
            res.status(500).json({ error: error.message });
            return;
        }

        res.json(ship);
    } catch {
        res.status(400).json({ error: 'Invalid request body' });
    }
});

// DELETE ship
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
    const { supabase } = req;
    if (!supabase) return;

    const { id } = req.params;

    const { error } = await supabase
        .from('ships')
        .delete()
        .eq('id', id);

    if (error) {
        res.status(500).json({ error: error.message });
        return;
    }

    res.json({ success: true });
});

export default router;
