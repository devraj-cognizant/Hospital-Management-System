const Doctor = require("../models/doctor");
const Appointment = require("../models/appointment");

/*  Get Doctor Appointments  */
/* Get Doctor Appointments  */
async function getDoctorAppointments(req, res) {
    try {
        const { doctorID } = req.params;

        const appointments = await Appointment.find({ doctorID });
        
        // ✅ THE FIX: Always return a 200 status, even if the array is empty!
        return res.status(200).json({ 
            appointments: appointments || [] 
        });
        
    } catch (error) {
        return res.status(500).json({ message: "Error fetching appointments", error: error.message });
    }
}

/*  Accept Appointment  */
/*  Accept Appointment  */
async function acceptAppointment(req, res) {
  try {
    const { appointmentID } = req.body;

    const appointment = await Appointment.findOne({ appointmentID });
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const doctor = await Doctor.findOne({ id: appointment.doctorID });
    if (!doctor) {
      return res.status(404).json({ message: "Associated Doctor not found" });
    }

    const date = new Date(appointment.appointmentDate).toISOString().split("T")[0];
    const time = appointment.time;

    // Access availability
    const dayAvailability = doctor.availability[date] || { available: [], blocked: [] };

    // First check if slot is available
    if (!dayAvailability.available.includes(time)) {
      return res.status(409).json({ message: "Slot not available or already booked" });
    }

    // Remove from available
    dayAvailability.available = dayAvailability.available.filter(slot => slot !== time);

    // Add to blocked
    if (!dayAvailability.blocked.includes(time)) {
      dayAvailability.blocked.push(time);
      dayAvailability.blocked.sort();
    }

    // Save doctor availability
    doctor.availability[date] = dayAvailability;
    doctor.markModified("availability");
    await doctor.save();

    // Update appointment status
    appointment.status = "Scheduled";
    await appointment.save();

    return res.status(200).json({
      message: "Appointment accepted and slot blocked",
      appointment,
      availability: doctor.availability[date]
    });
  } catch (error) {
    return res.status(500).json({ message: "Error accepting appointment", error: error.message });
  }
}


/* -------------------- Decline Appointment -------------------- */
async function declineAppointment(req, res) {
    try {
        const { appointmentID } = req.body;

        const appointment = await Appointment.findOne({ appointmentID });
        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        const doctor = await Doctor.findOne({ id: appointment.doctorID });
        if (!doctor) {
            return res.status(404).json({ message: "Associated Doctor not found" });
        }

        const date = new Date(appointment.appointmentDate).toISOString().split("T")[0];
        const time = appointment.time;

        // Access availability as plain object
        const dayAvailability = doctor.availability[date] || { available: [], blocked: [] };

        // Remove from blocked
        dayAvailability.blocked = dayAvailability.blocked.filter(slot => slot !== time);

        // Add back to available if not already present
        if (!dayAvailability.available.includes(time)) {
            dayAvailability.available.push(time);
            dayAvailability.available.sort();
        }

        // Save back into object
        doctor.availability[date] = dayAvailability;
        doctor.markModified("availability");   // <-- important for persistence
        await doctor.save();

        // Update appointment status
        appointment.status = "Cancelled";
        await appointment.save();

        return res.status(200).json({
            message: "Appointment declined and slot freed",
            appointment,
            availability: doctor.availability[date]
        });
    } catch (error) {
        return res.status(500).json({ message: "Error declining appointment", error: error.message });
    }
}

module.exports = {
    getDoctorAppointments,
    acceptAppointment,
    declineAppointment
};
