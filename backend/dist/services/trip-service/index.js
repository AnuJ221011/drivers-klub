import express from 'express';
import dotenv from 'dotenv';
import tripRoutes from './routes.js';
dotenv.config();
const app = express();
app.use(express.json());
app.use('/trips', tripRoutes);
app.get('/health', (req, res) => {
    res.json({ status: 'Trip service running' });
});
const PORT = process.env.TRIP_SERVICE_PORT || 3005;
app.listen(PORT, () => {
    console.log(`Trip service running on port ${PORT}`);
});
