import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cronRoutes from './routes/cron';
import jobRoutes from './routes/jobs';
import shipRoutes from './routes/ships';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/cron', cronRoutes);
app.use('/jobs', jobRoutes);
app.use('/ships', shipRoutes);

app.get('/', (req, res) => {
    res.send('PortMail Backend API Running');
});

app.listen(port, () => {
    console.log(`Backend server running on port ${port}`);

    // Self-trigger cron job every minute for local development
    if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Dev Mode: Starting local cron simulator (every 60s)');
        setInterval(async () => {
            try {
                console.log('⏰ Triggering local cron job...');
                // We use a fetch to our own server to trigger the route
                await fetch(`http://localhost:${port}/cron/send-mails`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.CRON_SECRET || ''}`
                    }
                });
            } catch (error) {
                console.error('❌ Failed to trigger local cron:', error);
            }
        }, 60 * 1000);
    }
});
