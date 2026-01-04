import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '../lib/email';
import { Request, Response, Router } from 'express';

const router = Router();

router.all('/send-mails', async (req: Request, res: Response) => {
    // Verify cron secret
    const authHeader = req.headers['authorization'];
    const cronSecret = process.env.CRON_SECRET;
    const isDev = process.env.NODE_ENV === 'development';

    if (!isDev && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    // Use Service Role Key to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
        res.status(500).json({ error: 'Configuration Error: Missing SUPABASE_SERVICE_ROLE_KEY' });
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const now = new Date().toISOString();
    console.log(`\n🔍 --- CRON DEBUG START ---`);
    console.log(`🕒 Server Time (UTC): ${now}`);

    try {
        // DEBUG: First check if there are ANY pending jobs regardless of time
        const { count: totalPending } = await supabase
            .from('scheduled_jobs')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');

        console.log(`📊 Total Pending Jobs in DB: ${totalPending}`);

        // Get pending jobs that are due
        const { data: pendingJobs, error: fetchError } = await supabase
            .from('scheduled_jobs')
            .select('*')
            .eq('status', 'pending')
            .lte('scheduled_time', now) // <--- This comparison is crucial
            .order('scheduled_time')
            .limit(50);

        if (fetchError) {
            console.log(`❌ Failed to fetch pending jobs: ${JSON.stringify(fetchError)}`);
            res.status(500).json({ error: 'Failed to fetch pending jobs' });
            return;
        }

        console.log(`📋 Due Jobs Found: ${pendingJobs?.length || 0}`);

        if (pendingJobs && pendingJobs.length > 0) {
            pendingJobs.forEach(job => {
                console.log(`   - Job ID: ${job.id}`);
                console.log(`     Scheduled: ${job.scheduled_time}`);
                console.log(`     Target: ${job.target_email}`);
                console.log(`     Now: ${now}`);
                console.log(`     Is Due? ${job.scheduled_time <= now}`);
            });
        } else {
            // If no due jobs, let's see the next upcoming job to debug time diff
            const { data: nextJob } = await supabase
                .from('scheduled_jobs')
                .select('scheduled_time, timezone')
                .eq('status', 'pending')
                .order('scheduled_time', { ascending: true })
                .limit(1)
                .single();

            if (nextJob) {
                console.log(`⏭️  Next upcoming job is at: ${nextJob.scheduled_time} (Timezone: ${nextJob.timezone})`);
                console.log(`    Time remaining: ${(new Date(nextJob.scheduled_time).getTime() - new Date(now).getTime()) / 1000 / 60} minutes`);
            }
        }

        if (!pendingJobs || pendingJobs.length === 0) {
            console.log(`🏁 --- CRON DEBUG END ---\n`);
            res.json({
                message: 'No pending jobs to process',
                currentTime: now,
                processed: 0,
            });
            return;
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
                console.log(`❌ Job ${job.id} failed: ${errorMessage}`);
            }

            results.processed++;
        }

        console.log(`📊 Cron job complete: ${results.sent} sent, ${results.failed} failed`);

        res.json({
            message: 'Cron job completed',
            ...results,
        });
    } catch (error) {
        console.error('Cron job error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
