// import { Injectable } from '@angular/core';
// import { CanActivate, Router } from '@angular/router';
// import { DoctorService } from '../services/doctor';

// @Injectable({ providedIn: 'root' })
// export class DoctorGuard implements CanActivate {
//   constructor(private doctorService: DoctorService, private router: Router) {}

//   canActivate(): boolean {
//     const doctor = this.doctorService.getLoggedInDoctor();
//     if (doctor) {
//       return true;
//     }

//     // Not a doctor → clear cookie and redirect
//     this.doctorService.clearLoggedInDoctor();
//     this.router.navigate(['/doctor/login']);
//     return false;
//   }
// }
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { DoctorService } from '../services/doctor';

@Injectable({ providedIn: 'root' })
export class DoctorGuard implements CanActivate {
  constructor(private doctorService: DoctorService, private router: Router) {}

  canActivate(): boolean {
    const doctor = this.doctorService.getLoggedInDoctor();
    const token = sessionStorage.getItem('token');

    // Only allow if data exists AND they have a token in this tab
    if (token && doctor) {
      return true;
    }

    alert("Access Denied: Doctors only.");
    this.doctorService.clearLoggedInDoctor();
    this.router.navigate(['/login']); 
    return false;
  }
}