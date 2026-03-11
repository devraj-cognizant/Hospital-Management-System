import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { PatientService } from '../../services/patient-service';
import { Patient } from '../../model/patient';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class Profile implements OnInit {
  patient!: Patient;
  profileForm!: FormGroup;
  editing = false;
  today = new Date().toISOString().split('T')[0];
  isLoading = true;

  constructor(
    private patientService: PatientService,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit() {
    this.patientService.getProfile().subscribe({
      next: (data) => {
        setTimeout(() => {
          this.patient = data;
          this.initializeForm();
          this.isLoading = false;
          this.cdr.detectChanges(); 
        }, 0);
      },
      error: (err) => {
        console.error("Failed to load profile", err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

initializeForm() {
    this.profileForm = new FormGroup({
      firstName: new FormControl(this.patient.firstName, Validators.required),
      lastName: new FormControl(this.patient.lastName, Validators.required),
      // Email is always disabled because users shouldn't change their login email easily
      email: new FormControl({ value: this.patient.email, disabled: true }, [Validators.required, Validators.email]),
      phone: new FormControl(this.patient.phone, [Validators.required, Validators.pattern(/^\d{10}$/)]),
      dob: new FormControl(this.patient.dob, Validators.required),
      
      // Start these as disabled in TypeScript so Angular can control them
      gender: new FormControl({ value: this.patient.gender, disabled: true }, Validators.required),
      bloodGroup: new FormControl({ value: this.patient.bloodGroup, disabled: true }, Validators.required),
      
      //  REMOVED Validators.pattern so an empty box doesn't break the form
      emergencyContact: new FormControl(this.patient.emergencyContact),
      
      //  REMOVED Validators.required so an empty address doesn't block the Save button
      address: new FormControl(this.patient.address)
    });
  }

  //  This function now properly tells Angular to enable/disable the dropdowns
  toggleEdit() {
    this.editing = !this.editing;
    
    if (this.editing) {
      // User clicked "Edit Profile", unlock the dropdowns
      this.profileForm.get('gender')?.enable();
      this.profileForm.get('bloodGroup')?.enable();
    } else {
      // User clicked "Cancel", revert the data to original and lock dropdowns
      this.profileForm.patchValue(this.patient);
      this.profileForm.get('gender')?.disable();
      this.profileForm.get('bloodGroup')?.disable();
    }
  }

  saveProfile() {
    if (this.profileForm.valid) {
      // getRawValue() grabs everything, even the disabled email field!
      const updated = { ...this.patient, ...this.profileForm.getRawValue() };
      
      this.patientService.updateProfile(updated).subscribe({
        next: (response) => {
          // Your backend sends back { message: "...", user: {...} }
          // We take the freshly saved user from the database and update the screen
          this.patient = response.user; 
          
          alert('Profile updated successfully in the Database!');
          
          // Turn off editing mode and lock the dropdowns again
          this.editing = false;
          this.profileForm.get('gender')?.disable();
          this.profileForm.get('bloodGroup')?.disable();
          this.profileForm.markAsPristine();
        },
        error: (err) => {
          console.error("Save Error", err);
          alert('Error updating profile: ' + (err.error?.message || 'Server error'));
        }
      });
    }
  }
}