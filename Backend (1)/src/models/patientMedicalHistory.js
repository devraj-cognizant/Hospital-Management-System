import mongoose from 'mongoose';

const PatientMedicalHistorySchema = new mongoose.Schema({
  medicalCondition: { type: String },
  allergies: { type: String },
  currentMedications: { type: String },
  pastSurgeries: { type: String }
});

export default PatientMedicalHistorySchema; // Export schema only (embedded use)
