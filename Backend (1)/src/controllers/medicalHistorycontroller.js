const MedicalHistory = require("../models/medicalHistory");
const Patient = require("../models/patient");
const Appointment = require("../models/appointment");

// 1️⃣ The Add History Function
// 1️⃣ The Add History Function
async function addMedicalHistory(req, res) {
    try {
        const { doctorID } = req.params;
        const { appointmentID, diagnosis, treatment, notes, doctorName } = req.body;

        // 🔍 STEP 1: Look up the appointment to safely get the Patient ID and Name
        const appointment = await Appointment.findOne({ appointmentID: appointmentID });
        
        if (!appointment) {
            return res.status(404).json({ message: "Could not find the matching appointment." });
        }

        // 📝 STEP 2: Create new history record using the data we found
        const newHistory = new MedicalHistory({
            historyID: "MH" + Date.now(),
            patientID: appointment.patientID,       // ✅ Pulled securely from DB
            patientName: appointment.patientName,   // ✅ Pulled securely from DB
            diagnosis: diagnosis,
            treatment: treatment,
            dateOfVisit: new Date(),
            notes: notes,
            doctorID: doctorID,
            doctorName: doctorName,
            appointmentID: appointmentID
        });

        await newHistory.save();

        // 🔄 STEP 3: Update the Appointment status to 'Completed'
        await Appointment.findOneAndUpdate(
            { appointmentID: appointmentID },
            { status: 'Completed' }
        );

        return res.status(201).json({ message: "Medical history saved and appointment completed", history: newHistory });
    } catch (error) {
        console.error("Error saving history:", error);
        return res.status(500).json({ message: "Error saving medical history", error: error.message });
    }
}

// 2️⃣ The Get History Function
async function getDoctorHistory(req, res) {
    try {
        const { doctorID } = req.params;
        const histories = await MedicalHistory.find({ doctorID }).sort({ dateOfVisit: -1 });

        if (!histories || histories.length === 0) {
            return res.status(200).json({ histories: [] });
        }

        const patientMap = {};

        for (const h of histories) {
            if (!patientMap[h.patientID]) {
                const patientData = await Patient.findOne({ patientID: h.patientID });

                patientMap[h.patientID] = {
                    id: h.patientID,
                    name: h.patientName || (patientData ? `${patientData.firstName} ${patientData.lastName}` : "Unknown Patient"),
                    age: (patientData && patientData.dob) ? calculateAge(patientData.dob) : "N/A",
                    gender: patientData ? (patientData.gender || "N/A") : "N/A",
                    contact: patientData ? (patientData.phone || "N/A") : "N/A",
                    history: []
                };
            }
            patientMap[h.patientID].history.push(h);
        }

        return res.status(200).json({ histories: Object.values(patientMap) });

    } catch (error) {
        console.error("❌ Error in getDoctorHistory:", error);
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
}

// 3️⃣ The Age Helper Function
function calculateAge(dob) {
    if (!dob) return "N/A";
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return "N/A"; 
    
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

// ✅ EXPORT BOTH FUNCTIONS
module.exports = { addMedicalHistory, getDoctorHistory };