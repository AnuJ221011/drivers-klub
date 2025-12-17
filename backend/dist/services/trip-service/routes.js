import express from 'express';
import { createTrip, allotTrip, getTrips, updateTripStatus } from './controller.js';
const router = express.Router();
router.post('/', createTrip);
router.post('/allot', allotTrip);
router.get('/', getTrips);
router.patch('/status', updateTripStatus);
export default router;
