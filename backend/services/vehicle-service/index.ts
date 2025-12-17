import express from 'express';
import dotenv from 'dotenv';
import vehicleRoutes from './routes.js';

dotenv.config();

const app = express();
app.use(express.json());

app.use('/vehicles', vehicleRoutes);

app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({ status: 'Vehicle service running' });
});

const PORT = process.env.VEHICLE_SERVICE_PORT || 3003;

app.listen(PORT, () => {
  console.log(`Vehicle service running on port ${PORT}`);
});
