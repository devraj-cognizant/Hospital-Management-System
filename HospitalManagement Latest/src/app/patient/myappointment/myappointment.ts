import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Appointment } from '../../model/appointment';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PatientService } from '../../services/patient-service';
import { Router } from '@angular/router';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-myappointment',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './myappointment.html',
  styleUrls: ['./myappointment.css'],
})
export class Myappointment implements OnInit {
  today: string = new Date().toISOString().split('T')[0];
  appointments: Appointment[] = [];
  medicalHistories: any[] = [];

  constructor(
    private patientService: PatientService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    const patient = this.patientService.getLoggedInPatient();
    if (!patient) return;

    // 1. Load Appointments
    this.patientService.getPatientAppointmentsDB(patient.patientID).subscribe({
      next: (res: any) => {
        this.appointments = res.appointments || res || [];
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error("Error fetching appointments", err)
    });

    // 2. Load Clinical Records from 'medicalhistories' collection
    this.patientService.getMedicalHistoryDB(patient.patientID).subscribe({
      next: (res: any) => {
        // Updated to handle both array and object responses
        this.medicalHistories = Array.isArray(res) ? res : (res.histories || res.medicalhistories || []);
        console.log("Clinical records loaded:", this.medicalHistories);
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error("Error fetching clinical records", err)
    });
  }

  // --- Filtering Logic ---
  get upcomingAppointments(): Appointment[] {
  return this.appointments.filter((a: any) => {
    const s = a.status?.toLowerCase() || '';
    const apptDate = a.appointmentDate ? a.appointmentDate.split('T')[0] : '';
    return (s === 'scheduled') && apptDate >= this.today;
  });
}



  get completedAppointments(): Appointment[] {
    return this.appointments.filter((a: any) => a.status?.toLowerCase() === 'completed');
  }

  get cancelledAppointments(): Appointment[] {
    return this.appointments.filter((a: any) => a.status?.toLowerCase() === 'cancelled');
  }
  get requestAppointments(): Appointment[] {
    return this.appointments.filter((a: any) => {
      const s = a.status?.toLowerCase() || '';
      const apptDate = a.appointmentDate ? a.appointmentDate.split('T')[0] : '';
      return (s === 'requested' || s === 'pending') && apptDate >= this.today;
    });
  }


  // --- Actions ---
  promptCancel(appt: Appointment) {
    if (window.confirm('Are you sure you want to cancel?')) {
      const reason = prompt('Reason for cancellation:');
      if (reason !== null) {
        this.patientService.cancelAppointmentDB(appt.appointmentID).subscribe({
          next: () => {
            alert(`❌ Appointment cancelled.`);
            this.loadData();
          },
          error: (err: any) => alert(`Error: ${err.error?.message}`)
        });
      }
    }
  }

  requestReschedule(appt: Appointment, event?: Event) {
    if (event) event.preventDefault();
    if (appt.rescheduleUsed) return alert('⚠️ Reschedule already used.');
    if (window.confirm('Do you want to reschedule?')) {
      this.router.navigate(['/patient/book'], { state: { rescheduleAppt: appt } });
    }
  }

  // --- PDF Generation ---
  downloadReport(appt: any) {
    const patient = this.patientService.getLoggedInPatient();

    /**
     * DATA JOIN: 
     * We link the Appointment card to the record in medicalhistories table
     * using the appointmentID as the key.
     */
    const historyEntry = this.medicalHistories.find(h => h.appointmentID === appt.appointmentID);

    if (!historyEntry) {
      alert("Clinical report is not yet ready for this appointment.");
      return;
    }

    const doc = new jsPDF();

    // PDF Layout Styling
    doc.setFontSize(22);
    doc.setTextColor(41, 128, 185);
    doc.text('Medical Visit Summary', 14, 22);
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 25, 196, 25);

    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.text(`Patient: ${patient?.firstName} ${patient?.lastName}`, 14, 35);
    doc.text(`Doctor: ${historyEntry.doctorName || 'N/A'}`, 120, 35);

    doc.setFont('helvetica', 'normal');
    doc.text(`Date of Visit: ${new Date(historyEntry.dateOfVisit).toLocaleDateString()}`, 14, 42);
    doc.text(`History ID: ${historyEntry.historyID}`, 120, 42);

    const reportData = [
      ['Diagnosis', historyEntry.diagnosis || 'N/A'],
      ['Treatment', historyEntry.treatment || 'N/A'],
      ['Doctor Notes', historyEntry.notes || 'No notes provided'],
      ['Appointment ID', appt.appointmentID]
    ];

    autoTable(doc, {
      startY: 50,
      head: [['Category', 'Details']],
      body: reportData,
      theme: 'grid',
      headStyles: { fillColor: [44, 62, 80], fontSize: 12 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 150;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150);
    doc.text('This is a secure digital record generated from the Patient Portal.', 14, finalY + 10);

    doc.save(`Medical_Report_${appt.appointmentID}.pdf`);
  }
}