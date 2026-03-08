const mongoose=require('mongoose')
const AppointmentSchema = new mongoose.Schema({
  appointmentID: { type: String, required: true, unique: true },
  patientID: { type: String, required: true },
  patientName: { type: String },
  doctorID: { type: String, required: true },
  appointmentDate: { type: Date, required: true },
  doctorName: { type: String, required: true },
  specialization: { type: String, required: true },
  time: { type: String, required: true },
  reason: { type: String, required: true },
  status: {
    type: String,
    enum: ["Requested", "Rescheduled","Scheduled", "Cancelled", "Completed"],
    default: "Requested",
  },
  notes: { type: String },
  diagnosis: { type: String },
  prescription: { type: String },
  rescheduleUsed: { type: Boolean, default: false },
});

const Appointment = mongoose.model("Appointment", AppointmentSchema);

module.exports = Appointment;
