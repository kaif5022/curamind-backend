import express from 'express';
import { analyzeSymptoms, generatePrescription } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/symptoms', protect, analyzeSymptoms);
router.post('/prescription', protect, generatePrescription);

export default router;
