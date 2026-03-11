const express = require("express");
const router = express.Router();
const Patient = require("../models/patient");
const Doctor = require("../models/doctor");
const bcrypt = require("bcryptjs");
const { setUser } = require("../services/auth");

// UNIFIED LOGIN ROUTE
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Check if the user is a Patient
        let user = await Patient.findOne({ email });
        let role = "PATIENT";
        let id = user ? user.patientID : null;

        // 2. If not a Patient, check if they are a Doctor
        if (!user) {
            user = await Doctor.findOne({ email });
            role = "DOCTOR";
            id = user ? user.id : null;
        }

        // 3. If STILL no user, the email doesn't exist in either database
        if (!user) {
            return res.status(401).json({ message: "Invalid Email or Password" });
        }

        // 4. Verify Password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid Email or Password" });
        }

        // 5. Generate Token Payload based on who logged in
        const payload = {
            id: id,
            email: user.email,
            role: role
        };

        const token = setUser(payload);

        // 6. Set Secure Cookie
        res.cookie("uid", token, {
            httpOnly: true,
            secure: false, // Set to true in prod with HTTPS
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000
        });

        // 7. Send Response back to Angular
        return res.status(200).json({
            message: "Login successful",
            role: role,
            user: {
                id: id,
                firstName: user.firstName || user.name, // Patients have firstName, Doctors have name
                lastName: user.lastName || "",
                specialization: user.specialization || null,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Unified Login Error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

module.exports = router;