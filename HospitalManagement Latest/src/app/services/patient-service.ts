// import { Injectable } from '@angular/core';
// import { Patient } from '../model/patient';
// import { PatientMedicalHistory } from '../model/patient-medical-history';
// import { HttpClient } from '@angular/common/http';
// import { BehaviorSubject, Observable, tap } from 'rxjs';

// @Injectable({
//   providedIn: 'root',
// })
// export class PatientService {
//   private apiUrl = 'http://localhost:5000/patient';

//   private currentPatientSubject = new BehaviorSubject<Patient | null>(null);
//   public currentPatient$ = this.currentPatientSubject.asObservable();
  
//   // Legacy cache
//   private registeredPatients: Patient[] = [];

//   constructor(private http: HttpClient) {
//     // Read from the Frontend Cookie instead of localStorage
//     const savedPatient = this.getPatientCookie();
//     if (savedPatient) {
//       this.currentPatientSubject.next(savedPatient);
//     }
//   }



//   private setPatientCookie(patient: Patient) {
//     const patientString = encodeURIComponent(JSON.stringify(patient));
//     document.cookie = `loggedInPatient=${patientString}; path=/; max-age=86400; SameSite=Strict`;
//   }

//   private getPatientCookie(): Patient | null {
//     const match = document.cookie.match(new RegExp('(^| )loggedInPatient=([^;]+)'));
//     if (match) {
//       try {
//         return JSON.parse(decodeURIComponent(match[2]));
//       } catch (e) {
//         return null;
//       }
//     }
//     return null;
//   }

//   private clearPatientCookie() {
//     document.cookie = 'loggedInPatient=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
//   }


//   register(patient: Patient): Observable<any> {
//     return this.http.post(`${this.apiUrl}/register`, patient);
//   }

//   setCurrentPatient(patient: Patient): void {
//     this.currentPatientSubject.next(patient);
//     this.setPatientCookie(patient); // Save to cookie
//   }

//   getLoggedInPatient(): Patient | null {
//     return this.currentPatientSubject.value;
//   }

//   clearLocalSession(): void {
//     this.currentPatientSubject.next(null);
//     this.clearPatientCookie(); // Wipe the cookie
//   }

//   logout(): Observable<any> {
//     return this.http
//       .post(`${this.apiUrl}/logout`, {}, { withCredentials: true })
//       .pipe(tap(() => this.clearLocalSession()));
//   }



//   getProfile(): Observable<Patient> {
//     return this.http.get<Patient>(`${this.apiUrl}/profile`, { withCredentials: true }).pipe(
//       tap((patient) => {
//         this.currentPatientSubject.next(patient);
//         this.setPatientCookie(patient); // Sync cookie with latest DB profile
//       }),
//     );
//   }

//   updateProfile(updated: Patient): Observable<any> {
//     return this.http
//       .patch(`${this.apiUrl}/update/${updated.email}`, updated, { withCredentials: true })
//       .pipe(
//         tap(() => {
//           this.currentPatientSubject.next(updated);
//           this.setPatientCookie(updated); // Sync cookie with edits
//         }),
//       );
//   }

//   bookAppointmentDB(bookingData: any): Observable<any> {
//     return this.http.post(`${this.apiUrl}/book-appointment`, bookingData, {
//       withCredentials: true,
//     });
//   }

//   rescheduleAppointmentDB(appointmentID: string, newDate: string, newTime: string): Observable<any> {
//     return this.http.patch(
//       `${this.apiUrl}/appointment/${appointmentID}`,
//       { newDate, newTime },
//       { withCredentials: true },
//     );
//   }

//   cancelAppointmentDB(appointmentID: string): Observable<any> {
//     // Fixed: Now uses this.apiUrl dynamically
//     return this.http.patch(
//       `${this.apiUrl}/appointment/${appointmentID}/cancel`,
//       {},
//       { withCredentials: true },
//     );
//   }

//   getPatientAppointmentsDB(patientID: string): Observable<any> {
//     // Fixed: Now uses this.apiUrl dynamically
//     return this.http.get(`${this.apiUrl}/${patientID}/appointments`, {
//       withCredentials: true,
//     });
//   }

//   getMedicalHistoryDB(patientID: string): Observable<any[]> {
//     return this.http.get<any[]>(`${this.apiUrl}/${patientID}/medical-history`, {
//       withCredentials: true,
//     });
//   }



//   getMedicalHistory(): PatientMedicalHistory | undefined {
//     return this.currentPatientSubject.value?.medicalHistory;
//   }

