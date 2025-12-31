import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
    title: string;
    value: number;
    description?: string;
    icon: 'pending' | 'sent' | 'failed';
    trend?: {
        value: number;
        isPositive: boolean;
    };
}

const iconConfig = {
    pending: {
        icon: Clock,
        className: 'bg-warning/10 text-warning',
        valueClassName: 'text-warning',
    },
    sent: {
        icon: CheckCircle2,
        className: 'bg-success/10 text-success',
        valueClassName: 'text-success',
    },
    failed: {
        icon: AlertCircle,
        className: 'bg-destructive/10 text-destructive',
        valueClassName: 'text-destructive',
    },
};

export function StatsCard({ title, value, description, icon, trend }: StatsCardProps) {
    const config = iconConfig[icon];
    const Icon = config.icon;

    return (
        <Card className="overflow-hidden transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <div className={cn('rounded-lg p-2', config.className)}>
                    <Icon className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent>
                <div className={cn('text-3xl font-bold', config.valueClassName)}>
                    {value.toLocaleString()}
                </div>
                <div className="flex items-center gap-2 mt-1">
                    {description && (
                        <p className="text-xs text-muted-foreground">{description}</p>
                    )}
                    {trend && (
                        <div
                            className={cn(
                                'flex items-center gap-0.5 text-xs font-medium',
                                trend.isPositive ? 'text-success' : 'text-destructive'
                            )}
                        >
                            <TrendingUp
                                className={cn(
                                    'h-3 w-3',
                                    !trend.isPositive && 'rotate-180'
                                )}
                            />
                            {trend.value}%
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export function StatsCardSkeleton() {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-lg" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
            </CardContent>
        </Card>
    );
}

interface StatsCardsProps {
    pending: number;
    sentToday: number;
    failed: number;
    isLoading?: boolean;
}

export function StatsCards({ pending, sentToday, failed, isLoading }: StatsCardsProps) {
    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-3">
                <StatsCardSkeleton />
                <StatsCardSkeleton />
                <StatsCardSkeleton />
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <StatsCard
                title="Pending Emails"
                value={pending}
                description="Scheduled for delivery"
                icon="pending"
            />
            <StatsCard
                title="Sent Today"
                value={sentToday}
                description="Successfully delivered"
                icon="sent"
            />
            <StatsCard
                title="Failed Jobs"
                value={failed}
                description="Require attention"
                icon="failed"
            />
        </div>
    );
}
