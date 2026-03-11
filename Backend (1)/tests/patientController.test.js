const { expect } = require('chai');
const sinon = require('sinon');
const Patient = require('../src/models/patient'); // Path to your model
const patientController = require('../src/controllers/patient'); // Path to your controller

describe('Patient Controller Tests', () => {
    let req, res, statusStub, jsonStub;

    beforeEach(() => {
        // Setup mock request and response
        req = { body: {}, params: {}, user: {} };
        
        // Mocking res.status().json() chaining
        jsonStub = sinon.stub();
        statusStub = sinon.stub().returns({ json: jsonStub });
        res = { status: statusStub };
    });

    afterEach(() => {
        sinon.restore(); // Clean up stubs after every test
    });

    /* --- Register Patient Tests --- */
    describe('handlePatientRegister', () => {
        it('should return 400 if the email already exists', async () => {
            req.body = { email: "existing@test.com", password: "123" };

            // Stub Patient.findOne to return a "user" (meaning email exists)
            sinon.stub(Patient, 'findOne').resolves({ email: "existing@test.com" });

            await patientController.handlePatientRegister(req, res);

            expect(statusStub.calledWith(400)).to.be.true;
            expect(jsonStub.calledWith({ message: "Email already registered" })).to.be.true;
        });

        it('should return 201 and register patient if details are valid', async () => {
            req.body = { email: "new@test.com", password: "123", firstName: "John" };

            sinon.stub(Patient, 'findOne').resolves(null); // No existing user
            sinon.stub(Patient, 'create').resolves({ patientID: "PAT-123" });

            await patientController.handlePatientRegister(req, res);

            expect(statusStub.calledWith(201)).to.be.true;
            expect(jsonStub.args[0][0].message).to.equal("Patient registered successfully");
        });
    });

    /* --- Get Profile Tests --- */
    describe('handleGetProfile', () => {
        it('should return 200 and patient data if found', async () => {
            // Mock the middleware behavior (attaching user to req)
            req.user = { id: "4c02fc42" };
            
            const mockPatient = { patientID: "4c02fc42", firstName: "Devraj" };
            sinon.stub(Patient, 'findOne').resolves(mockPatient);

            await patientController.handleGetProfile(req, res);

            expect(statusStub.calledWith(200)).to.be.true;
            expect(jsonStub.calledWith(mockPatient)).to.be.true;
        });

        it('should return 404 if patient is not found in database', async () => {
            req.user = { id: "wrong-id" };
            sinon.stub(Patient, 'findOne').resolves(null);

            await patientController.handleGetProfile(req, res);

            expect(statusStub.calledWith(404)).to.be.true;
            expect(jsonStub.calledWith({ message: "Patient not found in Database" })).to.be.true;
        });
    });
});