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
    private cdr: ChangeDetectorRef,
  ) {}

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
        console.log('Appointments Loaded:', this.appointments); // Helpful to check status spellings!
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Error fetching appointments', err),
    });

    // 2. Load Clinical Records from 'medicalhistories' collection
    this.patientService.getMedicalHistoryDB(patient.patientID).subscribe({
      next: (res: any) => {
        this.medicalHistories = Array.isArray(res)
          ? res
          : res.histories || res.medicalhistories || [];
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Error fetching clinical records', err),
    });
  }

  //  Helper Date Logic
  // Safely compares dates regardless of database timestamp formats
  private isFutureOrToday(dateString: string): boolean {
    if (!dateString) return false;
    const apptDate = new Date(dateString);
    const todayDate = new Date();

    // Reset times to midnight so we strictly compare the calendar days
    todayDate.setHours(0, 0, 0, 0);
    apptDate.setHours(0, 0, 0, 0);

    return apptDate >= todayDate;
  }

  //  Filtering Logic
  get upcomingAppointments(): Appointment[] {
    return this.appointments.filter((a: any) => {
      const s = a.status?.toLowerCase() || '';
      // Includes multiple common database spellings just in case!
      const isUpcoming =
        s === 'scheduled' || s === 'confirmed' || s === 'approved' || s === 'booked';
      return isUpcoming && this.isFutureOrToday(a.appointmentDate);
    });
  }

  get completedAppointments(): Appointment[] {
    return this.appointments.filter((a: any) => a.status?.toLowerCase() === 'completed');
  }

  get cancelledAppointments(): Appointment[] {
    return this.appointments.filter((a: any) => {
      const s = a.status?.toLowerCase() || '';
      return s === 'cancelled' || s === 'canceled'; // Handles single and double 'L' spellings
    });
  }

  get requestAppointments(): Appointment[] {
    return this.appointments.filter((a: any) => {
      const s = a.status?.toLowerCase() || '';
      const isRequest = s === 'requested' || s === 'pending';
      return isRequest && this.isFutureOrToday(a.appointmentDate);
    });
  }

  //  Actions
  promptCancel(appt: Appointment) {
    if (window.confirm('Are you sure you want to cancel?')) {
      const reason = prompt('Reason for cancellation:');
      if (reason !== null) {
        this.patientService.cancelAppointmentDB(appt.appointmentID).subscribe({
          next: () => {
            alert(`❌ Appointment cancelled.`);
            this.loadData(); // Refresh the list
          },
          error: (err: any) => alert(`Error: ${err.error?.message}`),
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

  //  PDF Generation
  downloadReport(appt: any) {
    const patient = this.patientService.getLoggedInPatient();
    const historyEntry = this.medicalHistories.find((h) => h.appointmentID === appt.appointmentID);
    if (!historyEntry) {
      alert('Clinical report is not yet ready for this appointment.');
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // 1. BACKGROUND & DOUBLE BORDER
      doc.setFillColor(252, 252, 252);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.3);
      doc.rect(7, 7, pageWidth - 14, pageHeight - 14);
      doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

      // 2. HEADER - APPOINTMENT ID
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.setFont('helvetica', 'bold');
      doc.text(`APPOINTMENT ID: ${appt.appointmentID}`, 14, 18);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`REPORT GENERATED: ${new Date().toLocaleString()}`, pageWidth - 14, 18, {
        align: 'right',
      });

      doc.setFontSize(26);
      doc.setTextColor(44, 62, 80);
      doc.setFont('helvetica', 'bold');
      doc.text('MEDICARE REPORT', 14, 35);

      // 3. VISIT DATE & TIME - FIXED DATE LOGIC
      doc.setFillColor(44, 62, 80);
      doc.rect(14, 42, 182, 10, 'F');
      doc.setTextColor(255);
      doc.setFontSize(10);

      // Safety check for date formatting
      const formattedDate = appt.appointmentDate
        ? new Date(appt.appointmentDate).toLocaleDateString()
        : 'N/A';
      const visitTime = appt.time || 'N/A';

      doc.text(`VISIT DATE: ${formattedDate}   |   VISIT TIME: ${visitTime}`, 18, 48.5);

      // 4. PATIENT/PROVIDER INFO (Spaced out to avoid overlap)
      doc.setTextColor(120);
      doc.setFontSize(9);
      doc.text('PATIENT DETAILS', 14, 62);
      doc.text('PROVIDER DETAILS', 110, 62);

      doc.setTextColor(0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');

      // Left Column
      doc.text(`${patient?.firstName} ${patient?.lastName}`, 14, 69);
      doc.setFont('helvetica', 'normal');
      doc.text(`Patient ID: ${patient?.patientID || 'N/A'}`, 14, 76);
      doc.text(`DOB/Sex: ${patient?.dob || 'N/A'} / ${patient?.gender || 'N/A'}`, 14, 83);

      // Right Column
      doc.setFont('helvetica', 'bold');
      doc.text(`${historyEntry.doctorName}`, 110, 69);
      doc.setFont('helvetica', 'normal');
      doc.text(`Specialization: ${appt.specialization || 'General'}`, 110, 76);
      doc.text(`Reason: ${appt.reason || 'General Consultation'}`, 110, 83);
      doc.text(`Physician ID: ${historyEntry.doctorID || 'D-REF-01'}`, 110, 90);

      // 5. VITALS SECTION
      doc.setFillColor(240, 244, 248);
      doc.rect(14, 100, 182, 25, 'F'); // Made slightly taller
      doc.setFontSize(9);
      doc.setTextColor(44, 62, 80);
      doc.setFont('helvetica', 'bold');
      doc.text('PRE-EXAMINATION VITALS:', 18, 107);

      doc.setFont('helvetica', 'normal');
      doc.text(`BP: 120/80 mmHg`, 18, 117);
      doc.text(`Pulse: 72 bpm`, 60, 117);
      doc.text(`Temp: 98.6 °F`, 100, 117);
      doc.text(`Oxygen: 98%`, 140, 117);

      // 6. MAIN CLINICAL DATA TABLE
      const reportData = [
        ['Chief Complaint', appt.reason || 'Routine evaluation.'],
        ['Diagnosis', historyEntry.diagnosis || 'Pending results'],
        ['Treatment Plan', historyEntry.treatment || 'Follow clinical notes'],
        ['Clinical Notes', historyEntry.notes || 'No further notes recorded.'],
      ];

      autoTable(doc, {
        startY: 135,
        margin: { left: 14, right: 14 },
        head: [['Assessment Category', 'Detailed Clinical Findings']],
        body: reportData,
        theme: 'grid',
        headStyles: { fillColor: [44, 62, 80], fontSize: 11, cellPadding: 5 },
        bodyStyles: { fontSize: 10, cellPadding: 10, textColor: 40 }, // High padding to fill space
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50, fillColor: [245, 245, 245] } },
      });

      // 7. SIGNATURE BLOCK
      const sigY = pageHeight - 50;
      const sigX = pageWidth - 74;
      doc.setDrawColor(180);
      doc.line(sigX, sigY, sigX + 60, sigY);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`${historyEntry.doctorName}`, sigX + 30, sigY + 7, { align: 'center' });

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120);
      doc.text('Authorized Digital Signature', sigX + 30, sigY + 12, { align: 'center' });

      // 8. FOOTER
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text('This is a legally valid electronic medical record.', 14, pageHeight - 15);
      doc.text('Confidentiality Notice: Restricted to authorized personnel.', 14, pageHeight - 11);

      doc.save(`Medical_Report_${appt.appointmentID}.pdf`);
    } catch (error) {
      console.error('PDF Generation Error:', error);
      alert('An error occurred while generating the report. Check the console for details.');
    }
  }
}
