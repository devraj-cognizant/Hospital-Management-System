import { Injectable } from '@angular/core';
import { Doctor } from '../model/doctor';
import { Appointment } from '../model/appointment';
import { HttpClient } from '@angular/common/http'; 
import { BehaviorSubject, Observable, tap } from 'rxjs'; 

@Injectable({
  providedIn: 'root',
})
export class DoctorService {
  private appointments: Appointment[] = [];
  private apiUrl = 'http://localhost:5000/doctor';
  
  private currentDoctorSubject = new BehaviorSubject<Doctor | null>(null);
  public currentDoctor$ = this.currentDoctorSubject.asObservable();

  private availability: Record<string, Record<string, { available: string[]; blocked: string[] }>> = {};

  constructor(private http: HttpClient) {
    //  Read from the Frontend Cookie instead of localStorage
    const savedDoctor = this.getDoctorCookie();
    if (savedDoctor) {
      this.currentDoctorSubject.next(savedDoctor);
    }
  }

 
  // COOKIE HELPER METHODS
  
  private setDoctorCookie(doctor: Doctor) {
    const doctorString = encodeURIComponent(JSON.stringify(doctor));
    document.cookie = `loggedInDoctor=${doctorString}; path=/; max-age=86400; SameSite=Strict`;
  }

  private getDoctorCookie(): Doctor | null {
    const match = document.cookie.match(new RegExp('(^| )loggedInDoctor=([^;]+)'));
    if (match) {
      try { return JSON.parse(decodeURIComponent(match[2])); } catch (e) { return null; }
    }
    return null;
  }

  private clearDoctorCookie() {
    document.cookie = "loggedInDoctor=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict";
  }

  // AUTHENTICATION LOGIC
  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email, password }, { withCredentials: true }).pipe(
      tap((response: any) => {
        const doctorData = {
          id: response.id,
          name: response.name,
          specialization: response.specialization,
          email: email
        } as Doctor;
        
        this.currentDoctorSubject.next(doctorData); 
        this.setDoctorCookie(doctorData); //  Save to cookie
      })
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true }).pipe(
      tap(() => this.clearLoggedInDoctor())
    );
  }

  setLoggedInDoctor(doctor: Doctor) {
    this.currentDoctorSubject.next(doctor);
    this.setDoctorCookie(doctor); //  Save to cookie
  }

  getLoggedInDoctor(): Doctor | null {
    return this.currentDoctorSubject.value;
  }

  clearLoggedInDoctor() {
    this.currentDoctorSubject.next(null);
    this.clearDoctorCookie(); //  Wipe the cookie
  }

  // ... (Keep ALL your existing API calls and local utility methods below here exactly the same) ...
  getAllDoctorsFromDB(): Observable<any> { return this.http.get(`${this.apiUrl}/all`, { withCredentials: true }); }
  getAvailabilityFromDB(doctorID: string): Observable<any> { return this.http.get(`${this.apiUrl}/${doctorID}/availability`, { withCredentials: true }); }
  saveAvailabilityToDB(doctorID: string, availabilityData: any): Observable<any> { return this.http.put(`${this.apiUrl}/${doctorID}/availability`, availabilityData, { withCredentials: true }); }
  getAppointmentsFromDB(doctorID: string): Observable<any> { return this.http.get(`${this.apiUrl}/${doctorID}/appointments`, { withCredentials: true }); }
  acceptAppointmentDB(appointmentID: string): Observable<any> { return this.http.patch(`${this.apiUrl}/appointments/accept`, { appointmentID }, { withCredentials: true }); }
  declineAppointmentDB(appointmentID: string): Observable<any> { return this.http.patch(`${this.apiUrl}/appointments/decline`, { appointmentID }, { withCredentials: true }); }
  getAllAppointments(): Appointment[] { return this.appointments; }
  addAppointment(appt: Appointment): Appointment { this.appointments.push(appt); this.blockSlot(appt.doctorID, appt.appointmentDate, appt.time); return appt; }
  updateAppointment(appt: Appointment) { const idx = this.appointments.findIndex(a => a.appointmentID === appt.appointmentID); if (idx > -1) this.appointments[idx] = { ...appt }; }
  approveAppointment(appt: Appointment): Appointment { appt.status = 'Scheduled'; this.updateAppointment(appt); return appt; }
  cancelAppointment(appt: Appointment, reason: string): Appointment { appt.status = 'Cancelled'; appt.reason = reason; this.updateAppointment(appt); return appt; }
  completeAppointment(appt: Appointment, notes: string = ''): Appointment { appt.status = 'Completed'; if (notes) appt.notes = notes; this.updateAppointment(appt); return appt; }
  updateAvailability(doctorID: string, availability: Record<string, { available: string[]; blocked: string[] }>) { this.availability[doctorID] = availability; }
  getAvailableSlots(doctorID: string, date: string): string[] { if (!doctorID || !date) return []; const normalizedDate = date.split('T')[0]; return this.availability[doctorID]?.[normalizedDate]?.available || []; }
  blockSlot(doctorID: string, date: string, slot: string) { const normalizedDate = date.split('T')[0]; if (!this.availability[doctorID]) this.availability[doctorID] = {}; if (!this.availability[doctorID][normalizedDate]) { this.availability[doctorID][normalizedDate] = { available: [], blocked: [] }; } const entry = this.availability[doctorID][normalizedDate]; entry.available = entry.available.filter(s => s !== slot); if (!entry.blocked.includes(slot)) entry.blocked.push(slot); }
}