'use client';

import { useEffect, useState, useCallback } from 'react';
import { Ship, Mail, Anchor, Flag, FileText } from 'lucide-react';
import { format } from 'date-fns';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ShipForm, DeleteShipDialog } from '@/components/ships/ShipForm';
import { createClient } from '@/lib/supabase/client';
import type { Ship as ShipType } from '@/types/database';

export default function ShipsPage() {
    const [ships, setShips] = useState<ShipType[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchShips = useCallback(async () => {
        const supabase = createClient();
        const { data } = await supabase
            .from('ships')
            .select('*')
            .order('name');

        setShips(data || []);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchShips(); // eslint-disable-line
    }, [fetchShips]);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Ships</h1>
                    <p className="text-muted-foreground">
                        Manage your fleet and default contact information
                    </p>
                </div>
                <ShipForm onSuccess={fetchShips} />
            </div>

            {/* Ships Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Fleet Registry</CardTitle>
                    <CardDescription>
                        {ships.length} {ships.length === 1 ? 'ship' : 'ships'} registered
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <ShipsTableSkeleton />
                    ) : ships.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="rounded-full bg-muted p-4 mb-4">
                                <Ship className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium mb-1">No ships registered</h3>
                            <p className="text-sm text-muted-foreground max-w-sm mb-4">
                                Add your first ship to start scheduling email deliveries.
                            </p>
                            <ShipForm onSuccess={fetchShips} />
                        </div>
                    ) : (
                        <div className="rounded-md border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="font-semibold">Ship</TableHead>
                                        <TableHead className="font-semibold">IMO Number</TableHead>
                                        <TableHead className="font-semibold">Email</TableHead>
                                        <TableHead className="font-semibold">Type</TableHead>
                                        <TableHead className="font-semibold">Flag</TableHead>
                                        <TableHead className="font-semibold">Added</TableHead>
                                        <TableHead className="w-[80px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {ships.map((ship) => (
                                        <TableRow key={ship.id} className="group hover:bg-muted/50">
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                        <Ship className="h-4 w-4 text-primary" />
                                                    </div>
                                                    <span className="font-medium">{ship.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                    <Anchor className="h-3.5 w-3.5" />
                                                    {ship.imo_number || '-'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5 text-sm">
                                                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                                    {ship.default_email}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                    <FileText className="h-3.5 w-3.5" />
                                                    {ship.vessel_type || '-'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                    <Flag className="h-3.5 w-3.5" />
                                                    {ship.flag_country || '-'}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {format(new Date(ship.created_at), 'MMM d, yyyy')}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <ShipForm ship={ship} onSuccess={fetchShips} />
                                                    <DeleteShipDialog ship={ship} onSuccess={fetchShips} />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function ShipsTableSkeleton() {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50">
                        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                            <TableHead key={i}>
                                <Skeleton className="h-4 w-16" />
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[1, 2, 3].map((i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
