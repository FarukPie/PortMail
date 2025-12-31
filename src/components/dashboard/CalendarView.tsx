'use client';

import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ScheduledJob } from '@/types/database';

interface CalendarViewProps {
    jobs: ScheduledJob[];
    onDateClick?: (date: Date) => void;
}

export function CalendarView({ jobs, onDateClick }: CalendarViewProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Get the day of week for the first day (0 = Sunday)
    const startDayOfWeek = monthStart.getDay();

    // Create padding days for the calendar grid
    const paddingDays = Array(startDayOfWeek).fill(null);

    // Group jobs by date
    const jobsByDate = jobs.reduce((acc, job) => {
        const dateKey = format(new Date(job.scheduled_time), 'yyyy-MM-dd');
        if (!acc[dateKey]) {
            acc[dateKey] = [];
        }
        acc[dateKey].push(job);
        return acc;
    }, {} as Record<string, ScheduledJob[]>);

    const getJobCountForDate = (date: Date) => {
        const dateKey = format(date, 'yyyy-MM-dd');
        return jobsByDate[dateKey]?.length || 0;
    };

    const getJobStatusForDate = (date: Date) => {
        const dateKey = format(date, 'yyyy-MM-dd');
        const dateJobs = jobsByDate[dateKey] || [];
        if (dateJobs.some(j => j.status === 'failed')) return 'failed';
        if (dateJobs.some(j => j.status === 'pending')) return 'pending';
        if (dateJobs.some(j => j.status === 'sent')) return 'sent';
        return null;
    };

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold">Schedule Calendar</CardTitle>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium w-32 text-center">
                        {format(currentMonth, 'MMMM yyyy')}
                    </span>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {/* Week day headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {weekDays.map((day) => (
                        <div
                            key={day}
                            className="text-center text-xs font-medium text-muted-foreground py-2"
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                    {/* Padding days */}
                    {paddingDays.map((_, index) => (
                        <div key={`padding-${index}`} className="aspect-square p-1" />
                    ))}

                    {/* Actual days */}
                    {daysInMonth.map((day) => {
                        const jobCount = getJobCountForDate(day);
                        const status = getJobStatusForDate(day);
                        const isCurrentMonth = isSameMonth(day, currentMonth);

                        return (
                            <button
                                key={day.toISOString()}
                                onClick={() => onDateClick?.(day)}
                                className={cn(
                                    'aspect-square p-1 rounded-lg text-sm transition-all duration-200',
                                    'hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
                                    !isCurrentMonth && 'text-muted-foreground/50',
                                    isToday(day) && 'ring-2 ring-primary',
                                    jobCount > 0 && 'font-medium'
                                )}
                            >
                                <div className="flex flex-col items-center justify-center h-full gap-0.5">
                                    <span>{format(day, 'd')}</span>
                                    {jobCount > 0 && (
                                        <div
                                            className={cn(
                                                'flex items-center justify-center gap-0.5 text-[10px] px-1 py-0.5 rounded-full',
                                                status === 'pending' && 'bg-warning/20 text-warning',
                                                status === 'sent' && 'bg-success/20 text-success',
                                                status === 'failed' && 'bg-destructive/20 text-destructive'
                                            )}
                                        >
                                            <Mail className="h-2.5 w-2.5" />
                                            {jobCount}
                                        </div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <div className="h-2.5 w-2.5 rounded-full bg-warning" />
                        Pending
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <div className="h-2.5 w-2.5 rounded-full bg-success" />
                        Sent
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <div className="h-2.5 w-2.5 rounded-full bg-destructive" />
                        Failed
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
