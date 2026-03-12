const express = require("express");
const {
  handleDoctorRegister,
  updateDoctorAvailability,
  patchDoctorAvailability,
  getDoctorAvailability,
  handleDoctorLogout,
  getAllDoctors,
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

const { restrictToLoggedInUserOnly, restrictToRoles } = require("../middlewares/auth");

const router = express.Router();

// PUBLIC ROUTES (Accessible by Patients & Guests)
router.post("/register", handleDoctorRegister);
router.get("/all", getAllDoctors);
router.get("/:doctorID/availability", getDoctorAvailability);

// MIDDLEWARE BARRIER
// Everything below this line requires a valid login AND the 'DOCTOR' role
router.use(restrictToLoggedInUserOnly);
router.use(restrictToRoles(["DOCTOR"]));

// PROTECTED DOCTOR ROUTES
router.put("/:doctorID/availability", updateDoctorAvailability);
router.patch("/:doctorID/availability", patchDoctorAvailability);
router.get("/:doctorID/appointments", getDoctorAppointments);
router.patch("/appointments/accept", acceptAppointment);
router.patch("/appointments/decline", declineAppointment);
router.post("/:doctorID/medicalhistory", addMedicalHistory);
router.get("/:doctorID/medicalhistory", getDoctorHistory);
router.post("/logout", handleDoctorLogout);

module.exports = router;