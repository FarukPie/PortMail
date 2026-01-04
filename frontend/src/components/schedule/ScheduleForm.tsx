'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { z } from 'zod';
import {
    Ship,
    Mail,
    Calendar,
    Clock,
    Loader2,
    ChevronRight,
    Globe,
    Anchor,
    FileText,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { Ship as ShipType, Port, PortAttachment } from '@/types/database';

const TIMEZONES = [
    { value: 'Europe/Istanbul', label: 'Istanbul (TRT)' },
    { value: 'UTC', label: 'UTC' },
    { value: 'Europe/London', label: 'London (GMT/BST)' },
    { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
    { value: 'Asia/Dubai', label: 'Dubai (GST)' },
];

const scheduleSchema = z.object({
    port_id: z.string().min(1, 'Liman seçiniz'),
    ship_name: z.string().min(2, 'Gemi adı gerekli'),
    target_email: z.string().email('Geçerli email girin'),
    scheduled_date: z.date({ message: 'Tarih seçiniz' }),
    scheduled_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Geçersiz saat'),
    timezone: z.string().min(1, 'Saat dilimi seçiniz'),
});

type ScheduleFormData = z.infer<typeof scheduleSchema>;

interface PortWithAttachments extends Port {
    attachments: PortAttachment[];
}

interface ScheduleFormProps {
    ships: ShipType[];
    userId: string;
}

export function ScheduleForm({ ships, userId }: ScheduleFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [shipSearchOpen, setShipSearchOpen] = useState(false);
    const [portSearchOpen, setPortSearchOpen] = useState(false);
    const [selectedShip, setSelectedShip] = useState<ShipType | null>(null);
    const [selectedPort, setSelectedPort] = useState<PortWithAttachments | null>(null);
    const [ports, setPorts] = useState<PortWithAttachments[]>([]);
    const [isLoadingPorts, setIsLoadingPorts] = useState(true);

    const {
        register,
        handleSubmit,
        control,
        setValue,
        watch,
        formState: { errors },
    } = useForm<ScheduleFormData>({
        resolver: zodResolver(scheduleSchema),
        defaultValues: {
            timezone: 'Europe/Istanbul',
        },
    });

    const watchShipName = watch('ship_name');

    // Fetch ports on mount
    useEffect(() => {
        const fetchPorts = async () => {
            const supabase = createClient();
            const { data: portsData } = await supabase
                .from('ports')
                .select('*')
                .order('name');

            if (portsData) {
                const portsWithAttachments = await Promise.all(
                    portsData.map(async (port) => {
                        const { data: attachments } = await supabase
                            .from('port_attachments')
                            .select('*')
                            .eq('port_id', port.id);
                        return { ...port, attachments: attachments || [] };
                    })
                );
                setPorts(portsWithAttachments);
            }
            setIsLoadingPorts(false);
        };
        fetchPorts();
    }, []);

    // Auto-fill when ship is selected
    useEffect(() => {
        if (selectedShip) {
            setValue('ship_name', selectedShip.name);
            setValue('target_email', selectedShip.default_email);
        }
    }, [selectedShip, setValue]);

    // Set port_id when port is selected
    useEffect(() => {
        if (selectedPort) {
            setValue('port_id', selectedPort.id);
        }
    }, [selectedPort, setValue]);

    // Process template with ship name
    const processTemplate = (template: string, shipName: string) => {
        return template.replace(/\{ship_name\}/g, shipName || '{ship_name}');
    };

    const onSubmit = async (data: ScheduleFormData) => {
        if (!selectedPort) {
            toast.error('Lütfen bir liman seçin');
            return;
        }

        if (selectedPort.attachments.length === 0) {
            toast.error('Bu limanın ekli dosyası yok');
            return;
        }

        setIsSubmitting(true);

        try {
            const supabase = createClient();

            // Combine date and time
            const [hours, minutes] = data.scheduled_time.split(':').map(Number);

            // Create a date object in the selected timezone
            // First create a string representation "YYYY-MM-DDTHH:mm:00"
            const dateStr = format(data.scheduled_date, 'yyyy-MM-dd');
            const dateTimeStr = `${dateStr}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;

            // Convert that local time (in the target timezone) to a Date object (which will be in UTC/Local process time but representing that instant)
            // We use fromZonedTime to say "This string represents a time in Istanbul" -> gives us the absolute instant
            const { fromZonedTime } = await import('date-fns-tz');
            const zonedDate = fromZonedTime(dateTimeStr, data.timezone);

            // Process subject and body with ship name
            const subject = processTemplate(selectedPort.email_subject, data.ship_name);
            const message = processTemplate(selectedPort.email_body, data.ship_name);

            // Create scheduled job record
            const { error: insertError } = await supabase.from('scheduled_jobs').insert({
                user_id: userId,
                ship_id: selectedShip?.id || null,
                ship_name: data.ship_name,
                target_email: data.target_email,
                subject,
                message,
                file_path: selectedPort.attachments[0].file_path,
                file_name: selectedPort.attachments.map((a) => a.file_name).join(', '),
                file_size: selectedPort.attachments.reduce((sum, a) => sum + (a.file_size || 0), 0),
                scheduled_time: zonedDate.toISOString(),
                timezone: data.timezone,
                status: 'pending',
            });

            if (insertError) {
                throw new Error(`İş oluşturulamadı: ${insertError.message}`);
            }

            toast.success('Email başarıyla zamanlandı!', {
                description: `${format(zonedDate, 'dd MMM yyyy HH:mm')} için planlandı`,
            });

            router.push('/');
            router.refresh();
        } catch (error) {
            toast.error('Email zamanlanamadı', {
                description: error instanceof Error ? error.message : 'Beklenmeyen bir hata oluştu',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Port Selection */}
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Anchor className="h-5 w-5 text-primary" />
                            Liman Seçimi
                        </CardTitle>
                        <CardDescription>
                            Email şablonu ve dosyalar otomatik yüklenecek
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Liman *</Label>
                            <Popover open={portSearchOpen} onOpenChange={setPortSearchOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={portSearchOpen}
                                        className="w-full justify-between"
                                        disabled={isLoadingPorts}
                                    >
                                        {selectedPort ? selectedPort.name : 'Liman seçin...'}
                                        <ChevronRight className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Liman ara..." />
                                        <CommandList>
                                            <CommandEmpty>
                                                Liman bulunamadı. Önce bir liman ekleyin.
                                            </CommandEmpty>
                                            <CommandGroup>
                                                {ports.map((port) => (
                                                    <CommandItem
                                                        key={port.id}
                                                        value={port.name}
                                                        onSelect={() => {
                                                            setSelectedPort(port);
                                                            setPortSearchOpen(false);
                                                        }}
                                                    >
                                                        <Anchor className="mr-2 h-4 w-4" />
                                                        {port.name}
                                                        <Badge variant="secondary" className="ml-2">
                                                            {port.attachments.length} dosya
                                                        </Badge>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            {errors.port_id && (
                                <p className="text-sm text-destructive">{errors.port_id.message}</p>
                            )}
                        </div>

                        {/* Show selected port attachments */}
                        {selectedPort && selectedPort.attachments.length > 0 && (
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Ekli Dosyalar</Label>
                                <div className="flex flex-wrap gap-2">
                                    {selectedPort.attachments.map((att) => (
                                        <Badge key={att.id} variant="outline" className="gap-1">
                                            <FileText className="h-3 w-3" />
                                            {att.file_name}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Ship Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Ship className="h-5 w-5 text-primary" />
                            Gemi Bilgileri
                        </CardTitle>
                        <CardDescription>
                            Gemi seçin veya manuel giriş yapın
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Gemi Seç</Label>
                            <Popover open={shipSearchOpen} onOpenChange={setShipSearchOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={shipSearchOpen}
                                        className="w-full justify-between"
                                    >
                                        {selectedShip ? selectedShip.name : 'Gemi ara...'}
                                        <ChevronRight className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Gemi ara..." />
                                        <CommandList>
                                            <CommandEmpty>Gemi bulunamadı.</CommandEmpty>
                                            <CommandGroup>
                                                {ships.map((ship) => (
                                                    <CommandItem
                                                        key={ship.id}
                                                        value={ship.name}
                                                        onSelect={() => {
                                                            setSelectedShip(ship);
                                                            setShipSearchOpen(false);
                                                        }}
                                                    >
                                                        <Ship className="mr-2 h-4 w-4" />
                                                        {ship.name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="ship_name">Gemi Adı *</Label>
                            <Input
                                id="ship_name"
                                placeholder="MV EXAMPLE"
                                className="uppercase"
                                {...register('ship_name')}
                            />
                            {errors.ship_name && (
                                <p className="text-sm text-destructive">{errors.ship_name.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="target_email">Alıcı Email *</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="target_email"
                                    type="email"
                                    placeholder="captain@vessel.com"
                                    className="pl-10"
                                    {...register('target_email')}
                                />
                            </div>
                            {errors.target_email && (
                                <p className="text-sm text-destructive">{errors.target_email.message}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Schedule Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Calendar className="h-5 w-5 text-primary" />
                            Zamanlama
                        </CardTitle>
                        <CardDescription>
                            Email gönderim zamanını seçin
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Tarih *</Label>
                            <Controller
                                control={control}
                                name="scheduled_date"
                                render={({ field }) => (
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    'w-full justify-start text-left font-normal',
                                                    !field.value && 'text-muted-foreground'
                                                )}
                                            >
                                                <Calendar className="mr-2 h-4 w-4" />
                                                {field.value ? format(field.value, 'dd MMM yyyy') : 'Tarih seçin'}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <CalendarComponent
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) => {
                                                    const today = new Date();
                                                    today.setHours(0, 0, 0, 0);
                                                    return date < today;
                                                }}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                )}
                            />
                            {errors.scheduled_date && (
                                <p className="text-sm text-destructive">{errors.scheduled_date.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="scheduled_time">Saat *</Label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="scheduled_time"
                                    type="time"
                                    className="pl-10"
                                    {...register('scheduled_time')}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Örnek: 14:30, 09:15
                            </p>
                            {errors.scheduled_time && (
                                <p className="text-sm text-destructive">{errors.scheduled_time.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Saat Dilimi</Label>
                            <Controller
                                control={control}
                                name="timezone"
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <SelectTrigger>
                                            <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
                                            <SelectValue placeholder="Saat dilimi seçin" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TIMEZONES.map((tz) => (
                                                <SelectItem key={tz.value} value={tz.value}>
                                                    {tz.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Email Preview */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Mail className="h-5 w-5 text-primary" />
                            Email Önizleme
                        </CardTitle>
                        <CardDescription>
                            Gönderilecek email içeriği
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {selectedPort ? (
                            <>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Konu</Label>
                                    <p className="text-sm font-medium">
                                        {processTemplate(selectedPort.email_subject, watchShipName || '')}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">İçerik</Label>
                                    <Textarea
                                        readOnly
                                        rows={8}
                                        className="text-sm font-mono bg-muted"
                                        value={processTemplate(selectedPort.email_body, watchShipName || '')}
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Önizleme için liman seçin</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isSubmitting}
                >
                    İptal
                </Button>
                <Button
                    type="submit"
                    className="bg-gradient-ocean hover:opacity-90"
                    disabled={isSubmitting || !selectedPort}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Zamanlanıyor...
                        </>
                    ) : (
                        <>
                            <Calendar className="mr-2 h-4 w-4" />
                            Email Zamanla
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
