import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router'; // Removed Router
import { Location } from '@angular/common'; //IMPORT LOCATION
import { DoctorService } from '../../services/doctor';
import { MedicalHistoryService } from '../../services/medical-history';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-medical-history-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './medical-history-form.html',
  styleUrls: ['./medical-history-form.css'],
})
export class MedicalHistoryFormComponent implements OnInit {
  appointmentID: string | null = null;
  doctorID: string = '';
  patientName: string = 'Patient';
  formData = { diagnosis: '', treatment: '', notes: '' };

  constructor(
    private route: ActivatedRoute,
    private location: Location, // INJECT LOCATION HERE
    private doctorService: DoctorService,
    private historyService: MedicalHistoryService
  ) {}

  ngOnInit() {
    this.appointmentID = this.route.snapshot.paramMap.get('appointmentID');
    const doctor = this.doctorService.getLoggedInDoctor();
    this.doctorID = doctor?.id || '';

    const cachedAppt = this.doctorService.getAllAppointments()
      .find((a: any) => a.appointmentID === this.appointmentID);
    
    if (cachedAppt) {
      this.patientName = cachedAppt.patientName || 'Patient';
    }
  }

  submitForm() {
    if (!this.doctorID || !this.appointmentID) {
      alert('❌ Session Error: Missing Doctor or Appointment ID');
      return;
    }

    const doctor = this.doctorService.getLoggedInDoctor();

    this.historyService.addHistory(
      this.doctorID, 
      doctor?.name || 'Doctor', 
      { appointmentID: this.appointmentID }, 
      this.formData
    ).subscribe({
      next: () => {
        alert(`✅ Medical history saved successfully!`);
        
        // THE FIX: Just go back to the previous page automatically!
        this.location.back(); 
      },
      error: (err: any) => {
        alert(`❌ Error: ${err.error?.message || 'Server error'}`);
      }
    });
  }
}