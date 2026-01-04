import nodemailer from 'nodemailer';

// Create reusable transporter using Gmail SMTP
function createTransporter() {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;

    if (!user || !pass) {
        throw new Error('GMAIL_USER and GMAIL_APP_PASSWORD environment variables are required');
    }

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user,
            pass,
        },
    });
}

interface SendEmailOptions {
    to: string;
    subject: string;
    body: string;
    attachments?: {
        filename: string;
        content: Buffer;
    }[];
}

interface SendEmailResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    try {
        const transporter = createTransporter();
        const fromEmail = process.env.GMAIL_USER;

        const mailOptions: nodemailer.SendMailOptions = {
            from: fromEmail,
            to: options.to,
            subject: options.subject,
            text: options.body,
            html: options.body.replace(/\n/g, '<br>'),
            attachments: options.attachments?.map(att => ({
                filename: att.filename,
                content: att.content,
            })),
        };

        const info = await transporter.sendMail(mailOptions);

        console.log('✅ Email sent:', info.messageId);

        return {
            success: true,
            messageId: info.messageId,
        };
    } catch (error) {
        console.error('❌ Email sending failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
