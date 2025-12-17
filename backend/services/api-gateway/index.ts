import express from 'express';
import dotenv from 'dotenv';
import { verifyToken } from './auth.middleware.js';
import {
  authProxy,
  driverProxy,
  vehicleProxy,
  assignmentProxy,
  tripProxy,
  notificationProxy,
} from './proxy.js';

dotenv.config();

const app = express();

// ❌ DO NOT use express.json() here

app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({ status: 'API Gateway running' });
});

// ✅ PUBLIC AUTH
app.use('/api/auth', authProxy);

// ✅ PROTECTED
app.use('/api/drivers', verifyToken, driverProxy);
app.use('/api/vehicles', verifyToken, vehicleProxy);
app.use('/api/assignments', verifyToken, assignmentProxy);
app.use('/api/trips', verifyToken, tripProxy);
app.use('/api/notifications', verifyToken, notificationProxy);

const PORT = process.env.GATEWAY_PORT || 3000;

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
