import express from 'express';
import { createDriver, getDrivers } from './controller.js';

const router = express.Router();

router.post('/', createDriver);
router.get('/', getDrivers);

export default router;
