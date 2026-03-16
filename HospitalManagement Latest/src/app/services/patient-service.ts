import { Injectable } from '@angular/core';
import { Patient } from '../model/patient';
import { PatientMedicalHistory } from '../model/patient-medical-history';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PatientService {
  private apiUrl = 'http://localhost:5000/patient';

  private currentPatientSubject = new BehaviorSubject<Patient | null>(null);
  public currentPatient$ = this.currentPatientSubject.asObservable();
  
  // Legacy cache
  private registeredPatients: Patient[] = [];

  constructor(private http: HttpClient) {
    // Read from the Frontend Cookie instead of localStorage
    const savedPatient = this.getPatientCookie();
    if (savedPatient) {
      this.currentPatientSubject.next(savedPatient);
    }
  }



  private setPatientCookie(patient: Patient) {
    const patientString = encodeURIComponent(JSON.stringify(patient));
    document.cookie = `loggedInPatient=${patientString}; path=/; max-age=86400; SameSite=Strict`;
  }

  private getPatientCookie(): Patient | null {
    const match = document.cookie.match(new RegExp('(^| )loggedInPatient=([^;]+)'));
    if (match) {
      try {
        return JSON.parse(decodeURIComponent(match[2]));
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  private clearPatientCookie() {
    document.cookie = 'loggedInPatient=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
  }


  register(patient: Patient): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, patient);
  }

  setCurrentPatient(patient: Patient): void {
    this.currentPatientSubject.next(patient);
    this.setPatientCookie(patient); // Save to cookie
  }

  getLoggedInPatient(): Patient | null {
    return this.currentPatientSubject.value;
  }

  clearLocalSession(): void {
    this.currentPatientSubject.next(null);
    this.clearPatientCookie(); // Wipe the cookie
  }

  logout(): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/logout`, {}, { withCredentials: true })
      .pipe(tap(() => this.clearLocalSession()));
  }



  getProfile(): Observable<Patient> {
    return this.http.get<Patient>(`${this.apiUrl}/profile`, { withCredentials: true }).pipe(
      tap((patient) => {
        this.currentPatientSubject.next(patient);
        this.setPatientCookie(patient); // Sync cookie with latest DB profile
      }),
    );
  }

  updateProfile(updated: Patient): Observable<any> {
    return this.http
      .patch(`${this.apiUrl}/update/${updated.email}`, updated, { withCredentials: true })
      .pipe(
        tap(() => {
          this.currentPatientSubject.next(updated);
          this.setPatientCookie(updated); // Sync cookie with edits
        }),
      );
  }

  bookAppointmentDB(bookingData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/book-appointment`, bookingData, {
      withCredentials: true,
    });
  }

  rescheduleAppointmentDB(appointmentID: string, newDate: string, newTime: string): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/appointment/${appointmentID}`,
      { newDate, newTime },
      { withCredentials: true },
    );
  }

  cancelAppointmentDB(appointmentID: string): Observable<any> {
    // Fixed: Now uses this.apiUrl dynamically
    return this.http.patch(
      `${this.apiUrl}/appointment/${appointmentID}/cancel`,
      {},
      { withCredentials: true },
    );
  }

  getPatientAppointmentsDB(patientID: string): Observable<any> {
    // Fixed: Now uses this.apiUrl dynamically
    return this.http.get(`${this.apiUrl}/${patientID}/appointments`, {
      withCredentials: true,
    });
  }

  getMedicalHistoryDB(patientID: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${patientID}/medical-history`, {
      withCredentials: true,
    });
  }



  getMedicalHistory(): PatientMedicalHistory | undefined {
    return this.currentPatientSubject.value?.medicalHistory;
  }

  saveMedicalHistory(history: PatientMedicalHistory): void {
    const current = this.currentPatientSubject.value;
    if (current) {
      current.medicalHistory = history;
      this.currentPatientSubject.next(current);
      this.setPatientCookie(current); // Sync cookie
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