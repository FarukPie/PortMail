'use client';

import { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Upload, File, X, AlertCircle, FileText, FileSpreadsheet, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FileDropzoneProps {
    onFilesSelect: (files: File[]) => void;
    files: File[];
    error?: string;
    disabled?: boolean;
    maxFiles?: number;
}

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB per file

const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['xlsx', 'xls', 'csv'].includes(ext || '')) {
        return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
    }
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
        return <ImageIcon className="h-4 w-4 text-purple-600" />;
    }
    if (['pdf'].includes(ext || '')) {
        return <FileText className="h-4 w-4 text-red-600" />;
    }
    if (['doc', 'docx'].includes(ext || '')) {
        return <FileText className="h-4 w-4 text-blue-600" />;
    }
    return <File className="h-4 w-4 text-gray-600" />;
};

export function FileDropzone({ onFilesSelect, files, error, disabled, maxFiles = 20 }: FileDropzoneProps) {
    const [localError, setLocalError] = useState<string | null>(null);

    const onDrop = useCallback(
        (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
            setLocalError(null);

            if (rejectedFiles.length > 0) {
                const rejection = rejectedFiles[0];
                if (rejection.errors[0]?.message) {
                    setLocalError(rejection.errors[0].message);
                }
                return;
            }

            // Add new files to existing files
            const newFiles = [...files, ...acceptedFiles].slice(0, maxFiles);
            onFilesSelect(newFiles);
        },
        [onFilesSelect, files, maxFiles]
    );

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
        onDrop,
        maxSize: MAX_FILE_SIZE,
        maxFiles: maxFiles - files.length,
        disabled: disabled || files.length >= maxFiles,
    });

    const removeFile = (index: number) => {
        const newFiles = files.filter((_, i) => i !== index);
        onFilesSelect(newFiles);
        setLocalError(null);
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const displayError = error || localError;

    return (
        <div className="space-y-3">
            {/* File list */}
            {files.length > 0 && (
                <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">
                        {files.length} dosya seçildi
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                        {files.map((file, index) => (
                            <div
                                key={`${file.name}-${index}`}
                                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                            >
                                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                                    {getFileIcon(file.name)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{file.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatFileSize(file.size)}
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                                    onClick={() => removeFile(index)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Dropzone */}
            {files.length < maxFiles && (
                <div
                    {...getRootProps()}
                    className={cn(
                        'relative cursor-pointer rounded-lg border-2 border-dashed p-6 transition-all duration-200',
                        'hover:border-primary/50 hover:bg-accent/50',
                        isDragActive && !isDragReject && 'border-primary bg-primary/5',
                        isDragReject && 'border-destructive bg-destructive/5',
                        displayError && 'border-destructive',
                        disabled && 'opacity-50 cursor-not-allowed'
                    )}
                >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center justify-center gap-2 text-center">
                        <div
                            className={cn(
                                'rounded-full p-2.5 transition-colors',
                                isDragActive && !isDragReject
                                    ? 'bg-primary/10 text-primary'
                                    : isDragReject
                                        ? 'bg-destructive/10 text-destructive'
                                        : 'bg-muted text-muted-foreground'
                            )}
                        >
                            <Upload className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="font-medium text-sm">
                                {isDragActive
                                    ? isDragReject
                                        ? 'Geçersiz dosya türü'
                                        : 'Dosyaları buraya bırakın'
                                    : 'Dosyaları sürükleyip bırakın'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                veya tıklayarak seçin (maks. {maxFiles} dosya, 25MB/dosya)
                            </p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                                <FileText className="h-3.5 w-3.5 text-red-500" /> PDF
                            </span>
                            <span className="flex items-center gap-1">
                                <FileSpreadsheet className="h-3.5 w-3.5 text-green-500" /> Excel
                            </span>
                            <span className="flex items-center gap-1">
                                <FileText className="h-3.5 w-3.5 text-blue-500" /> Word
                            </span>
                            <span className="flex items-center gap-1">
                                <ImageIcon className="h-3.5 w-3.5 text-purple-500" /> Resim
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {displayError && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>{displayError}</span>
                </div>
            )}
        </div>
    );
}
