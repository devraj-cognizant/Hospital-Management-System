import { Injectable } from '@angular/core';
import { Patient } from '../model/patient';
import { PatientMedicalHistory } from '../model/patient-medical-history';
import { Appointment } from '../model/appointment';
import { DoctorService } from './doctor';
import { HttpClient } from '@angular/common/http'; 
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PatientService {
  private apiUrl = 'http://localhost:5000/patient';
  
  private currentPatientSubject = new BehaviorSubject<Patient | null>(null);
  public currentPatient$ = this.currentPatientSubject.asObservable(); 
  private registeredPatients: Patient[] = []; 

  constructor(private doctorService: DoctorService, private http: HttpClient) {
    // ✅ Read from the Frontend Cookie instead of localStorage
    const savedPatient = this.getPatientCookie();
    if (savedPatient) {
      this.currentPatientSubject.next(savedPatient);
    }
  }

  // --------------------------------------------------
  // 🍪 COOKIE HELPER METHODS
  // --------------------------------------------------
  private setPatientCookie(patient: Patient) {
    const patientString = encodeURIComponent(JSON.stringify(patient));
    document.cookie = `loggedInPatient=${patientString}; path=/; max-age=86400; SameSite=Strict`;
  }

  private getPatientCookie(): Patient | null {
    const match = document.cookie.match(new RegExp('(^| )loggedInPatient=([^;]+)'));
    if (match) {
      try { return JSON.parse(decodeURIComponent(match[2])); } catch (e) { return null; }
    }
    return null;
  }

  private clearPatientCookie() {
    document.cookie = "loggedInPatient=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict";
  }

  // ---------------------------
  // Authentication & Session
  // ---------------------------
  register(patient: Patient): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, patient);
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email, password }, { withCredentials: true }).pipe(
      tap((response: any) => {
        this.currentPatientSubject.next(response.user);
        this.setPatientCookie(response.user); // ✅ Save to cookie
      })
    );
  }

  setCurrentPatient(patient: Patient): void {
    this.currentPatientSubject.next(patient); 
    this.setPatientCookie(patient); // ✅ Save to cookie
  }

  clearLocalSession(): void {
    this.currentPatientSubject.next(null); 
    this.clearPatientCookie(); // ✅ Wipe the cookie
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true }).pipe(
      tap(() => this.clearLocalSession())
    );
  }

  getLoggedInPatient(): Patient | null {
    return this.currentPatientSubject.value; 
  }

  // ---------------------------
  // Profile & Medical History
  // ---------------------------
  getProfile(): Observable<Patient> {
    return this.http.get<Patient>(`${this.apiUrl}/profile`, { withCredentials: true }).pipe(
      tap((patient) => {
        this.currentPatientSubject.next(patient);
        this.setPatientCookie(patient); // Sync cookie with latest DB profile
      })
    );
  }

  updateProfile(updated: Patient): Observable<any> {
    return this.http.patch(`${this.apiUrl}/update/${updated.email}`, updated, { withCredentials: true }).pipe(
      tap(() => {
        this.currentPatientSubject.next(updated);
        this.setPatientCookie(updated); // Sync cookie with edits
      })
    );
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

  // ---------------------------
  // Appointments
  // ---------------------------
  bookAppointmentDB(bookingData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/book-appointment`, bookingData, { withCredentials: true });
  }

  rescheduleAppointmentDB(appointmentID: string, newDate: string, newTime: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/appointment/${appointmentID}`, { newDate, newTime }, { withCredentials: true });
  }

  getPatientById(patientID: string): Patient {
    const found = this.registeredPatients.find(p => p.patientID === patientID);
    if (!found) {
        const current = this.currentPatientSubject.value;
        if(current?.patientID === patientID) return current;
        return { firstName: 'Unknown', lastName: 'Patient', patientID } as Patient;
    }
    return found;
  }

  // Inside patient-service.ts in Angular
  cancelAppointmentDB(appointmentID: string) {
    return this.http.patch(`http://localhost:5000/patient/appointment/${appointmentID}/cancel`, {}, { withCredentials: true });
  }

  getPatientAppointmentsDB(patientID: string): Observable<any> {
    return this.http.get(`http://localhost:5000/patient/${patientID}/appointments`, { withCredentials: true });
  }
}