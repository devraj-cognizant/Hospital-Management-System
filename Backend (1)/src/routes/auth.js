
const express = require("express");
const router = express.Router();
const Patient = require("../models/patient");
const Doctor = require("../models/doctor");
const bcrypt = require("bcryptjs");
const { setUser } = require("../services/auth");

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        let user = await Patient.findOne({ email });
        let role = "PATIENT";
        let id = user ? user.patientID : null;

        if (!user) {
            user = await Doctor.findOne({ email });
            role = "DOCTOR";
            id = user ? user.id : null;
        }

        if (!user) {
            return res.status(401).json({ message: "Invalid Email or Password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid Email or Password" });
        }

        const payload = { id, email: user.email, role };
        const token = setUser(payload);

        // We are no longer setting a cookie here because we want manual header auth
        return res.status(200).json({
            message: "Login successful",
            token: token, // SEND TOKEN IN JSON
            role: role,
            user: {
                id: id,
                firstName: user.firstName || user.name,
                lastName: user.lastName || "",
                email: user.email
            }
        });
    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

module.exports = router;