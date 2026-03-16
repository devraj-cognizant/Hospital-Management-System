// 
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

    this.http.post('http://localhost:5000/auth/login', 
      { email: this.email, password: this.password }
    ).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        
        // Save token to session storage immediately for the current tab
        const token = res.token;
        const role = res.role;
        const user = res.user;

        const userName = user.firstName || user.lastName || "Doctor";
        alert(`Login successful! Welcome ${userName}`);

        if (role === 'PATIENT') {
          // Pass user AND token to set session storage
          this.patientService.setCurrentPatient(user, token);
          this.router.navigate(['/patient']);
        } else if (role === 'DOCTOR') {
          const doctorData = {
            id: user.id,
            name: user.firstName,
            specialization: user.specialization,
            email: user.email
          };
          // Pass doctorData AND token to set session storage
          this.doctorService.setLoggedInDoctor(doctorData as any, token);
          this.router.navigate(['/doctor', user.id]);
        }
      },
      error: (err) => {
        this.isLoading = false;
        alert('Login failed: ' + (err.error?.message || 'Invalid Credentials'));
      }
    });
  }
}