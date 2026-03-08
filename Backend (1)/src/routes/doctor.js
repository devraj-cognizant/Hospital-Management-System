const express = require("express");
const {
  handleDoctorLogin,
  handleDoctorRegister,
  updateDoctorAvailability,
  patchDoctorAvailability,
  getDoctorAvailability,
  handleDoctorLogout,
  getAllDoctors, // ✅ Added this new import!
  
} = require("../controllers/doctor");

const {
  getDoctorAppointments,
  acceptAppointment,
  declineAppointment,
} = require("../controllers/doctorAppointment");

const {
  addMedicalHistory,
  getDoctorHistory,
} = require("../controllers/medicalHistorycontroller");

// ✅ Import the middlewares
const { restrictToLoggedInUserOnly, restrictToRoles } = require("../middlewares/auth");

const router = express.Router();

// --------------------------------------------------
// 🔓 PUBLIC ROUTES (Accessible by Patients & Guests)
// --------------------------------------------------
router.post("/register", handleDoctorRegister);
router.post("/login", handleDoctorLogin);

// ✅ MOVED: Patients need to fetch the list of doctors to book them
router.get("/all", getAllDoctors);

// ✅ MOVED: Patients need to see availability to pick a time slot
router.get("/:doctorID/availability", getDoctorAvailability);

// --------------------------------------------------
// 🛑 MIDDLEWARE BARRIER
// Everything below this line requires a valid login AND the 'DOCTOR' role
// --------------------------------------------------
router.use(restrictToLoggedInUserOnly);
router.use(restrictToRoles(["DOCTOR"]));

// --------------------------------------------------
// 🔒 PROTECTED DOCTOR ROUTES
// --------------------------------------------------
// Availability (Doctors updating their own schedule)
router.put("/:doctorID/availability", updateDoctorAvailability);
router.patch("/:doctorID/availability", patchDoctorAvailability);

// Appointments
router.get("/:doctorID/appointments", getDoctorAppointments);
router.patch("/appointments/accept", acceptAppointment);
router.patch("/appointments/decline", declineAppointment);

// Medical History
router.post("/:doctorID/medicalhistory", addMedicalHistory);
router.get("/:doctorID/medicalhistory", getDoctorHistory);

// Logout
router.post("/logout", handleDoctorLogout);

module.exports = router;