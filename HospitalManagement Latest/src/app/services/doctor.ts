import { Injectable } from '@angular/core';
import { Doctor } from '../model/doctor';
import { Appointment } from '../model/appointment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DoctorService {
  private appointments: Appointment[] = [];
  private apiUrl = 'http://localhost:5000/doctor';
  private authUrl = 'http://localhost:5000/auth';

  private currentDoctorSubject = new BehaviorSubject<Doctor | null>(null);
  public currentDoctor$ = this.currentDoctorSubject.asObservable();

  // Local cache for availability logic used by dashboards
  private availability: Record<string, Record<string, { available: string[]; blocked: string[] }>> = {};

  constructor(private http: HttpClient) {
    // Restore session from tab-specific storage (Unique per tab)
    const savedDoctor = sessionStorage.getItem('loggedInDoctor');
    if (savedDoctor) {
      try {
        this.currentDoctorSubject.next(JSON.parse(savedDoctor));
      } catch (e) {
        sessionStorage.removeItem('loggedInDoctor');
        sessionStorage.removeItem('token');
      }
    }
  }

  /**
   * HELPER: Creates Authorization header for the "Bouncer" middleware
   */
  private getAuthHeaders() {
    const token = sessionStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // --- AUTHENTICATION LOGIC ---

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.authUrl}/login`, { email, password }).pipe(
      tap((res: any) => {
        this.setLoggedInDoctor(res.user, res.token);
      })
    );
  }

  setLoggedInDoctor(doctor: Doctor, token?: string) {
    if (token) sessionStorage.setItem('token', token);
    sessionStorage.setItem('loggedInDoctor', JSON.stringify(doctor));
    this.currentDoctorSubject.next(doctor);
  }

  getLoggedInDoctor(): Doctor | null {
    return this.currentDoctorSubject.value;
  }

  clearLoggedInDoctor() {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('loggedInDoctor');
    this.currentDoctorSubject.next(null);
  }

  logout(): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/logout`, {}, { headers: this.getAuthHeaders() })
      .pipe(tap(() => this.clearLoggedInDoctor()));
  }

  // --- LOCAL CACHE METHODS (Fixes TS2339 Compiler Errors) ---

  getAllAppointments(): Appointment[] {
    return this.appointments;
  }

  addAppointment(appt: Appointment): Appointment {
    this.appointments.push(appt);
    this.blockSlot(appt.doctorID, appt.appointmentDate, appt.time);
    return appt;
  }

  cancelAppointment(appt: Appointment, reason: string): Appointment {
    appt.status = 'Cancelled';
    appt.reason = reason;
    const idx = this.appointments.findIndex((a) => a.appointmentID === appt.appointmentID);
    if (idx > -1) this.appointments[idx] = { ...appt };
    return appt;
  }

  updateAvailability(doctorID: string, availabilityData: any) {
    this.availability[doctorID] = availabilityData;
  }

  getAvailableSlots(doctorID: string, date: string): string[] {
    if (!doctorID || !date) return [];
    const normalizedDate = date.split('T')[0];
    return this.availability[doctorID]?.[normalizedDate]?.available || [];
  }

  blockSlot(doctorID: string, date: string, slot: string) {
    const normalizedDate = date.split('T')[0];
    if (!this.availability[doctorID]) this.availability[doctorID] = {};
    if (!this.availability[doctorID][normalizedDate]) {
      this.availability[doctorID][normalizedDate] = { available: [], blocked: [] };
    }
    const entry = this.availability[doctorID][normalizedDate];
    entry.available = entry.available.filter((s) => s !== slot);
    if (!entry.blocked.includes(slot)) entry.blocked.push(slot);
  }

  // --- DATABASE API CALLS ---

  getAllDoctorsFromDB(): Observable<any> {
    return this.http.get(`${this.apiUrl}/all`, { headers: this.getAuthHeaders() });
  }

  getAvailabilityFromDB(doctorID: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${doctorID}/availability`, { headers: this.getAuthHeaders() });
  }

  saveAvailabilityToDB(doctorID: string, availabilityData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${doctorID}/availability`, availabilityData, {
      headers: this.getAuthHeaders(),
    });
  }

  getAppointmentsFromDB(doctorID: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${doctorID}/appointments`, { headers: this.getAuthHeaders() }).pipe(
      tap((res: any) => {
        this.appointments = res; // Sync local appointments cache with DB data
      })
    );
  }

  acceptAppointmentDB(appointmentID: string): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/appointments/accept`,
      { appointmentID },
      { headers: this.getAuthHeaders() },
    );
  }

  declineAppointmentDB(appointmentID: string): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/appointments/decline`,
      { appointmentID },
      { headers: this.getAuthHeaders() },
    );
  }
}