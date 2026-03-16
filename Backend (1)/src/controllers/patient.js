const Patient = require("../models/patient");
const Doctor = require("../models/doctor");
const Appointment = require("../models/appointment");
const Blacklist = require("../models/blacklist");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

/* Register Patient  */
async function handlePatientRegister(req, res) {
    try {
        const body = req.body;
         
        const existingUser = await Patient.findOne({ email: body.email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(body.password, salt);

        const newPatient = await Patient.create({
            ...body,
            password: hashedPassword,
        });

        return res.status(201).json({
            message: "Patient registered successfully",
            patientId: newPatient.patientID
        });

    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

// get the profile of the user which has logged in
async function handleGetProfile(req, res) {
    try {
        console.log("--- PROFILE DEBUG ---");
        console.log("Searching for patientID:", req.user.id); 

        const patient = await Patient.findOne({ patientID: req.user.id });

        console.log("Patient found in DB:", patient ? "SUCCESS" : "NOT FOUND");

        if (!patient) {
            return res.status(404).json({ message: "Patient not found in Database" });
        }

        return res.status(200).json(patient);
    } catch (error) {
        console.error("Controller Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
}

/* Update Patient Profile  */
async function handleUpdatePatientProfile(req, res) {
    try {
        const { email } = req.params;
        const updateData = req.body;

        const updatedPatient = await Patient.findOneAndUpdate(
            { email: email },
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedPatient) {
            return res.status(404).json({ message: "Patient not found" });
        }

        return res.status(200).json({
            message: "Profile updated successfully",
            user: updatedPatient
        });
    } catch (error) {
        return res.status(500).json({ message: "Error updating profile", error: error.message });
    }
}

/* Book Appointment  */
async function bookAppointment(req, res) {
    try {
        const { doctorID, patientID, appointmentDate, time, reason } = req.body;

        const patient = await Patient.findOne({ patientID });
        const doctor = await Doctor.findOne({ id: doctorID });

        if (!patient || !doctor) {
            return res.status(404).json({ message: "Patient or Doctor not found" });
        }

        // ✅ SECURITY RULE RE-ENABLED: Prevent booking same doctor if an active appointment exists
        const activeAppointment = await Appointment.findOne({
            patientID: patient.patientID,
            doctorID: doctor.id,
            status: { $in: ["Requested", "Scheduled", "Pending", "Rescheduled"] } 
        });

        if (activeAppointment) {
            return res.status(400).json({ 
                message: "You already have an active appointment with this doctor. Please wait until it is completed or cancel it to book again." 
            });
        }

        const normalizedDate = new Date(appointmentDate).toISOString().split("T")[0];

        // Access availability as plain object
        const dayAvailability = doctor.availability[normalizedDate];
        if (!dayAvailability || !dayAvailability.available.includes(time)) {
            return res.status(400).json({ message: `The time slot ${time} is not available on ${normalizedDate}` });
        }

        const appointmentID = "APT-" + uuidv4();
        const newAppointment = await Appointment.create({
            appointmentID,
            patientID: patient.patientID,
            patientName: `${patient.firstName} ${patient.lastName}`,
            doctorID: doctor.id,
            doctorName: doctor.name,
            specialization: doctor.specialization,
            appointmentDate: normalizedDate,
            time,
            reason,
            status: "Requested"
        });

        return res.status(201).json({
            message: "Appointment booked successfully",
            appointment: newAppointment
        });

    } catch (error) {
        return res.status(500).json({ message: "Error booking appointment", error: error.message });
    }
}

/* Reschedule Appointment  */
async function rescheduleAppointment(req, res) {
  try {
    const { appointmentID } = req.params;
    const { newDate, newTime } = req.body;

    const appointment = await Appointment.findOne({ appointmentID });
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (!["Requested", "Pending"].includes(appointment.status)) {
      return res.status(400).json({
        message: "Only requested appointments can be rescheduled before approval."
      });
    }

    const doctor = await Doctor.findOne({ id: appointment.doctorID });
    if (!doctor) {
      return res.status(404).json({ message: "Associated Doctor not found" });
    }

    const normalizedNewDate = new Date(newDate).toISOString().split("T")[0];

    const newDayAvailability = doctor.availability[normalizedNewDate] || { available: [], blocked: [] };
    if (!newDayAvailability.available.includes(newTime)) {
      return res.status(400).json({ message: `The new time slot ${newTime} on ${normalizedNewDate} is not available.` });
    }

    appointment.appointmentDate = new Date(newDate);
    appointment.time = newTime;
    appointment.status = "Requested"; 
    await appointment.save();

    return res.status(200).json({
      message: "Appointment request rescheduled successfully",
      appointment
    });

  } catch (error) {
    return res.status(500).json({ message: "Error rescheduling appointment", error: error.message });
  }
}

/* Logout Patient  */
async function handlePatientLogout(req, res) {
    try {
        const token = req.cookies?.uid || req.headers?.authorization?.split(" ")[1];

        if (token) {
            await Blacklist.create({ token });
        }

        res.clearCookie("uid", { httpOnly: true, sameSite: "lax" });

        return res.status(200).json({ message: "Patient logged out successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Error during logout", error: error.message });
    }
}

async function getPatientAppointments(req, res) {
    try {
        const { patientID } = req.params;
        const appointments = await Appointment.find({ patientID });

        return res.status(200).json({
            success: true,
            appointments: appointments
        });
    } catch (error) {
        console.error("Error fetching patient appointments:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

async function cancelAppointment(req, res) {
    try {
        const { appointmentID } = req.params;

        const appointment = await Appointment.findOne({ appointmentID });
        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        if (appointment.patientID !== req.user.id) {
            return res.status(403).json({ message: "You can only cancel your own appointments" });
        }

        const doctor = await Doctor.findOne({ id: appointment.doctorID });
        if (!doctor) {
            return res.status(404).json({ message: "Associated Doctor not found" });
        }

        const date = new Date(appointment.appointmentDate).toISOString().split("T")[0];
        const time = appointment.time;

        const dayAvailability = doctor.availability[date];
        if (dayAvailability) {
            dayAvailability.blocked = dayAvailability.blocked.filter(slot => slot !== time);

            if (!dayAvailability.available.includes(time)) {
                dayAvailability.available.push(time);
                dayAvailability.available.sort(); 
            }

            doctor.availability[date] = dayAvailability;
            doctor.markModified("availability"); 
            await doctor.save();
        }

        appointment.status = "Cancelled";
        await appointment.save();

        return res.status(200).json({
            message: "Appointment cancelled successfully",
            appointment
        });

    } catch (error) {
        return res.status(500).json({ message: "Error cancelling appointment", error: error.message });
    }
}

module.exports = {
    handlePatientRegister,
    handleUpdatePatientProfile,
    bookAppointment,
    rescheduleAppointment,
    handlePatientLogout,
    handleGetProfile,
    getPatientAppointments,
    cancelAppointment
};