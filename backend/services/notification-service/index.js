import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import notificationRoutes from './routes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/notifications', notificationRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'Notification service running' });
});

const PORT = process.env.NOTIFICATION_SERVICE_PORT || 3006;

app.listen(PORT, () => {
  console.log(`Notification service running on port ${PORT}`);
});
