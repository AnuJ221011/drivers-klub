import express from 'express';
import dotenv from 'dotenv';
import assignmentRoutes from './routes.js';

dotenv.config();

const app = express();
app.use(express.json());

app.use('/assignments', assignmentRoutes);

app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({ status: 'Daily Assignment service running' });
});

const PORT = process.env.ASSIGNMENT_SERVICE_PORT || 3004;

app.listen(PORT, () => {
  console.log(`Daily Assignment service running on port ${PORT}`);
});
