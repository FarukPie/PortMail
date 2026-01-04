'use client';

import { useEffect, useState, useMemo } from 'react';
import { format } from 'date-fns';
import { History, Search, Filter, Download } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { ScheduledJob, JobStatus } from '@/types/database';

const statusConfig: Record<JobStatus, { label: string; className: string }> = {
    pending: {
        label: 'Pending',
        className: 'bg-warning/10 text-warning border-warning/20',
    },
    processing: {
        label: 'Processing',
        className: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    },
    sent: {
        label: 'Sent',
        className: 'bg-success/10 text-success border-success/20',
    },
    failed: {
        label: 'Failed',
        className: 'bg-destructive/10 text-destructive border-destructive/20',
    },
    cancelled: {
        label: 'Cancelled',
        className: 'bg-muted text-muted-foreground border-muted',
    },
};

export default function HistoryPage() {
    const [jobs, setJobs] = useState<ScheduledJob[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        const fetchJobs = async () => {
            const supabase = createClient();
            const { data } = await supabase
                .from('scheduled_jobs')
                .select('*')
                .order('created_at', { ascending: false });

            setJobs(data || []);
            setIsLoading(false);
        };

        fetchJobs();
    }, []);

    const filteredJobs = useMemo(() => {
        let result = jobs;

        // Filter by search term
        if (searchTerm) {
            const lowerInfo = searchTerm.toLowerCase();
            result = result.filter(
                (job) =>
                    job.ship_name.toLowerCase().includes(lowerInfo) ||
                    job.target_email.toLowerCase().includes(lowerInfo) ||
                    job.file_name.toLowerCase().includes(lowerInfo)
            );
        }

        // Filter by status
        if (statusFilter !== 'all') {
            result = result.filter((job) => job.status === statusFilter);
        }

        return result;
    }, [jobs, searchTerm, statusFilter]);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <History className="h-6 w-6" />
                        Job History
                    </h1>
                    <p className="text-muted-foreground">
                        Complete history of all scheduled email deliveries
                    </p>
                </div>
                <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by ship, email, or file..."
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <Filter className="mr-2 h-4 w-4" />
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="processing">Processing</SelectItem>
                                <SelectItem value="sent">Sent</SelectItem>
                                <SelectItem value="failed">Failed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* History Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">All Jobs</CardTitle>
                    <CardDescription>
                        Showing {filteredJobs.length} of {jobs.length} jobs
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <HistoryTableSkeleton />
                    ) : filteredJobs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="rounded-full bg-muted p-4 mb-4">
                                <History className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium mb-1">No jobs found</h3>
                            <p className="text-sm text-muted-foreground max-w-sm">
                                {searchTerm || statusFilter !== 'all'
                                    ? 'Try adjusting your search or filter criteria.'
                                    : 'Schedule your first email to see it here.'}
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-md border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="font-semibold">Ship</TableHead>
                                        <TableHead className="font-semibold">Email</TableHead>
                                        <TableHead className="font-semibold">File</TableHead>
                                        <TableHead className="font-semibold">Scheduled</TableHead>
                                        <TableHead className="font-semibold">Status</TableHead>
                                        <TableHead className="font-semibold">Sent At</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredJobs.map((job) => (
                                        <TableRow key={job.id} className="hover:bg-muted/50">
                                            <TableCell className="font-medium">{job.ship_name}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {job.target_email}
                                            </TableCell>
                                            <TableCell className="text-sm max-w-[150px] truncate">
                                                {job.file_name}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {format(new Date(job.scheduled_time), 'MMM d, yyyy HH:mm')}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={cn(statusConfig[job.status].className)}
                                                >
                                                    {statusConfig[job.status].label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {job.sent_at
                                                    ? format(new Date(job.sent_at), 'MMM d, yyyy HH:mm')
                                                    : '-'}
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

function HistoryTableSkeleton() {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <TableHead key={i}>
                                <Skeleton className="h-4 w-16" />
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
