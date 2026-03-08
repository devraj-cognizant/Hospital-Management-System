import { Routes } from '@angular/router';
import { Profile } from './patient/profile/profile';
import { Bookappointment } from './patient/bookappointment/bookappointment';
import { Myappointment } from './patient/myappointment/myappointment';

import { PatientDashboard } from './patient/patient-dashboard/patient-dashboard';
import { LoginSelection } from './login-selection/login-selection';
import { DoctorAppointment } from './doctor/doctor-appointment/doctor-appointment';
import { DoctorAvailability } from './doctor/doctor-availability/doctor-availability';
import { DoctorPatient } from './doctor/doctor-patient/doctor-patient';
import { Landing } from './landing/landing';
import { Doctordashboard } from './doctor/doctordashboard/doctordashboard';
 
 
import { PatientAuth } from './patient/patient-auth/patient-auth';
import { DoctorLogin } from './doctor/doctor-login/doctor-login';
 
export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', loadComponent: () => import('./landing/landing').then(c => c.Landing) },
  { path: 'login', loadComponent: () => import('./login-selection/login-selection').then(c => c.LoginSelection) },
   
  // Patient routes
  {path: 'patient/auth', loadComponent: () => import('./patient/patient-auth/patient-auth').then(c => c.PatientAuth)},
  {
    path: 'patient',
    loadComponent: () => import('./patient/patient-dashboard/patient-dashboard').then(c => c.PatientDashboard),
    children: [
      { path: 'profile', loadComponent: () => import('./patient/profile/profile').then(c => c.Profile) },
      { path: 'book', loadComponent: () => import('./patient/bookappointment/bookappointment').then(c => c.Bookappointment) },
      { path: 'appointments', loadComponent: () => import('./patient/myappointment/myappointment').then(c => c.Myappointment) },
     
      { path: '', redirectTo: 'profile', pathMatch: 'full' },
    ],
  },
 
 
  // Doctor routes
  {path: 'doctor/login', loadComponent: () => import('./doctor/doctor-login/doctor-login').then(c => c.DoctorLogin)},
  {
    path: 'doctor/:id',
    loadComponent: () => import('./doctor/doctordashboard/doctordashboard').then(c => c.Doctordashboard),
    children: [
      { path: 'appointment', loadComponent: () => import('./doctor/doctor-appointment/doctor-appointment').then(c => c.DoctorAppointment) },
      { path: 'availability', loadComponent: () => import('./doctor/doctor-availability/doctor-availability').then(c => c.DoctorAvailability) },
      { path: 'patients', loadComponent: () => import('./doctor/doctor-patient/doctor-patient').then(c => c.DoctorPatient) },
      { path: 'history-form/:appointmentID', loadComponent: () => import('./doctor/medical-history-form/medical-history-form').then(c => c.MedicalHistoryFormComponent) },
      { path: '', redirectTo: 'appointment', pathMatch: 'full' },
    ],
  },
 
  // Wildcard
  { path: '**', redirectTo: '/home' }
];
 