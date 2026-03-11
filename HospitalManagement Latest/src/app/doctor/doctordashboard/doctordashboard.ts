import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Doctor } from '../../model/doctor';
import { DoctorService } from '../../services/doctor';

@Component({
  selector: 'app-doctordashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './doctordashboard.html',
  styleUrls: ['./doctordashboard.css'],
})
export class Doctordashboard implements OnInit {
  
  // Use a GETTER: This ensures the template always sees 
  // the doctor, even if the service reloads from storage.
  get doctor(): Doctor | null {
    return this.doctorService.getLoggedInDoctor();
  }

  constructor(
    private router: Router,
    private doctorService: DoctorService
  ) {}

  ngOnInit() {
    // Redirect if someone tries to access the dashboard without being logged in
    if (!this.doctor) {
      this.router.navigate(['/doctor-login']);
    }
  }

  logout() {
    this.doctorService.logout().subscribe({
      next: () => {
        alert('Doctor logged out successfully');
        this.router.navigate(['/home']);
      },
      error: (err: any) => {
        console.error('Server logout failed', err);
        // Fallback: Clear local data even if the server is down
        this.doctorService.clearLoggedInDoctor();
        this.router.navigate(['/home']);
      }
    });
  }
}