import express from 'express';
import dotenv from 'dotenv';
import notificationRoutes from './routes.js';

dotenv.config();

const app = express();
app.use(express.json());

app.use('/notification', notificationRoutes);

app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({ status: 'Driver service running' });
});

const PORT = process.env.NOTIFICATION_SERVICE_PORT || 3002;

app.listen(PORT, () => {
  console.log(`Notification service running on port ${PORT}`);
});
