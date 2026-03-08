import { PatientMedicalHistory } from "./patient-medical-history";
import { v4 as uuidv4 } from 'uuid';
 
export interface Patient {
  patientID: string; // unique identifier
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
  gender: string;
  bloodGroup: string;
  address: string;
  emergencyContact: string;
  password: string;
  // This creates the "slot" for the data.
  medicalHistory?: PatientMedicalHistory;
}