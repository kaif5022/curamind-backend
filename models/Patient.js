import mongoose from 'mongoose';

const patientSchema = mongoose.Schema(
  {
    fullName: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] },
    mobileNumber: { type: String, required: true },
    address: { type: String },
    bloodGroup: { type: String },
    weight: { type: Number },
    height: { type: Number },
    symptoms: { type: String },
    diagnosis: { type: String },
    prescription: { type: String },
    medicines: { type: String },
    followUpDate: { type: Date },
    doctorNotes: { type: String },
    patientPhoto: { type: String }, // Path to the uploaded image
    photos: [{ type: String }], // Array of patient photos
    slips: [{ type: String }], // Array of slip images
    slipNumber: { type: String, unique: true },
    patientVisitNumber: { type: String },
    visitDate: { type: Date, default: Date.now },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

const Patient = mongoose.model('Patient', patientSchema);
export default Patient;
