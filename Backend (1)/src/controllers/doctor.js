const Doctor = require("../models/doctor");
const bcrypt = require("bcryptjs");
const { setUser } = require("../services/auth");
const { handlePatientLogout } = require("./patient");

/* -------------------- Register Doctor -------------------- */
async function handleDoctorRegister(req, res) {
    try {
        const { id, name, specialization, email, password } = req.body;

        const existingDoctor = await Doctor.findOne({ $or: [{ email }, { id }] });
        if (existingDoctor) {
            return res.status(400).json({ message: "Doctor ID or Email already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newDoctor = await Doctor.create({
            id,
            name,
            specialization,
            email,
            password: hashedPassword
        });

        return res.status(201).json({
            message: "Doctor registered successfully",
            id: newDoctor.id
        });

    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

/* -------------------- Login Doctor -------------------- */
/* -------------------- Login Doctor -------------------- */
async function handleDoctorLogin(req, res) {
    try {
        const { email, password } = req.body;

        const doctor = await Doctor.findOne({ email });
        if (!doctor) {
            return res.status(401).json({ message: "Invalid email or password. Please try again." });
        }

        const isMatch = await bcrypt.compare(password, doctor.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password. Please try again." });
        }

        // 1. Create a payload that includes the role!
        const payload = {
            id: doctor.id,
            email: doctor.email,
            role: "DOCTOR" 
        };

        // 2. Generate token
        const token = setUser(payload);

        // 3. Set the Secure HttpOnly Cookie
        res.cookie("uid", token, {
            httpOnly: true,  // 🛡️ Completely hides the cookie from JavaScript / Hackers
            secure: false,   // ⚠️ Set to true in Production when you have HTTPS
            sameSite: "lax", // Prevents CSRF attacks
            maxAge: 24 * 60 * 60 * 1000 // Expires in 24 hours
        });

        // 🚀 THE FIX: You accidentally deleted this block! 
        // Without this, Angular waits forever and nothing happens.
        return res.status(200).json({
            message: "Login successful",
            id: doctor.id,
            name: doctor.name,
            specialization: doctor.specialization
        });

    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

/* -------------------- Replace Availability (PUT) -------------------- */
async function updateDoctorAvailability(req, res) {
    try {
        const { doctorID } = req.params;
        const { availability } = req.body; // Expect full availability object

        const doctor = await Doctor.findOne({ id: doctorID });
        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }

        // Replace entire availability map
        doctor.availability = availability;
        await doctor.save();

        return res.status(200).json({
            message: "Availability replaced successfully",
            availability: doctor.availability
        });

    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

/* -------------------- Partial Update Availability (PATCH) -------------------- */
async function patchDoctorAvailability(req, res) {
    try {
        const { doctorID } = req.params;
        const { availability } = req.body; // Expect partial availability object

        const doctor = await Doctor.findOne({ id: doctorID });
        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }

        // Merge new availability into existing object
        doctor.availability = {
            ...doctor.availability,
            ...availability
        };

        await doctor.save();

        return res.status(200).json({
            message: "Availability updated successfully",
            availability: doctor.availability
        });

    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

/* -------------------- Get Availability -------------------- */
async function getDoctorAvailability(req, res) {
    try {
        const { doctorID } = req.params;

        const doctor = await Doctor.findOne({ id: doctorID });
        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }

        return res.status(200).json({ availability: doctor.availability });

    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

/* -------------------- Logout Doctor -------------------- */
async function handleDoctorLogout(req, res) {
    // Clear the doctor's cookie
    res.clearCookie("uid", {
  httpOnly: true,
  secure: false,   // must match what you set
  sameSite: "lax",
  path: "/"        // always include path
});

    return res.status(200).json({ message: "Doctor logged out successfully" });
}

async function getAllDoctors(req, res) {
    try {
        // Fetch all doctors but exclude their passwords and sensitive data
        const doctors = await Doctor.find({}, { password: 0 });

        return res.status(200).json(doctors);
    } catch (error) {
        console.error("Error fetching doctors:", error);
        return res.status(500).json({ message: "Failed to fetch doctors list" });
    }
}

// Example Node.js logic
const addMedicalHistory = async (req, res) => {
    const { appointmentID, diagnosis, treatment, notes } = req.body;

    // 1. Save History
    const newHistory = await MedicalHistory.create({ ...req.body });

    // 2. IMPORTANT: Update the status in the Appointment collection!
    await Appointment.findOneAndUpdate(
        { appointmentID: appointmentID },
        { status: 'Completed', notes: notes } // Also pass notes so patient can see them
    );

    res.status(201).json({ message: "History saved and appointment completed!" });
};

module.exports = {
    handleDoctorLogin,
    handleDoctorRegister,
    updateDoctorAvailability,
    patchDoctorAvailability,
    getDoctorAvailability,
    handleDoctorLogout,
    getAllDoctors,
    addMedicalHistory
};
