import express from 'express';
import { analyzeSymptoms } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/symptoms', protect, analyzeSymptoms);

export default router;
