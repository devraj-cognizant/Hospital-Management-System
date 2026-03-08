const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  patientID: {
    type: String,
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true
  },
  dob: {
    type: String, 
    required: true
  },
  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female', 'Other'] 
  },
  bloodGroup: {
    type: String,
    required: true
  },
  address: {
    type: String
  },
  emergencyContact: {
    type: String
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: 'PATIENT'
  },

  medicalHistory: {
    type: mongoose.Schema.Types.Mixed, 
    default: null
  }
}, { timestamps: true }); 

const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;