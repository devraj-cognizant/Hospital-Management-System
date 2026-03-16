import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { PatientService } from './services/patient-service'; 
import { DoctorService } from './services/doctor'; // ✅ Import Doctor Service

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App implements OnInit {
  
  // Inject BOTH services
  constructor(
    private patientService: PatientService,
    private doctorService: DoctorService 
  ) {}

  ngOnInit() {
    console.log("App loaded. Checking for secure session...");
    
    //  1. Check if a DOCTOR is already logged in first
    const activeDoctor = this.doctorService.getLoggedInDoctor();
    if (activeDoctor) {
      console.log("👨‍⚕️ Doctor session detected for:", activeDoctor.name, "- Skipping Patient check.");
      return; //  Stop the function here! Do not call the patient API.
    }

    //  2. If no Doctor is found, check for a PATIENT session
    this.patientService.getProfile().subscribe({
      next: (patient) => {
        console.log('Session restored securely from cookie for:', patient.firstName);
      },
      error: () => {
        console.log('No active session found.');
      }
    });
  }
}