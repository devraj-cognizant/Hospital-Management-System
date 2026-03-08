import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Appointment } from '../../model/appointment';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DoctorService } from '../../services/doctor';
import { PatientService } from '../../services/patient-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-myappointment',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './myappointment.html',
  styleUrls: ['./myappointment.css'],
})
export class Myappointment implements OnInit {
  today: string = new Date().toISOString().split('T')[0];
  appointments: Appointment[] = [];

  constructor(
    private doctorService: DoctorService,
    private patientService: PatientService,
    private router: Router,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit() {
    this.loadPatientAppointments();
  }

  loadPatientAppointments() {
    const patient = this.patientService.getLoggedInPatient();
    if (!patient) return;

    this.patientService.getPatientAppointmentsDB(patient.patientID).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.appointments = res.appointments || [];
          this.cdr.detectChanges();
        }, 0);
      },
      error: (err: any) => console.error("Error fetching appointments", err)
    });
  }

  // ✅ Added :any to parameters to satisfy strict mode
  get upcomingAppointments(): Appointment[] {
    return this.appointments.filter((a: any) => {
      const s = a.status?.toLowerCase() || '';
      const apptDate = a.appointmentDate.split('T')[0];
      return (s === 'requested' || s === 'scheduled' || s === 'pending') && apptDate >= this.today;
    });
  }

  get completedAppointments(): Appointment[] {
    return this.appointments.filter((a: any) => a.status?.toLowerCase() === 'completed');
  }

  get cancelledAppointments(): Appointment[] {
    return this.appointments.filter((a: any) => a.status?.toLowerCase() === 'cancelled');
  }

  promptCancel(appt: Appointment) {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      const reason = prompt('Please enter reason for cancellation:');
      if (reason !== null) {
        this.doctorService.declineAppointmentDB(appt.appointmentID).subscribe({
          next: () => {
            alert(`❌ Appointment cancelled successfully.`);
            this.loadPatientAppointments(); 
          },
          error: (err: any) => alert(`Error: ${err.error?.message}`)
        });
      }
    }
  }

  requestReschedule(appt: Appointment) {
    if (appt.rescheduleUsed) {
      alert('⚠️ Reschedule already used.');
      return;
    }
    if (window.confirm('Do you want to reschedule?')) {
      this.router.navigate(['/patient-dashboard/book'], { state: { rescheduleAppt: appt } });
    }
  }
}