const Doctor = require("../models/doctor");
const bcrypt = require("bcryptjs");

/*Register Doctor*/
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

/* Replace Availability (PUT)  */
async function updateDoctorAvailability(req, res) {
    try {
        const { doctorID } = req.params;
        const { availability } = req.body;

        const doctor = await Doctor.findOne({ id: doctorID });
        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }

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

/* Partial Update Availability (PATCH)  */
async function patchDoctorAvailability(req, res) {
    try {
        const { doctorID } = req.params;
        const { availability } = req.body; 

        const doctor = await Doctor.findOne({ id: doctorID });
        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }

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

/* Logout Doctor  */
async function handleDoctorLogout(req, res) {
    res.clearCookie("uid", {
        httpOnly: true,
        secure: false,   
        sameSite: "lax",
        path: "/"        
    });

    return res.status(200).json({ message: "Doctor logged out successfully" });
}

async function getAllDoctors(req, res) {
    try {
        const doctors = await Doctor.find({}, { password: 0 });
        return res.status(200).json(doctors);
    } catch (error) {
        console.error("Error fetching doctors:", error);
        return res.status(500).json({ message: "Failed to fetch doctors list" });
    }
}

module.exports = {
    handleDoctorRegister,
    updateDoctorAvailability,
    patchDoctorAvailability,
    getDoctorAvailability,
    handleDoctorLogout,
    getAllDoctors
};