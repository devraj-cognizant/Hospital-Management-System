const express = require("express");
const {
  handlePatientLogin,
  handlePatientRegister,
  handleUpdatePatientProfile,
  bookAppointment,
  handleGetProfile,
  rescheduleAppointment,
  handlePatientLogout,
  getPatientAppointments,
  cancelAppointment
} = require("../controllers/patient");

const {getPatientMedicalHistory}=require("../controllers/medicalHistorycontroller");

// Import the middlewares

const { restrictToLoggedInUserOnly, restrictToRoles } = require("../middlewares/auth");

const router = express.Router();

// --------------------------------------------------
// PUBLIC ROUTES (No login required)
// --------------------------------------------------
router.post("/login", handlePatientLogin);
router.post("/register", handlePatientRegister);

// --------------------------------------------------
// 🛑 MIDDLEWARE BARRIER
// Everything below this line requires a valid login AND the 'PATIENT' role
// --------------------------------------------------
router.use(restrictToLoggedInUserOnly);
router.use(restrictToRoles(["PATIENT"]));

// --------------------------------------------------
// 🔒 PROTECTED PATIENT ROUTES
// --------------------------------------------------
// Profile
router.patch("/update/:email", handleUpdatePatientProfile);

// Appointments
router.post("/book-appointment", bookAppointment);

// Use PATCH for partial updates like changing date/time
router.patch("/appointment/:appointmentID", rescheduleAppointment);

// ✅ Add this route to fetch the profile
router.get("/profile", handleGetProfile);

router.post("/logout", handlePatientLogout);


// Inside routes/patient.js

// ✅ Add this route
router.get("/:patientID/appointments", getPatientAppointments);
router.get("/:patientID/medical-history", getPatientMedicalHistory);
// Add this near your other Protected Patient Routes
router.patch("/appointment/:appointmentID/cancel", cancelAppointment);
module.exports = router;