import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // Added HttpHeaders
import { BehaviorSubject, Observable } from 'rxjs';
import { PatientRecord } from '../model/patient-history';

@Injectable({
  providedIn: 'root'
})
export class MedicalHistoryService {
  private apiUrl = 'http://localhost:5000/doctor';
  private patientsSubject = new BehaviorSubject<PatientRecord[]>([]);
  patients$ = this.patientsSubject.asObservable();

  constructor(private http: HttpClient) { }

  // 1. HELPER: Grab the token from the current tab's session
  private getAuthHeaders() {
    const token = sessionStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  addHistory(doctorID: string, doctorName: string, appointment: any, formData: any): Observable<any> {
    const historyPayload = {
      patientID: appointment.patientID,
      patientName: appointment.patientName,
      appointmentID: appointment.appointmentID,
      diagnosis: formData.diagnosis,
      treatment: formData.treatment,
      notes: formData.notes,
      doctorID: doctorID,
      doctorName: doctorName,
      dateOfVisit: new Date()
    };

    // 2. USE HEADERS instead of just withCredentials
    return this.http.post(
      `${this.apiUrl}/${doctorID}/medicalhistory`, 
      historyPayload, 
      { headers: this.getAuthHeaders() } 
    );
  }

  fetchPatientsFromDB(doctorID: string): void {
    // 3. USE HEADERS here too
    this.http.get<{ histories: PatientRecord[] }>(
      `${this.apiUrl}/${doctorID}/medicalhistory`, 
      { headers: this.getAuthHeaders() } 
    ).subscribe({
      next: (res) => {
        console.log("📦 Received Grouped Patients:", res.histories);
        this.patientsSubject.next(res.histories || []);
      },
      error: (err) => {
        console.error("❌ History fetch failed:", err);
        if (err.status === 401) {
          alert("Session expired. Please login again.");
        }
      }
    });
  }

  public calculateAge(dob: string): number {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
}