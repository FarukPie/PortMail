'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ship, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { shipSchema, type ShipFormData } from '@/lib/validations/schemas';
import { createClient } from '@/lib/supabase/client';
import type { Ship as ShipType } from '@/types/database';

interface ShipFormProps {
    ship?: ShipType;
    onSuccess: () => void;
}

export function ShipForm({ ship, onSuccess }: ShipFormProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditing = Boolean(ship);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ShipFormData>({
        resolver: zodResolver(shipSchema),
        defaultValues: ship
            ? {
                name: ship.name,
                imo_number: ship.imo_number || '',
                default_email: ship.default_email,
                vessel_type: ship.vessel_type || '',
                flag_country: ship.flag_country || '',
                notes: ship.notes || '',
            }
            : {},
    });

    const onSubmit = async (data: ShipFormData) => {
        setIsSubmitting(true);

        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                toast.error('You must be logged in');
                return;
            }

            if (isEditing && ship) {
                const { error } = await supabase
                    .from('ships')
                    .update({
                        name: data.name,
                        imo_number: data.imo_number || null,
                        default_email: data.default_email,
                        vessel_type: data.vessel_type || null,
                        flag_country: data.flag_country || null,
                        notes: data.notes || null,
                    })
                    .eq('id', ship.id);

                if (error) throw error;
                toast.success('Ship updated successfully');
            } else {
                const { error } = await supabase.from('ships').insert({
                    name: data.name,
                    imo_number: data.imo_number || null,
                    default_email: data.default_email,
                    vessel_type: data.vessel_type || null,
                    flag_country: data.flag_country || null,
                    notes: data.notes || null,
                    created_by: user.id,
                });

                if (error) throw error;
                toast.success('Ship added successfully');
            }

            setOpen(false);
            reset();
            onSuccess();
        } catch (error) {
            toast.error('Failed to save ship', {
                description: error instanceof Error ? error.message : 'An error occurred',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {isEditing ? (
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="h-4 w-4" />
                    </Button>
                ) : (
                    <Button className="bg-gradient-ocean hover:opacity-90">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Ship
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Ship className="h-5 w-5" />
                        {isEditing ? 'Edit Ship' : 'Add New Ship'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Update the ship information below.'
                            : 'Enter the ship details to add it to your fleet.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">Ship Name *</Label>
                            <Input
                                id="name"
                                placeholder="MV Atlantic Voyager"
                                {...register('name')}
                            />
                            {errors.name && (
                                <p className="text-sm text-destructive">{errors.name.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="imo_number">IMO Number</Label>
                            <Input
                                id="imo_number"
                                placeholder="1234567"
                                {...register('imo_number')}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="default_email">Default Email *</Label>
                        <Input
                            id="default_email"
                            type="email"
                            placeholder="captain@vessel.com"
                            {...register('default_email')}
                        />
                        {errors.default_email && (
                            <p className="text-sm text-destructive">{errors.default_email.message}</p>
                        )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="vessel_type">Vessel Type</Label>
                            <Input
                                id="vessel_type"
                                placeholder="Container Ship"
                                {...register('vessel_type')}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="flag_country">Flag Country</Label>
                            <Input
                                id="flag_country"
                                placeholder="Panama"
                                {...register('flag_country')}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            placeholder="Additional information..."
                            rows={3}
                            {...register('notes')}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : isEditing ? (
                                'Update Ship'
                            ) : (
                                'Add Ship'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

interface DeleteShipDialogProps {
    ship: ShipType;
    onSuccess: () => void;
}

export function DeleteShipDialog({ ship, onSuccess }: DeleteShipDialogProps) {
    const [open, setOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const supabase = createClient();
            const { error } = await supabase.from('ships').delete().eq('id', ship.id);

            if (error) throw error;

            toast.success('Ship deleted successfully');
            setOpen(false);
            onSuccess();
        } catch (error) {
            toast.error('Failed to delete ship', {
                description: error instanceof Error ? error.message : 'An error occurred',
            });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete Ship</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete <strong>{ship.name}</strong>? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isDeleting}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            'Delete'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
