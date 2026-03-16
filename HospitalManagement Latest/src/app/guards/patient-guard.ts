// import { Injectable } from '@angular/core';
// import { CanActivate, Router } from '@angular/router';
// import { PatientService } from '../services/patient-service';

// @Injectable({ providedIn: 'root' })
// export class PatientGuard implements CanActivate {
//   constructor(private patientService: PatientService, private router: Router) {}

//   canActivate(): boolean {
//   const patient = this.patientService.getLoggedInPatient();
//   if (patient) return true;

//   this.patientService.clearLocalSession();
//   this.router.navigate(['/login']);
//   return false;
// }

// }
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { PatientService } from '../services/patient-service';

@Injectable({ providedIn: 'root' })
export class PatientGuard implements CanActivate {
  constructor(private patientService: PatientService, private router: Router) {}

  canActivate(): boolean {
    const patient = this.patientService.getLoggedInPatient();
    const token = sessionStorage.getItem('token');

    if (token && patient) {
      return true;
    }

    alert("Access Denied: Patients only.");
    this.patientService.clearLocalSession();
    this.router.navigate(['/login']);
    return false;
  }
}