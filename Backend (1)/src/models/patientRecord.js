import mongoose from 'mongoose';
import MedicalHistorySchema from './medicalHistory.js';

const PatientRecordSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  contact: { type: String, required: true },
  history: [MedicalHistorySchema] // Embedded medical history
});

export default mongoose.model('PatientRecord', PatientRecordSchema);
