import Patient from '../models/Patient.js';

// Helper to generate next slip number
const generateSlipNumber = async () => {
  const lastPatient = await Patient.findOne({ slipNumber: { $exists: true } }).sort({ createdAt: -1 });
  if (lastPatient && lastPatient.slipNumber) {
    const lastNumber = parseInt(lastPatient.slipNumber.split('-')[1]);
    if (!isNaN(lastNumber)) {
      return `SLIP-${lastNumber + 1}`;
    }
  }
  return 'SLIP-1001';
};

// @desc    Create new patient
// @route   POST /api/patients
// @access  Private
export const createPatient = async (req, res, next) => {
  try {
    const {
      fullName, age, gender, mobileNumber, address, bloodGroup,
      weight, height, symptoms, diagnosis, prescription, medicines,
      followUpDate, doctorNotes, visitDate
    } = req.body;

    let slipNumber = req.body.slipNumber;
    if (!slipNumber) {
      slipNumber = await generateSlipNumber();
    }
    const photos = req.files && req.files.photos ? req.files.photos.map(file => file.path) : [];
    const slips = req.files && req.files.slips ? req.files.slips.map(file => file.path) : [];

    const patient = new Patient({
      fullName, age, gender, mobileNumber, address, bloodGroup,
      weight, height, symptoms, diagnosis, prescription, medicines,
      followUpDate, doctorNotes, visitDate, photos, slips, slipNumber,
      createdBy: req.user._id,
    });

    const createdPatient = await patient.save();
    res.status(201).json(createdPatient);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all patients (with search and filter)
// @route   GET /api/patients
// @access  Private
export const getPatients = async (req, res, next) => {
  try {
    const { search, date } = req.query;
    let query = {};

    // Only allow doctors to see their own patients, or all if admin (simplified: all for now if authenticated)
    // Optional: query.createdBy = req.user._id;

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { slipNumber: { $regex: search, $options: 'i' } }
      ];
      if (search.match(/^[0-9a-fA-F]{24}$/)) {
        query.$or.push({ _id: search });
      }
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      query.visitDate = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }

    const patients = await Patient.find(query).sort({ createdAt: -1 });
    res.json(patients);
  } catch (error) {
    next(error);
  }
};

// @desc    Get patient by ID
// @route   GET /api/patients/:id
// @access  Private
export const getPatientById = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (patient) {
      res.json(patient);
    } else {
      res.status(404);
      throw new Error('Patient not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update patient
// @route   PUT /api/patients/:id
// @access  Private
export const updatePatient = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (patient) {
      patient.fullName = req.body.fullName || patient.fullName;
      patient.age = req.body.age || patient.age;
      patient.gender = req.body.gender || patient.gender;
      patient.mobileNumber = req.body.mobileNumber || patient.mobileNumber;
      patient.address = req.body.address || patient.address;
      patient.bloodGroup = req.body.bloodGroup || patient.bloodGroup;
      patient.weight = req.body.weight || patient.weight;
      patient.height = req.body.height || patient.height;
      patient.symptoms = req.body.symptoms || patient.symptoms;
      patient.diagnosis = req.body.diagnosis || patient.diagnosis;
      patient.prescription = req.body.prescription || patient.prescription;
      patient.medicines = req.body.medicines || patient.medicines;
      patient.followUpDate = req.body.followUpDate || patient.followUpDate;
      patient.doctorNotes = req.body.doctorNotes || patient.doctorNotes;
      
      if (req.files && req.files.photos) {
        patient.photos = [...(patient.photos || []), ...req.files.photos.map(file => file.path)];
      }
      if (req.files && req.files.slips) {
        patient.slips = [...(patient.slips || []), ...req.files.slips.map(file => file.path)];
      }

      const updatedPatient = await patient.save();
      res.json(updatedPatient);
    } else {
      res.status(404);
      throw new Error('Patient not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Delete patient
// @route   DELETE /api/patients/:id
// @access  Private
export const deletePatient = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (patient) {
      await patient.deleteOne();
      res.json({ message: 'Patient removed' });
    } else {
      res.status(404);
      throw new Error('Patient not found');
    }
  } catch (error) {
    next(error);
  }
};
