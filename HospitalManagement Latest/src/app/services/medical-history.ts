import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
    return this.http.post(`${this.apiUrl}/${doctorID}/medicalhistory`, historyPayload, { withCredentials: true });
  }

  //  ONLY ONE VERSION OF THIS FUNCTION:
 fetchPatientsFromDB(doctorID: string): void {
  this.http.get<{ histories: PatientRecord[] }>(
    `${this.apiUrl}/${doctorID}/medicalhistory`, 
    { withCredentials: true }
  ).subscribe({
    next: (res) => {
      console.log("📦 Received Grouped Patients:", res.histories);
      this.patientsSubject.next(res.histories || []);
    },
    error: (err) => console.error("❌ History fetch failed:", err)
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