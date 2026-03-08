import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { Patient } from '../../model/patient';
import { Appointment } from '../../model/appointment';
import { DoctorService } from '../../services/doctor';
import { PatientService } from '../../services/patient-service';
import { PatientMedicalHistory } from '../../model/patient-medical-history';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './patient-dashboard.html',
  styleUrls: ['./patient-dashboard.css']
})
export class PatientDashboard {
  rescheduleAppt: Appointment | null = null;

  constructor(
    private router: Router,
    private doctorService: DoctorService,
    private patientService: PatientService
    
  ) {}

  // ✅ Patient info always comes from PatientService
  get patient(): Patient | null {
    return this.patientService.getLoggedInPatient();
  }

  // ✅ Appointments always come from DoctorService
  get appointments(): Appointment[] {
    return this.doctorService.getAllAppointments()
      .filter(a => a.patientID === this.patient?.patientID);
  }

  // ✅ Medical history comes from PatientService
  get medicalHistory(): PatientMedicalHistory | undefined {
    return this.patientService.getMedicalHistory();
  }

  // ✅ Update profile segment
  updateProfile(updated: Patient) {
    this.patientService.updateProfile(updated);
  }

  // ✅ Update medical  history segment
  saveMedicalHistory(history: PatientMedicalHistory) {
    this.patientService.saveMedicalHistory(history);
  }

  // ✅ Appointment management
  addAppointment(appt: Appointment) {
    this.doctorService.addAppointment(appt);
    this.rescheduleAppt = null;
  }

  handleReschedule(appt: Appointment) {
    this.rescheduleAppt = appt;
    this.router.navigate(['/patient/book'], { state: { appt } });
  }

  handleCancel(appt: Appointment) {
    this.doctorService.cancelAppointment(appt, appt.reason ?? 'Cancelled by patient');
  }

  // ✅ Logout clears patient state
  logout() {
  // ✅ We must .subscribe() or the HTTP request won't fire!
  this.patientService.logout().subscribe({
    next: () => {
      alert('Logged out successfully');
      this.router.navigate(['/home']);
    },
    error: (err) => {
      console.error('Logout failed', err);
      // Force local cleanup if the server is unreachable
      this.patientService.clearLocalSession();
      this.router.navigate(['/home']);
    }
  });
}
}
