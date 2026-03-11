import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, Location } from '@angular/common'; // IMPORT Location HERE
import { Appointment } from '../../model/appointment';
import { DoctorService } from '../../services/doctor';
import { PatientService } from '../../services/patient-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-bookappointment',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './bookappointment.html',
  styleUrls: ['./bookappointment.css'],
})
export class Bookappointment implements OnInit {
  rescheduleAppt: Appointment | null = null;
  appointmentForm: FormGroup;
  today = new Date().toISOString().split('T')[0];

  doctors: any[] = [];
  specializations: string[] = [];
  filteredDoctors: any[] = [];
  availableSlotsList: string[] = [];

  reasons: string[] = ['General Checkup', 'Follow-up', 'Prescription Renewal', 'Lab Results Discussion'];
  showOtherReason = false;

  constructor(
    private fb: FormBuilder,
    private doctorService: DoctorService,
    private patientService: PatientService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private location: Location // INJECT Location HERE
  ) {
    this.appointmentForm = this.fb.group({
      patientName: [''],
      specialization: ['', Validators.required],
      doctor: ['', Validators.required],
      date: ['', Validators.required],
      time: ['', Validators.required],
      reason: ['', Validators.required],
      otherReason: ['']
    });
    this.rescheduleAppt = history.state?.rescheduleAppt || null;
  }

  ngOnInit() {
    console.log("--- BOOKING PAGE INIT ---");

    // 1. Fetch Doctors
    this.doctorService.getAllDoctorsFromDB().subscribe({
      next: (data: any) => {
        console.log("1. Doctors fetched:", data);
        setTimeout(() => {
          this.doctors = data.doctors ? data.doctors : data;
          this.specializations = [...new Set(this.doctors.map(d => d.specialization))];
          this.filteredDoctors = this.doctors;
          this.setupForm();
          this.cdr.detectChanges();
        }, 0);
      },
      error: (err: any) => console.error("Failed to load doctors", err)
    });

    // 2. Listen for Doctor Selection
    this.appointmentForm.get('doctor')?.valueChanges.subscribe(doctorID => {
      console.log(`2. Doctor selected: ${doctorID}`);
      if (doctorID) {
        this.doctorService.getAvailabilityFromDB(doctorID).subscribe({
          next: (res: any) => {
            console.log("3. Availability fetched from DB:", res);
            this.doctorService.updateAvailability(doctorID, res.availability || res);
            this.updateAvailableSlots();
          },
          error: (err: any) => console.error("Failed to load availability", err)
        });
      }
    });

    // 3. Listen for Date Selection
    this.appointmentForm.get('date')?.valueChanges.subscribe((dateValue) => {
      console.log(`4. Date selected: ${dateValue}`);
      this.updateAvailableSlots();
    });
  }

  setupForm() {
    const patient = this.patientService.getLoggedInPatient();

    if (this.rescheduleAppt) {
      this.appointmentForm.patchValue({
        patientName: this.rescheduleAppt.patientName,
        specialization: this.rescheduleAppt.specialization,
        doctor: this.rescheduleAppt.doctorID,
        reason: this.rescheduleAppt.reason,
        date: '',
        time: ''
      });

      this.filteredDoctors = this.doctors.filter(d =>
        d.id === this.rescheduleAppt?.doctorID || d._id === this.rescheduleAppt?.doctorID
      );
      this.appointmentForm.get('specialization')?.disable();
      this.appointmentForm.get('doctor')?.disable();
      this.appointmentForm.get('reason')?.disable();
      this.appointmentForm.get('otherReason')?.disable();
    } else if (patient) {
      this.appointmentForm.patchValue({
        patientName: `${patient.firstName} ${patient.lastName}`,
      });
    }
  }

  onSpecializationChange() {
    const selectedSpec = this.appointmentForm.get('specialization')?.value;
    console.log(`Specialization changed to: ${selectedSpec}`);
    this.filteredDoctors = this.doctors.filter(d => d.specialization === selectedSpec);
    this.appointmentForm.patchValue({ doctor: '', time: '', date: '' });
    this.availableSlotsList = [];
  }

  onReasonChange() {
    const selectedReason = this.appointmentForm.get('reason')?.value;
    this.showOtherReason = selectedReason === 'Other';
    if (!this.showOtherReason) {
      this.appointmentForm.patchValue({ otherReason: '' });
    }
  }

  private normalizedDate(date: string): string {
    if (!date) return '';
    if (date.includes('T')) return date.split('T')[0];
    return date;
  }

  updateAvailableSlots() {
    const doctorID = this.rescheduleAppt ? this.rescheduleAppt.doctorID : this.appointmentForm.get('doctor')?.value;
    const rawDate = this.appointmentForm.get('date')?.value;

    if (!doctorID || !rawDate) {
      this.availableSlotsList = [];
      return;
    }

    const normDate = this.normalizedDate(rawDate);
    console.log(`5. Looking for slots for Doctor [${doctorID}] on Date [${normDate}]`);

    const slots = this.doctorService.getAvailableSlots(doctorID, normDate);

    console.log(`6. Found slots:`, slots);
    this.availableSlotsList = slots || [];
    this.cdr.detectChanges();
  }

  get availableSlots(): string[] {
    return this.availableSlotsList;
  }

  selectTime(slot: string) {
    this.appointmentForm.get('time')?.setValue(slot);
    this.appointmentForm.get('time')?.markAsTouched();
  }

  // UPDATED BOOK METHOD with event preventDefault
  book(event?: Event) {
    if (event) {
      event.preventDefault(); // Stop the browser from refreshing!
    }

    if (this.appointmentForm.invalid) {
      alert('Please fill all required fields');
      return;
    }

    const data = this.appointmentForm.getRawValue();
    const normalizedDate = this.normalizedDate(data.date);
    const doctorID = this.rescheduleAppt ? this.rescheduleAppt.doctorID : data.doctor;

    const doctor = this.doctors.find(d => d.id === doctorID || d._id === doctorID);
    const patient = this.patientService.getLoggedInPatient();

    if (!patient) {
      alert('❌ No patient logged in');
      return;
    }

    const finalReason = data.reason === 'Other' ? data.otherReason : data.reason;

    if (this.rescheduleAppt && this.rescheduleAppt.appointmentID) {
      this.patientService.rescheduleAppointmentDB(this.rescheduleAppt.appointmentID, normalizedDate, data.time)
        .subscribe({
          next: () => {
            alert(`✅ Rescheduled successfully with ${doctor?.name || 'your doctor'} to ${data.date} at ${data.time}`);
            this.location.back(); // Safe auto-back
          },
          error: (err: any) => alert(`❌ Failed to reschedule: ${err.error?.message}`)
        });
    } else {
      const bookingPayload = {
        doctorID: doctorID,
        patientID: patient.patientID,
        appointmentDate: normalizedDate,
        time: data.time,
        reason: finalReason
      };

      this.patientService.bookAppointmentDB(bookingPayload).subscribe({
        next: () => {
          alert(`✅ Appointment requested successfully!`);
          this.location.back(); // Safe auto-back
        },
        error: (err: any) => {
          console.error("Booking failed", err);
          alert(`❌ Failed to book: ${err.error?.message || 'Server error'}`);
        }
      });
    }
  }
}