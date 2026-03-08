const mongoose = require('mongoose');

const MedicalHistorySchema = new mongoose.Schema({
  historyID: { type: String, required: true, unique: true },
  // ✅ ADD THESE TWO FIELDS
  patientID: { type: String, required: true }, 
  patientName: { type: String, required: true },
  
  diagnosis: { type: String, required: true },
  treatment: { type: String, required: true },
  dateOfVisit: { type: Date, required: true },
  notes: { type: String },
  doctorID: { type: String },
  doctorName: { type: String },
  appointmentID: { type: String }
});

module.exports = mongoose.model('MedicalHistory', MedicalHistorySchema);