'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Anchor, Plus, Pencil, Trash2, Loader2, FileText, X, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { useDropzone, FileRejection } from 'react-dropzone';

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
import { createClient } from '@/lib/supabase/client';
import type { Port, PortAttachment } from '@/types/database';
import { cn } from '@/lib/utils';

const portSchema = z.object({
    name: z.string().min(2, 'Liman adı en az 2 karakter olmalı'),
    email_subject: z.string().min(5, 'Konu en az 5 karakter olmalı'),
    email_body: z.string().min(10, 'Email içeriği en az 10 karakter olmalı'),
    recipient_email: z.string().email('Geçerli email girin').optional().or(z.literal('')),
});

type PortFormData = z.infer<typeof portSchema>;

interface PortFormProps {
    port?: Port & { attachments?: PortAttachment[] };
    onSuccess: () => void;
}

export function PortForm({ port, onSuccess }: PortFormProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [existingAttachments, setExistingAttachments] = useState<PortAttachment[]>(
        port?.attachments || []
    );
    const [attachmentsToDelete, setAttachmentsToDelete] = useState<string[]>([]);
    const isEditing = Boolean(port);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<PortFormData>({
        resolver: zodResolver(portSchema),
        defaultValues: port
            ? {
                name: port.name,
                email_subject: port.email_subject,
                email_body: port.email_body,
                recipient_email: port.recipient_email || '',
            }
            : {
                email_subject: '{ship_name} // PRE ARRIVAL // ',
                email_body: `Dear Master,

Good day,

Hope all fine,

[Email içeriğini buraya yazın]

Please confirm safe receipt.

Best Regards`,
            },
    });

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
            if (rejectedFiles.length > 0) {
                toast.error('Bazı dosyalar kabul edilmedi');
                return;
            }
            setFiles((prev) => [...prev, ...acceptedFiles]);
        },
        maxSize: 25 * 1024 * 1024, // 25MB
    });

    const removeNewFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const removeExistingAttachment = (attachmentId: string) => {
        setAttachmentsToDelete((prev) => [...prev, attachmentId]);
        setExistingAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const onSubmit = async (data: PortFormData) => {
        if (!isEditing && files.length === 0) {
            toast.error('Lütfen en az bir dosya ekleyin');
            return;
        }

        setIsSubmitting(true);

        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                toast.error('Giriş yapmanız gerekiyor');
                return;
            }

            let portId = port?.id;

            if (isEditing && port) {
                // Update existing port
                const { error } = await supabase
                    .from('ports')
                    .update({
                        name: data.name.toUpperCase(),
                        email_subject: data.email_subject,
                        email_body: data.email_body,
                        recipient_email: data.recipient_email || null,
                    })
                    .eq('id', port.id);

                if (error) throw error;

                // Delete removed attachments
                for (const attachmentId of attachmentsToDelete) {
                    const attachment = port.attachments?.find((a) => a.id === attachmentId);
                    if (attachment) {
                        await supabase.storage.from('ship-attachments').remove([attachment.file_path]);
                        await supabase.from('port_attachments').delete().eq('id', attachmentId);
                    }
                }
            } else {
                // Create new port
                const { data: newPort, error } = await supabase
                    .from('ports')
                    .insert({
                        name: data.name.toUpperCase(),
                        email_subject: data.email_subject,
                        email_body: data.email_body,
                        recipient_email: data.recipient_email || null,
                        created_by: user.id,
                    })
                    .select()
                    .single();

                if (error) throw error;
                portId = newPort.id;
            }

            // Upload new files
            for (const file of files) {
                const fileExt = file.name.split('.').pop();
                const filePath = `ports/${portId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('ship-attachments')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                // Save attachment record
                const { error: attachmentError } = await supabase.from('port_attachments').insert({
                    port_id: portId,
                    file_path: filePath,
                    file_name: file.name,
                    file_size: file.size,
                    file_type: file.type,
                });

                if (attachmentError) throw attachmentError;
            }

            toast.success(isEditing ? 'Liman güncellendi' : 'Liman oluşturuldu');
            setOpen(false);
            reset();
            setFiles([]);
            setAttachmentsToDelete([]);
            onSuccess();
        } catch (error) {
            toast.error('İşlem başarısız', {
                description: error instanceof Error ? error.message : 'Bir hata oluştu',
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
                        Yeni Liman Ekle
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Anchor className="h-5 w-5" />
                        {isEditing ? 'Limanı Düzenle' : 'Yeni Liman Ekle'}
                    </DialogTitle>
                    <DialogDescription>
                        Limanın email şablonunu ve eklerini ayarlayın
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Liman Adı *</Label>
                        <Input
                            id="name"
                            placeholder="TEKIRDAG"
                            className="uppercase"
                            {...register('name')}
                        />
                        {errors.name && (
                            <p className="text-sm text-destructive">{errors.name.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email_subject">Email Konusu *</Label>
                        <Input
                            id="email_subject"
                            placeholder="{ship_name} // PRE ARRIVAL // TEKIRDAG"
                            {...register('email_subject')}
                        />
                        <p className="text-xs text-muted-foreground">
                            <code>{'{ship_name}'}</code> gemi adıyla değiştirilecek
                        </p>
                        {errors.email_subject && (
                            <p className="text-sm text-destructive">{errors.email_subject.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="recipient_email">Varsayılan Alıcı Email (Opsiyonel)</Label>
                        <Input
                            id="recipient_email"
                            type="email"
                            placeholder="captain@vessel.com"
                            {...register('recipient_email')}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email_body">Email İçeriği *</Label>
                        <Textarea
                            id="email_body"
                            placeholder="Dear Master..."
                            rows={10}
                            className="font-mono text-sm"
                            {...register('email_body')}
                        />
                        <p className="text-xs text-muted-foreground">
                            <code>{'{ship_name}'}</code> gemi adıyla değiştirilecek
                        </p>
                        {errors.email_body && (
                            <p className="text-sm text-destructive">{errors.email_body.message}</p>
                        )}
                    </div>

                    {/* Existing Attachments */}
                    {existingAttachments.length > 0 && (
                        <div className="space-y-2">
                            <Label>Mevcut Dosyalar</Label>
                            <div className="space-y-2">
                                {existingAttachments.map((attachment) => (
                                    <div
                                        key={attachment.id}
                                        className="flex items-center gap-3 p-2 rounded-lg border bg-card"
                                    >
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <span className="flex-1 text-sm truncate">{attachment.file_name}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {formatFileSize(attachment.file_size || 0)}
                                        </span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-destructive"
                                            onClick={() => removeExistingAttachment(attachment.id)}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* New Files */}
                    <div className="space-y-2">
                        <Label>{isEditing ? 'Yeni Dosya Ekle' : 'Dosyalar *'}</Label>

                        {files.length > 0 && (
                            <div className="space-y-2 mb-2">
                                {files.map((file, index) => (
                                    <div
                                        key={`${file.name}-${index}`}
                                        className="flex items-center gap-3 p-2 rounded-lg border bg-success/5 border-success/20"
                                    >
                                        <FileText className="h-4 w-4 text-success" />
                                        <span className="flex-1 text-sm truncate">{file.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {formatFileSize(file.size)}
                                        </span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => removeNewFile(index)}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div
                            {...getRootProps()}
                            className={cn(
                                'border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors',
                                'hover:border-primary/50 hover:bg-accent/50',
                                isDragActive && 'border-primary bg-primary/5'
                            )}
                        >
                            <input {...getInputProps()} />
                            <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                                Dosyaları sürükleyin veya tıklayarak seçin
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                PDF, Excel, Word, resim (maks. 25MB)
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isSubmitting}
                        >
                            İptal
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Kaydediliyor...
                                </>
                            ) : isEditing ? (
                                'Güncelle'
                            ) : (
                                'Oluştur'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

interface DeletePortDialogProps {
    port: Port;
    onSuccess: () => void;
}

export function DeletePortDialog({ port, onSuccess }: DeletePortDialogProps) {
    const [open, setOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const supabase = createClient();

            // Get all attachments
            const { data: attachments } = await supabase
                .from('port_attachments')
                .select('file_path')
                .eq('port_id', port.id);

            // Delete files from storage
            if (attachments && attachments.length > 0) {
                await supabase.storage
                    .from('ship-attachments')
                    .remove(attachments.map((a) => a.file_path));
            }

            // Delete port (attachments will cascade delete)
            const { error } = await supabase.from('ports').delete().eq('id', port.id);

            if (error) throw error;

            toast.success('Liman silindi');
            setOpen(false);
            onSuccess();
        } catch (error) {
            toast.error('Silme başarısız', {
                description: error instanceof Error ? error.message : 'Bir hata oluştu',
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
                    <DialogTitle>Limanı Sil</DialogTitle>
                    <DialogDescription>
                        <strong>{port.name}</strong> limanını silmek istediğinizden emin misiniz?
                        Bu işlem geri alınamaz ve tüm ekli dosyalar da silinecektir.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isDeleting}>
                        İptal
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Siliniyor...
                            </>
                        ) : (
                            'Sil'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
