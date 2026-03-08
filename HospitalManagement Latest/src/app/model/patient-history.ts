export interface MedicalHistory {
  historyID: string;
  diagnosis: string;
  treatment: string;
  dateOfVisit: Date;
  notes?: string;
  doctorID?: string;
  doctorName?: string;
  appointmentID?: string;
}

export interface PatientRecord {
  id: string;
  name: string;
  age: number;
  gender: string;
  contact: string;
  history: MedicalHistory[];
}

export const PATIENTS_WITH_HISTORY: PatientRecord[] = [
  {
    id: 'P001',
    name: 'Ayesha Khan',
    age: 34,
    gender: 'Female',
    contact: 'ayesha@example.com',
    history: [
      {
        historyID: 'MH001',
        diagnosis: 'Type 2 Diabetes',
        treatment: 'Metformin 500mg daily',
        dateOfVisit: new Date('2025-11-10'),
        notes: 'Blood sugar levels improving.'
      },
    ]
  },
  {
    id: 'P002',
    name: 'Ravi Sharma',
    age: 45,
    gender: 'Male',
    contact: 'ravi@example.com',
    history: [
      {
        historyID: 'MH002',
        diagnosis: 'Hypertension',
        treatment: 'Amlodipine 5mg daily',
        dateOfVisit: new Date('2025-12-05'),
        notes: 'BP stable with medication.'
      },
    ]
  },
];
