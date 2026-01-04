'use client';

import { format } from 'date-fns';
import { MoreHorizontal, Mail, Ship, Clock, FileSpreadsheet } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { ScheduledJob, JobStatus } from '@/types/database';

const statusConfig: Record<JobStatus, { label: string; className: string }> = {
    pending: {
        label: 'Pending',
        className: 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/20',
    },
    processing: {
        label: 'Processing',
        className: 'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20',
    },
    sent: {
        label: 'Sent',
        className: 'bg-success/10 text-success border-success/20 hover:bg-success/20',
    },
    failed: {
        label: 'Failed',
        className: 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20',
    },
    cancelled: {
        label: 'Cancelled',
        className: 'bg-muted text-muted-foreground border-muted hover:bg-muted/80',
    },
};

interface JobsTableProps {
    jobs: ScheduledJob[];
    isLoading?: boolean;
    onCancelJob?: (id: string) => void;
    onRetryJob?: (id: string) => void;
}

export function JobsTable({ jobs, isLoading, onCancelJob, onRetryJob }: JobsTableProps) {
    if (isLoading) {
        return <JobsTableSkeleton />;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg font-semibold">Recent Scheduled Jobs</CardTitle>
                <CardDescription>
                    View and manage your scheduled email deliveries
                </CardDescription>
            </CardHeader>
            <CardContent>
                {jobs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="rounded-full bg-muted p-4 mb-4">
                            <Mail className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium mb-1">No scheduled jobs</h3>
                        <p className="text-sm text-muted-foreground max-w-sm">
                            You haven&apos;t scheduled any email deliveries yet. Click &quot;Schedule New&quot; to get started.
                        </p>
                    </div>
                ) : (
                    <div className="rounded-md border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="font-semibold">Ship</TableHead>
                                    <TableHead className="font-semibold">Recipient</TableHead>
                                    <TableHead className="font-semibold">File</TableHead>
                                    <TableHead className="font-semibold">Scheduled</TableHead>
                                    <TableHead className="font-semibold">Status</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {jobs.map((job) => (
                                    <TableRow
                                        key={job.id}
                                        className="group hover:bg-muted/50 transition-colors"
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <Ship className="h-4 w-4 text-primary" />
                                                </div>
                                                <span className="font-medium">{job.ship_name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 text-sm">
                                                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span className="text-muted-foreground">{job.target_email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 text-sm">
                                                <FileSpreadsheet className="h-3.5 w-3.5 text-success" />
                                                <span className="max-w-[150px] truncate">{job.file_name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 text-sm">
                                                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span>{format(new Date(job.scheduled_time), 'MMM d, yyyy HH:mm')}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    'transition-colors',
                                                    statusConfig[job.status].className
                                                )}
                                            >
                                                {statusConfig[job.status].label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Open menu</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem>View details</DropdownMenuItem>
                                                    {job.status === 'pending' && (
                                                        <DropdownMenuItem
                                                            onClick={() => onCancelJob?.(job.id)}
                                                            className="text-destructive focus:text-destructive"
                                                        >
                                                            Cancel job
                                                        </DropdownMenuItem>
                                                    )}
                                                    {job.status === 'failed' && (
                                                        <DropdownMenuItem onClick={() => onRetryJob?.(job.id)}>
                                                            Retry sending
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function JobsTableSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-72" />
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead><Skeleton className="h-4 w-12" /></TableHead>
                                <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                                <TableHead><Skeleton className="h-4 w-10" /></TableHead>
                                <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                                <TableHead><Skeleton className="h-4 w-14" /></TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[1, 2, 3, 4, 5].map((i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
