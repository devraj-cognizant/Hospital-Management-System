import { Injectable } from '@angular/core';
import { Doctor } from '../model/doctor';
import { Appointment } from '../model/appointment';
import { HttpClient } from '@angular/common/http'; 
import { BehaviorSubject, Observable, tap } from 'rxjs'; 

@Injectable({
  providedIn: 'root',
})
export class DoctorService {
  // Local cache for components that haven't moved to API yet
  private appointments: Appointment[] = [];
  private apiUrl = 'http://localhost:5000/doctor';
  
  // IN-MEMORY STATE (Observable for the rest of the app)
  private currentDoctorSubject = new BehaviorSubject<Doctor | null>(null);
  public currentDoctor$ = this.currentDoctorSubject.asObservable();

  // Local storage for availability slots
  private availability: Record<string, Record<string, { available: string[]; blocked: string[] }>> = {};

  constructor(private http: HttpClient) {
    // ✅ BUG FIX: Restore session memory on page refresh!
    const savedDoctor = localStorage.getItem('loggedInDoctor');
    if (savedDoctor) {
      this.currentDoctorSubject.next(JSON.parse(savedDoctor));
    }
  }

  // --------------------------------------------------
  // 🔐 AUTHENTICATION LOGIC
  // --------------------------------------------------

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email, password }, { withCredentials: true }).pipe(
      tap((response: any) => {
        const doctorData = {
          id: response.id,
          name: response.name,
          specialization: response.specialization,
          email: email
        } as Doctor;
        
        // Save to memory AND to local storage so it survives Refresh (F5)
        this.currentDoctorSubject.next(doctorData); 
        localStorage.setItem('loggedInDoctor', JSON.stringify(doctorData));
      })
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true }).pipe(
      tap(() => this.clearLoggedInDoctor())
    );
  }
  // ✅ ADD THIS: Allows the Login component to manually set the doctor in memory
  setLoggedInDoctor(doctor: Doctor) {
    this.currentDoctorSubject.next(doctor);
    localStorage.setItem('loggedInDoctor', JSON.stringify(doctor));
  }

  getLoggedInDoctor(): Doctor | null {
    return this.currentDoctorSubject.value;
  }

  clearLoggedInDoctor() {
    this.currentDoctorSubject.next(null);
    localStorage.removeItem('loggedInDoctor'); 
  }

  // --------------------------------------------------
  // 🌐 API CALLS (MONGODB BACKEND)
  // --------------------------------------------------

  /** Fetch all doctors for the booking dropdown */
  getAllDoctorsFromDB(): Observable<any> {
    return this.http.get(`${this.apiUrl}/all`, { withCredentials: true });
  }

  /** Get specific doctor's availability slots */
  getAvailabilityFromDB(doctorID: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${doctorID}/availability`, { withCredentials: true });
  }

  /** Update doctor's availability (PUT) */
  saveAvailabilityToDB(doctorID: string, availabilityData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${doctorID}/availability`, availabilityData, { withCredentials: true });
  }

  /** Fetch all appointments for a specific doctor */
  getAppointmentsFromDB(doctorID: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${doctorID}/appointments`, { withCredentials: true });
  }

  /** Mark appointment as Scheduled in DB */
  acceptAppointmentDB(appointmentID: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/appointments/accept`, { appointmentID }, { withCredentials: true });
  }

  /** Mark appointment as Cancelled in DB */
  declineAppointmentDB(appointmentID: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/appointments/decline`, { appointmentID }, { withCredentials: true });
  }

  // --------------------------------------------------
  // 🛠️ LOCAL FALLBACKS & UTILITIES
  // (Required for Patient-side components and History Form)
  // --------------------------------------------------

  getAllAppointments(): Appointment[] {
    return this.appointments;
  }

  addAppointment(appt: Appointment): Appointment {
    this.appointments.push(appt);
    this.blockSlot(appt.doctorID, appt.appointmentDate, appt.time);
    return appt;
  }

  updateAppointment(appt: Appointment) {
    const idx = this.appointments.findIndex(a => a.appointmentID === appt.appointmentID);
    if (idx > -1) this.appointments[idx] = { ...appt };
  }

  approveAppointment(appt: Appointment): Appointment {
    appt.status = 'Scheduled';
    this.updateAppointment(appt);
    return appt;
  }

  cancelAppointment(appt: Appointment, reason: string): Appointment {
    appt.status = 'Cancelled';
    appt.reason = reason;
    this.updateAppointment(appt);
    return appt;
  }

  completeAppointment(appt: Appointment, notes: string = ''): Appointment {
    appt.status = 'Completed';
    if (notes) appt.notes = notes;
    this.updateAppointment(appt);
    return appt;
  }

  updateAvailability(doctorID: string, availability: Record<string, { available: string[]; blocked: string[] }>) {
    this.availability[doctorID] = availability;
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
    entry.available = entry.available.filter(s => s !== slot);
    if (!entry.blocked.includes(slot)) entry.blocked.push(slot);
  }
}