import express from 'express';
import {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient,
} from '../controllers/patientController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, upload.fields([{ name: 'photos', maxCount: 3 }, { name: 'slips', maxCount: 3 }]), createPatient)
  .get(protect, getPatients);

router.route('/:id')
  .get(protect, getPatientById)
  .put(protect, upload.fields([{ name: 'photos', maxCount: 3 }, { name: 'slips', maxCount: 3 }]), updatePatient)
  .delete(protect, deletePatient);

export default router;
