'use client';

import { useEffect, useState, useCallback } from 'react';
import { Anchor, FileText, Mail } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { PortForm, DeletePortDialog } from '@/components/ports/PortForm';
import { createClient } from '@/lib/supabase/client';
import type { Port, PortAttachment } from '@/types/database';

interface PortWithAttachments extends Port {
    attachments: PortAttachment[];
}

export default function PortsPage() {
    const [ports, setPorts] = useState<PortWithAttachments[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchPorts = useCallback(async () => {
        const supabase = createClient();

        // Fetch ports
        const { data: portsData } = await supabase
            .from('ports')
            .select('*')
            .order('name');

        if (!portsData) {
            setPorts([]);
            setIsLoading(false);
            return;
        }

        // Fetch attachments for each port
        const portsWithAttachments = await Promise.all(
            portsData.map(async (port) => {
                const { data: attachments } = await supabase
                    .from('port_attachments')
                    .select('*')
                    .eq('port_id', port.id);

                return {
                    ...port,
                    attachments: attachments || [],
                };
            })
        );

        setPorts(portsWithAttachments);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchPorts(); // eslint-disable-line
    }, [fetchPorts]);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Anchor className="h-6 w-6" />
                        Limanlar
                    </h1>
                    <p className="text-muted-foreground">
                        Liman bazlı email şablonlarını yönetin
                    </p>
                </div>
                <PortForm onSuccess={fetchPorts} />
            </div>

            {/* Ports Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Kayıtlı Limanlar</CardTitle>
                    <CardDescription>
                        {ports.length} liman kayıtlı
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <PortsTableSkeleton />
                    ) : ports.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="rounded-full bg-muted p-4 mb-4">
                                <Anchor className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium mb-1">Liman bulunamadı</h3>
                            <p className="text-sm text-muted-foreground max-w-sm mb-4">
                                Email göndermeye başlamak için ilk limanınızı ekleyin.
                            </p>
                            <PortForm onSuccess={fetchPorts} />
                        </div>
                    ) : (
                        <div className="rounded-md border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="font-semibold">Liman</TableHead>
                                        <TableHead className="font-semibold">Email Konusu</TableHead>
                                        <TableHead className="font-semibold">Dosyalar</TableHead>
                                        <TableHead className="font-semibold">Oluşturulma</TableHead>
                                        <TableHead className="w-[80px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {ports.map((port) => (
                                        <TableRow key={port.id} className="group hover:bg-muted/50">
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                        <Anchor className="h-4 w-4 text-primary" />
                                                    </div>
                                                    <span className="font-medium">{port.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5 text-sm">
                                                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                                    <span className="truncate max-w-[250px]">{port.email_subject}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="gap-1">
                                                    <FileText className="h-3 w-3" />
                                                    {port.attachments.length} dosya
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {format(new Date(port.created_at), 'dd MMM yyyy')}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <PortForm port={port} onSuccess={fetchPorts} />
                                                    <DeletePortDialog port={port} onSuccess={fetchPorts} />
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

function PortsTableSkeleton() {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50">
                        {[1, 2, 3, 4, 5].map((i) => (
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
                            <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
