import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    // Verify cron secret (skip in development for easier testing)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const isDev = process.env.NODE_ENV === 'development';

    if (!isDev && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }

    const supabase = await createClient();
    const now = new Date().toISOString();

    try {
        // Get pending jobs that are due
        const { data: pendingJobs, error: fetchError } = await supabase
            .from('scheduled_jobs')
            .select('*')
            .eq('status', 'pending')
            .lte('scheduled_time', now)
            .order('scheduled_time')
            .limit(50); // Process in batches

        if (fetchError) {
            console.error('Failed to fetch pending jobs:', fetchError);
            return NextResponse.json(
                { error: 'Failed to fetch pending jobs' },
                { status: 500 }
            );
        }

        if (!pendingJobs || pendingJobs.length === 0) {
            return NextResponse.json({
                message: 'No pending jobs to process',
                processed: 0,
            });
        }

        console.log(`📬 Processing ${pendingJobs.length} pending jobs...`);

        const results = {
            processed: 0,
            sent: 0,
            failed: 0,
            errors: [] as { jobId: string; error: string }[],
        };

        for (const job of pendingJobs) {
            // Mark as processing
            await supabase
                .from('scheduled_jobs')
                .update({ status: 'processing' })
                .eq('id', job.id);

            try {
                // Get all file paths (comma-separated in file_name, single path in file_path)
                const filePaths = job.file_name?.includes(',')
                    ? job.file_name.split(',').map((f: string) => f.trim())
                    : [job.file_path];

                // Download attachments from storage
                const attachments: { filename: string; content: Buffer }[] = [];

                for (const filePath of filePaths) {
                    if (!filePath) continue;

                    // Get actual file path from port_attachments if this is a port-based job
                    const { data: fileData, error: downloadError } = await supabase.storage
                        .from('ship-attachments')
                        .download(filePath);

                    if (downloadError || !fileData) {
                        console.warn(`Could not download file ${filePath}:`, downloadError?.message);
                        continue;
                    }

                    // Convert Blob to Buffer
                    const arrayBuffer = await fileData.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);

                    // Extract filename from path
                    const filename = filePath.split('/').pop() || 'attachment';

                    attachments.push({
                        filename,
                        content: buffer,
                    });
                }

                // Send the email
                const emailResult = await sendEmail({
                    to: job.target_email,
                    subject: job.subject,
                    body: job.message || '',
                    attachments: attachments.length > 0 ? attachments : undefined,
                });

                if (emailResult.success) {
                    // Mark as sent
                    await supabase
                        .from('scheduled_jobs')
                        .update({
                            status: 'sent',
                            sent_at: new Date().toISOString(),
                        })
                        .eq('id', job.id);

                    results.sent++;
                    console.log(`✅ Job ${job.id} sent successfully to ${job.target_email}`);
                } else {
                    throw new Error(emailResult.error || 'Unknown email error');
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';

                // Update job with error
                await supabase
                    .from('scheduled_jobs')
                    .update({
                        status: 'failed',
                        error_log: errorMessage,
                        retry_count: job.retry_count + 1,
                    })
                    .eq('id', job.id);

                results.failed++;
                results.errors.push({ jobId: job.id, error: errorMessage });
                console.error(`❌ Job ${job.id} failed:`, errorMessage);
            }

            results.processed++;
        }

        console.log(`📊 Cron job complete: ${results.sent} sent, ${results.failed} failed`);

        return NextResponse.json({
            message: 'Cron job completed',
            ...results,
        });
    } catch (error) {
        console.error('Cron job error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Also support POST for Vercel Cron
export async function POST(request: NextRequest) {
    return GET(request);
}
