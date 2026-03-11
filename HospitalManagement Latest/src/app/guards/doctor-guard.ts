import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { DoctorService } from '../services/doctor';

@Injectable({ providedIn: 'root' })
export class DoctorGuard implements CanActivate {
  constructor(private doctorService: DoctorService, private router: Router) {}

  canActivate(): boolean {
    const doctor = this.doctorService.getLoggedInDoctor();
    if (doctor) {
      return true;
    }

    // Not a doctor → clear cookie and redirect
    this.doctorService.clearLoggedInDoctor();
    this.router.navigate(['/doctor/login']);
    return false;
  }
}
