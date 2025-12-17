import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes.js';
dotenv.config();
const app = express();
app.use(express.json());
app.use('/auth', authRoutes);
app.get('/health', (req, res) => {
    res.json({ status: 'Auth service running' });
});
const PORT = process.env.AUTH_SERVICE_PORT || 3001;
app.listen(PORT, () => {
    console.log(`Auth service running on port ${PORT}`);
});
