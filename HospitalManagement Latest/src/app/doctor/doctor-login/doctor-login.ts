import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DoctorService } from '../../services/doctor';

@Component({
  selector: 'app-doctor-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './doctor-login.html',
  styleUrls: ['./doctor-login.css']
})
export class DoctorLogin {
  email = '';
  password = '';

  constructor(
    private router: Router,
    private doctorService: DoctorService
  ) { }

  login() {
    if (!this.email || !this.password) {
      alert('Please enter both email and password');
      return;
    }

    this.doctorService.login(this.email, this.password).subscribe({
      next: (response) => {
        // 🛑 COMPLETELY REMOVED localStorage logic here!

        // Map the top-level keys from your Node.js response to the Doctor model
        const doctorData = {
          id: response.id,
          name: response.name,
          specialization: response.specialization,
          email: this.email 
        };

        if (response.id) {
          this.doctorService.setLoggedInDoctor(doctorData as any);
          alert(`Login successful! Welcome Dr. ${response.name}`);
          
          // Use response.id for navigation
          this.router.navigate(['/doctor', response.id]);
        } else {
          console.error("Login response missing ID:", response);
          alert("Login successful, but profile data is missing.");
        }
      },
      error: (err) => {
        alert('Login failed: ' + (err.error?.message || 'Invalid Credentials'));
        console.error('Doctor Login Error:', err);
      }
    });
  }

  goBack() {
    this.router.navigate(['/login']);
  }
}