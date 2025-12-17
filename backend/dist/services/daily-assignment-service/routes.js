import express from 'express';
import { assignVehicleForToday, getTodayAssignmentByDriver, } from './controller.js';
const router = express.Router();
router.post('/', assignVehicleForToday);
router.get('/driver/:driverId', getTodayAssignmentByDriver);
export default router;
