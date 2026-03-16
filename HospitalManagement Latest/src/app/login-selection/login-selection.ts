import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { PatientService } from '../services/patient-service';
import { DoctorService } from '../services/doctor';

@Component({
  selector: 'app-login-selection',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login-selection.html',
  styleUrls: ['./login-selection.css']
})
export class LoginSelection {
  email = '';
  password = '';
  isLoading = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private patientService: PatientService,
    private doctorService: DoctorService
  ) {}

  login() {
    if (!this.email || !this.password) {
      alert('Please enter both email and password.');
      return;
    }

    this.isLoading = true;

    // Call our new Unified Backend Route!
    this.http.post('http://localhost:5000/auth/login', 
      { email: this.email, password: this.password }, 
      { withCredentials: true }
    ).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        
        // 1. Greet the user
        const userName = res.user.firstName || res.user.lastName || "Doctor";
        alert(`Login successful! Welcome ${userName}`);

        // 2. Smart Routing based on the Role returned by the backend
        if (res.role === 'PATIENT') {
          this.patientService.setCurrentPatient(res.user);
          this.router.navigate(['/patient']);
        } else if (res.role === 'DOCTOR') {
          
          // THE FIX: Map the data so the Doctor Dashboard gets exactly what it expects!
          const doctorData = {
            id: res.user.id,
            name: res.user.firstName, // Grab the name from the unified firstName field
            specialization: res.user.specialization,
            email: res.user.email
          };

          this.doctorService.setLoggedInDoctor(doctorData as any);
          this.router.navigate(['/doctor', res.user.id]);
        }
      },
      error: (err) => {
        this.isLoading = false;
        alert('Login failed: ' + (err.error?.message || 'Invalid Credentials'));
        console.error('Unified Login Error:', err);
      }
    });
  }
}