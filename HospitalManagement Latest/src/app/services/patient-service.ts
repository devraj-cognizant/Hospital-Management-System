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
  
  // IN-MEMORY STATE: Securely hold the logged-in patient
  private currentPatientSubject = new BehaviorSubject<Patient | null>(null);
  public currentPatient$ = this.currentPatientSubject.asObservable(); 
  private registeredPatients: Patient[] = []; 

  constructor(private doctorService: DoctorService, private http: HttpClient) {}

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
      })
    );
  }

  setCurrentPatient(patient: Patient): void {
    this.currentPatientSubject.next(patient); 
  }

  clearLocalSession(): void {
    this.currentPatientSubject.next(null); 
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true }).pipe(
      tap(() => this.currentPatientSubject.next(null))
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
      })
    );
  }

  updateProfile(updated: Patient): Observable<any> {
    return this.http.patch(`${this.apiUrl}/update/${updated.email}`, updated, { withCredentials: true }).pipe(
      tap(() => this.currentPatientSubject.next(updated))
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
    }
  }

  // ---------------------------
  // Appointments (NOW USING DB)
  // ---------------------------

  // ✅ New API Call to hit your POST /book-appointment route
  bookAppointmentDB(bookingData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/book-appointment`, bookingData, { withCredentials: true });
  }

  // ✅ New API Call to hit your PATCH /appointment/:id route
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

  // Add this to your PatientService
  getPatientAppointmentsDB(patientID: string): Observable<any> {
    // This should hit your backend: router.get("/:patientID/appointments", getPatientAppointments)
    return this.http.get(`http://localhost:5000/patient/${patientID}/appointments`, { withCredentials: true });
  }
}