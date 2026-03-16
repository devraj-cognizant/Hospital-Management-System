import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, FormsModule, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Patient } from '../../model/patient';
import { PatientService } from '../../services/patient-service';
import { Router, RouterModule } from '@angular/router';
import { v4 as uuidv4 } from 'uuid';

// Custom validator for matching password & confirmPassword
export const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password && confirmPassword && password !== confirmPassword
    ? { passwordMismatch: true }
    : null;
};

@Component({
  selector: 'app-patient-auth',
  standalone: true,
  imports: [FormsModule, CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './patient-auth.html',
  styleUrls: ['./patient-auth.css'],
})
export class PatientAuth implements OnInit {
  
  today = new Date().toISOString().split('T')[0];

  registerForm: FormGroup = new FormGroup({
    firstName: new FormControl('', [Validators.required, Validators.pattern(/^[A-Za-z]+$/)]),
    lastName: new FormControl('', [Validators.required, Validators.pattern(/^[A-Za-z]+$/)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    phone: new FormControl('', [Validators.required, Validators.pattern(/^\d{10}$/)]),
    dob: new FormControl('', Validators.required),
    gender: new FormControl('', Validators.required),
    bloodGroup: new FormControl('', Validators.required),
    address: new FormControl(''),
    emergencyContact: new FormControl('', [Validators.pattern(/^\d{10}$/)]),
    password: new FormControl('', [
      Validators.required,
      Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/)
    ]),
    confirmPassword: new FormControl('', Validators.required)
  }, { validators: passwordMatchValidator });

  constructor(
    private patientService: PatientService,
    private router: Router
  ) {}

  ngOnInit(): void {}

  register() {
    if (this.registerForm.invalid) {
      alert('Please fill all required fields correctly');
      return;
    }

    const formValue = this.registerForm.value;

    const newPatient: Patient = {
      patientID: uuidv4(),
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      phone: formValue.phone,
      dob: formValue.dob,
      gender: formValue.gender,
      bloodGroup: formValue.bloodGroup,
      address: formValue.address,
      emergencyContact: formValue.emergencyContact,
      password: formValue.password,
      medicalHistory: undefined
    };

    this.patientService.register(newPatient).subscribe({
      next: (response) => {
        alert('Registration successful! Redirecting to secure login...');
        this.registerForm.reset(); 
        
        //  Redirect straight to your shiny new Unified Login Page!
        this.router.navigate(['/login']); 
      },
      error: (err) => {
        alert('Registration failed: ' + (err.error?.message || 'Server error occurred'));
        console.error('Registration Error:', err);
      }
    });
  }

  goBack() {
    // Also update the back button to safely return to the login page
    this.router.navigate(['/login']);
  }
}