import express from 'express';
import dotenv from 'dotenv';
import driverRoutes from './routes.js';
dotenv.config();
const app = express();
app.use(express.json());
app.use('/drivers', driverRoutes);
app.get('/health', (req, res) => {
    res.json({ status: 'Driver service running' });
});
const PORT = process.env.DRIVER_SERVICE_PORT || 3002;
app.listen(PORT, () => {
    console.log(`Driver service running on port ${PORT}`);
});
