const { expect } = require('chai');
const MedicalHistory = require('../src/models/medicalHistory'); // Adjust path if needed

describe('Medical History Model Validation Tests', () => {

    it('should throw a validation error if patientID is missing', () => {
        // 1. Arrange: Create a history record but purposely forget the patientID
        const badHistory = new MedicalHistory({
            historyID: "MH12345",
            diagnosis: "Fever",
            treatment: "Rest",
            // Notice: patientID is completely missing!
        });

        // 2. Act: Force Mongoose to validate it synchronously
        const error = badHistory.validateSync();

        // 3. Assert: Chai expects an error to exist
        expect(error).to.exist;
        expect(error.errors.patientID).to.exist;
        expect(error.errors.patientID.message).to.equal('Path `patientID` is required.');
    });

    it('should pass validation if all required fields are provided', () => {
        // 1. Arrange: Create a truly perfect record based on your Schema
        const goodHistory = new MedicalHistory({
            historyID: "MH12345",
            patientID: "PAT-001",
            patientName: "Devraj Sharma",
            diagnosis: "Fever",
            treatment: "Rest and hydration", // ✅ ADDED THIS
            dateOfVisit: new Date(),         // ✅ ADDED THIS (Often required)
            doctorID: "DOC-101",
            doctorName: "Dr. Smith",
            appointmentID: "APT-999"
        });

        // 2. Act
        const error = goodHistory.validateSync();

        // 🚀 DEBUG TRICK: If it still fails, this will tell you EXACTLY which field is missing!
        if (error) {
            console.log("Mongoose is complaining about:", Object.keys(error.errors));
        }

        // 3. Assert: Chai expects NO errors
        expect(error).to.be.undefined;
    });

});