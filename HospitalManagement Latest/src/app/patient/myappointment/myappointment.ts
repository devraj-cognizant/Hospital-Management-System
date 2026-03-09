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
        // Safe check: Handles data whether it comes inside an "appointments" property or as a direct list
        this.appointments = res.appointments || res || [];
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error("Error fetching appointments", err)
    });
  }

  get upcomingAppointments(): Appointment[] {
    return this.appointments.filter((a: any) => {
      const s = a.status?.toLowerCase() || '';
      
      // Safe check: Only split the date if the date actually exists in the database
      const apptDate = a.appointmentDate ? a.appointmentDate.split('T')[0] : '';
      
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
      // (Optional) You can capture the reason here if you want to send it to the backend later
      const reason = prompt('Please enter reason for cancellation:'); 
      if (reason !== null) {
        
        // ✅ Changed from doctorService to patientService!
        this.patientService.cancelAppointmentDB(appt.appointmentID).subscribe({
          next: () => {
            alert(`❌ Appointment cancelled successfully.`);
            this.loadPatientAppointments(); 
          },
          error: (err: any) => alert(`Error: ${err.error?.message}`)
        });
      }
    }
  }

  requestReschedule(appt: Appointment, event?: Event) {
    if (event) {
      event.preventDefault(); 
    }

    if (appt.rescheduleUsed) {
      alert('⚠️ Reschedule already used.');
      return;
    }
    
    if (window.confirm('Do you want to reschedule?')) {
      // ✅ Updated the path to exactly match your routing file
      this.router.navigate(['/patient/book'], { state: { rescheduleAppt: appt } });
    }
  }

  
}