import express from 'express';
import { createVehicle, assignVehicleToDriver, getVehicles, } from './controller.js';
const router = express.Router();
router.post('/', createVehicle);
router.post('/assign', assignVehicleToDriver);
router.get('/', getVehicles);
export default router;
