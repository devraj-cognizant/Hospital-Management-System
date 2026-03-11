import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, FormsModule, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Patient } from '../../model/patient';
import { PatientService } from '../../services/patient-service';
import { Router, RouterModule } from '@angular/router';
import {v4 as uuidv4} from 'uuid';

// 1. Define Enum for clarity
export enum AuthTab {
  Login = 'login',
  Register = 'register'
}

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
  // 2. Expose Enum to the template so it can be used in *ngIf
  public AuthTab = AuthTab;
  
  // 3. Update activeTab to use the Enum type
  activeTab: AuthTab = AuthTab.Login;

  today = new Date().toISOString().split('T')[0];

  // FIX: Initialize forms immediately right here!
  loginForm: FormGroup = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [
      Validators.required,
      Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/)
    ])
  });

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

  ngOnInit(): void {
  }

  // 4. Update method signature to accept Enum
  switchTab(tab: AuthTab) {
    this.activeTab = tab;
  }

  register() {
    if (this.registerForm.invalid) {
      alert('Please fill all required fields correctlyy');
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
        alert('Registration successful! You can now log in.');
        
        // Clear out the registration form fields
        this.registerForm.reset(); 
        
        // Force the UI to switch to the login tab directly
        this.activeTab = AuthTab.Login; 
      },
      error: (err) => {
        alert('Registration failed: ' + (err.error?.message || 'Server error occurred'));
        console.error('Registration Error:', err);
      }
    });
  }

  login() {
    if (this.loginForm.invalid) {
      alert('Please enter a valid email and strong password');
      return;
    }

    const { email, password } = this.loginForm.value;

    this.patientService.login(email, password).subscribe({
      next: (response) => {
        console.log("Full Backend Response:", response);
        // COMPLETELY REMOVED localStorage logic here!

        // Extract the user data from your Node.js response
        const loggedInUser = response.user; 
        
        if (loggedInUser) {
          // Save the user in the service so the rest of the app knows who is logged in
          this.patientService.setCurrentPatient(loggedInUser);
          alert(`Login successful! Welcome ${loggedInUser.firstName} ${loggedInUser.lastName}`);
        } else {
          alert(`Login successful!`);
        }

        // Navigate to the dashboard
        this.router.navigate(['/patient']);
      },
      error: (err) => {
        alert('Login failed: ' + (err.error?.message || 'Invalid credentials'));
        console.error('Login Error:', err);
      }
    });
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}