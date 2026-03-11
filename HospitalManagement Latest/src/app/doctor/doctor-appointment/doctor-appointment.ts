import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Appointment } from '../../model/appointment';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DoctorService } from '../../services/doctor';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-doctor-appointment',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './doctor-appointment.html',
  styleUrls: ['./doctor-appointment.css'],
})
export class DoctorAppointment implements OnInit {
  doctorID: string = '';
  appointments: Appointment[] = [];

  constructor(
    private doctorService: DoctorService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef // ✅ ADDED THIS
  ) {}

  ngOnInit() {
    this.doctorService.currentDoctor$.subscribe(doctor => {
      const foundId = doctor?.id || (doctor as any)?._id || this.route.parent?.snapshot.paramMap.get('id');
      
      if (foundId) {
        this.doctorID = foundId;
        this.loadAppointments();
      }
    });
  }

  loadAppointments() {
    if (!this.doctorID) return;
    
    this.doctorService.getAppointmentsFromDB(this.doctorID).subscribe({
      next: (res: any) => {
        // Wrap in a tiny timeout and call detectChanges so Angular draws the screen!
        setTimeout(() => {
          this.appointments = res.appointments || [];
          this.cdr.detectChanges(); 
        }, 0);
      },
      error: (err: any) => console.error("❌ Failed to load appointments", err)
    });
  }

  // ✅ Bulletproof getters for status checking
  get requests(): Appointment[] {
    return this.appointments.filter(a => {
      const s = a.status?.toLowerCase() || '';
      return s === 'requested' || s === 'pending';
    });
  }

  get upcoming(): Appointment[] {
    return this.appointments.filter(a => {
      const s = a.status?.toLowerCase() || '';
      return s === 'scheduled' || s === 'accepted' ;
    });
  }

  get past(): Appointment[] {
    return this.appointments.filter(a => {
      const s = a.status?.toLowerCase() || '';
      return s === 'completed' || s === 'done';
    });
  }

  get cancelled(): Appointment[] {
    return this.appointments.filter(a => {
      const s = a.status?.toLowerCase() || '';
      return s === 'cancelled' || s === 'declined';
    });
  }

  approve(appt: Appointment) {
    this.doctorService.acceptAppointmentDB(appt.appointmentID).subscribe({
      next: () => {
        alert(`✅ Appointment Approved!`);
        this.loadAppointments(); 
      },
      error: (err: any) => alert(`❌ Error: ${err.error?.message}`)
    });
  }

  cancel(appt: Appointment) {
    if(window.confirm(`Are you sure you want to decline this appointment?`)) {
      this.doctorService.declineAppointmentDB(appt.appointmentID).subscribe({
        next: () => {
          alert('🚫 Appointment Declined!');
          this.loadAppointments(); 
        },
        error: (err: any) => alert(`❌ Error: ${err.error?.message}`)
      });
    }
  }

  complete(appt: Appointment): void {
    this.router.navigate(['/doctor', this.doctorID, 'history-form', appt.appointmentID]);
  }

// ... (keep the rest of your DoctorAppointment class the same)

  // FIXED: Add event parameter and preventDefault
  viewNotes(appt: Appointment, event?: Event) {
    if (event) {
      event.preventDefault(); // Stops the href="#" from jumping to the top of the page
    }
    alert(`Doctor's Notes:\n${appt.notes || 'No notes available.'}`);
  }

  

  
}