//   saveMedicalHistory(history: PatientMedicalHistory): void {
//     const current = this.currentPatientSubject.value;
//     if (current) {
//       current.medicalHistory = history;
//       this.currentPatientSubject.next(current);
//       this.setPatientCookie(current); // Sync cookie
//     }
//   }

//   getPatientById(patientID: string): Patient {
//     const found = this.registeredPatients.find((p) => p.patientID === patientID);
//     if (!found) {
//       const current = this.currentPatientSubject.value;
//       if (current?.patientID === patientID) return current;
//       return { firstName: 'Unknown', lastName: 'Patient', patientID } as Patient;
//     }
//     return found;
//   }
// }

import { Injectable } from '@angular/core';
import { Patient } from '../model/patient';
import { PatientMedicalHistory } from '../model/patient-medical-history';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PatientService {
  private apiUrl = 'http://localhost:5000/patient';

  private currentPatientSubject = new BehaviorSubject<Patient | null>(null);
  public currentPatient$ = this.currentPatientSubject.asObservable();
  
  private registeredPatients: Patient[] = [];

  constructor(private http: HttpClient) {
    // Restore session from sessionStorage on app refresh
    const savedPatient = sessionStorage.getItem('loggedInPatient');
    if (savedPatient) {
      try {
        this.currentPatientSubject.next(JSON.parse(savedPatient));
      } catch (e) {
        sessionStorage.removeItem('loggedInPatient');
      }
    }
  }

  /**
   * HELPER: Generates the Authorization header using the token from sessionStorage.
   * This is what the "Bouncer" on the backend is looking for.
   */
  private getAuthHeaders() {
    const token = sessionStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // --- AUTHENTICATION & SESSION MANAGEMENT ---

  register(patient: Patient): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, patient);
  }

  setCurrentPatient(patient: Patient, token?: string): void {
    if (token) {
      sessionStorage.setItem('token', token);
    }
    sessionStorage.setItem('loggedInPatient', JSON.stringify(patient));
    this.currentPatientSubject.next(patient);
  }

  getLoggedInPatient(): Patient | null {
    return this.currentPatientSubject.value;
  }

  clearLocalSession(): void {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('loggedInPatient');
    this.currentPatientSubject.next(null);
  }

  logout(): Observable<any> {
    // Note: withCredentials is no longer strictly needed if using Bearer headers,
    // but kept if your backend still clears the 'uid' cookie.
    return this.http
      .post(`${this.apiUrl}/logout`, {}, { headers: this.getAuthHeaders() })
      .pipe(tap(() => this.clearLocalSession()));
  }

  // --- PROFILE API CALLS ---

  getProfile(): Observable<Patient> {
    return this.http.get<Patient>(`${this.apiUrl}/profile`, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      tap((patient) => {
        this.setCurrentPatient(patient); // Sync latest data to session storage
      }),
    );
  }

  updateProfile(updated: Patient): Observable<any> {
    return this.http
      .patch(`${this.apiUrl}/update/${updated.email}`, updated, { 
        headers: this.getAuthHeaders() 
      })
      .pipe(
        tap(() => {
          this.setCurrentPatient(updated); // Sync edits to session storage
        }),
      );
  }

  // --- APPOINTMENT & HISTORY CALLS ---

  bookAppointmentDB(bookingData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/book-appointment`, bookingData, {
      headers: this.getAuthHeaders(),
    });
  }

  rescheduleAppointmentDB(appointmentID: string, newDate: string, newTime: string): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/appointment/${appointmentID}`,
      { newDate, newTime },
      { headers: this.getAuthHeaders() },
    );
  }

  cancelAppointmentDB(appointmentID: string): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/appointment/${appointmentID}/cancel`,
      {},
      { headers: this.getAuthHeaders() },
    );
  }

  getPatientAppointmentsDB(patientID: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${patientID}/appointments`, {
      headers: this.getAuthHeaders(),
    });
  }

  getMedicalHistoryDB(patientID: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${patientID}/medical-history`, {
      headers: this.getAuthHeaders(),
    });
  }

  // --- LOCAL UTILITY METHODS ---

  getMedicalHistory(): PatientMedicalHistory | undefined {
    return this.currentPatientSubject.value?.medicalHistory;
  }

  saveMedicalHistory(history: PatientMedicalHistory): void {
    const current = this.currentPatientSubject.value;
    if (current) {
      current.medicalHistory = history;
      this.setCurrentPatient(current);
    }
  }

  getPatientById(patientID: string): Patient {
    const found = this.registeredPatients.find((p) => p.patientID === patientID);
    if (!found) {
      const current = this.currentPatientSubject.value;
      if (current?.patientID === patientID) return current;
      return { firstName: 'Unknown', lastName: 'Patient', patientID } as Patient;
    }
    return found;
  }
}