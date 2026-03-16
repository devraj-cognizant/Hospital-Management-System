// import { Injectable } from '@angular/core';
// import { CanActivate, Router } from '@angular/router';
// import { PatientService } from '../services/patient-service';
// import { DoctorService } from '../services/doctor';

// @Injectable({ providedIn: 'root' })
// export class AuthGuard implements CanActivate {
//   constructor(
//     private patientService: PatientService,
//     private doctorService: DoctorService,
//     private router: Router
//   ) {}

//   canActivate(): boolean {
//   const patient = this.patientService.getLoggedInPatient();
//   const doctor = this.doctorService.getLoggedInDoctor();

//   if (patient || doctor) {
//     return true;
//   }

//   // Clear stale cookies before redirect
//   this.patientService.clearLocalSession();
//   this.doctorService.clearLoggedInDoctor();
//   this.router.navigate(['/login']);
//   return false;
// }

// }

import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { PatientService } from '../services/patient-service';
import { DoctorService } from '../services/doctor';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private patientService: PatientService,
    private doctorService: DoctorService,
    private router: Router
  ) {}

  canActivate(): boolean {
    const token = sessionStorage.getItem('token');
    const patient = this.patientService.getLoggedInPatient();
    const doctor = this.doctorService.getLoggedInDoctor();

    // Check for both the data AND the token in this specific tab
    if (token && (patient || doctor)) {
      return true;
    }

    // If no token or no user data, clear any partial session and redirect
    this.patientService.clearLocalSession();
    this.doctorService.clearLoggedInDoctor();
    this.router.navigate(['/login']);
    return false;
  }
}