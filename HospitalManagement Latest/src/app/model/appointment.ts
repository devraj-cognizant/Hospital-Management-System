export interface Appointment {
  appointmentID: string;
  patientID: string;
  patientName?: string; // ✅ Add this line
  doctorID: string;
  appointmentDate: string;
  doctorName: string; // ✅ added
  specialization: string;
  time: string;
  reason: string;
  status: 'Requested' | 'Scheduled' | 'Cancelled' | 'Completed';
  notes?: string; // ✅ doctor’s notes
  diagnosis?: string; // ✅ optional
  prescription?: string; // ✅ optional
  rescheduleUsed?: boolean
}
 
 