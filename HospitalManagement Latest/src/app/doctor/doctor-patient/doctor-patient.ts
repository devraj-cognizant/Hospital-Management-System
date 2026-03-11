import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core'; // ✅ Added ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientRecord } from '../../model/patient-history';
import { Subscription } from 'rxjs';
import { MedicalHistoryService } from '../../services/medical-history';
import { DoctorService } from '../../services/doctor';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-doctor-patient',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './doctor-patient.html',
  styleUrls: ['./doctor-patient.css'],
})
export class DoctorPatient implements OnInit, OnDestroy {
  patients: PatientRecord[] = [];
  searchTerm = '';
  sortDescending = true;
  filterStartDate = '';
  filterEndDate = '';

  private subscription?: Subscription;

  constructor(
    private historyService: MedicalHistoryService,
    private doctorService: DoctorService,
    private cdr: ChangeDetectorRef, // Inject ChangeDetectorRef
  ) {}

  ngOnInit() {
    // 1. Subscribe to the history stream
    this.subscription = this.historyService.patients$.subscribe((updatedPatients: any) => {
      console.log('🎨 UI updating with data:', updatedPatients);
      this.patients = updatedPatients;

      // Force Angular to refresh the screen
      this.cdr.detectChanges();
    });

    // 2. Fetch data from DB
    const doctor = this.doctorService.getLoggedInDoctor();
    if (doctor && doctor.id) {
      this.historyService.fetchPatientsFromDB(doctor.id);
    }
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  onSearch(term: string) {
    this.searchTerm = term.toLowerCase();
  }

  private toTime(date: string | Date | undefined) {
    if (!date) return 0;
    const time = new Date(date).getTime();
    return isNaN(time) ? 0 : time;
  }

  /**
   * Improved Getter with safety checks for "N/A" values
   */
  get filteredPatients(): PatientRecord[] {
    if (!this.patients) return [];

    return this.patients.filter((p: any) => {
      // Safety check: ensure p.name exists before calling toLowerCase
      const name = p.name ? p.name.toLowerCase() : '';

      const matchesText =
        !this.searchTerm ||
        name.includes(this.searchTerm) ||
        (p.history &&
          p.history.some((h: any) => h.diagnosis?.toLowerCase().includes(this.searchTerm)));

      const start = this.filterStartDate ? this.toTime(this.filterStartDate) : -Infinity;
      const end = this.filterEndDate ? this.toTime(this.filterEndDate) : Infinity;

      // Ensure history exists and is an array
      const historyArr = p.history || [];
      const matchesDate =
        historyArr.length === 0 ||
        historyArr.some((h: any) => {
          const visitTime = this.toTime(h.dateOfVisit);
          return visitTime >= start && visitTime <= end;
        });

      return matchesText && matchesDate;
    });
  }

  toggleSort() {
    this.sortDescending = !this.sortDescending;
    this.patients = [...this.patients].sort((a, b) => {
      const aHistory = a.history || [];
      const bHistory = b.history || [];
      const aLatest = Math.max(0, ...aHistory.map((h: any) => this.toTime(h.dateOfVisit)));
      const bLatest = Math.max(0, ...bHistory.map((h: any) => this.toTime(h.dateOfVisit)));
      return this.sortDescending ? bLatest - aLatest : aLatest - bLatest;
    });
    this.cdr.detectChanges();
  }

  clearFilters() {
    this.searchTerm = '';
    this.filterStartDate = '';
    this.filterEndDate = '';
    this.cdr.detectChanges();
  }

  downloadPdf(patient: PatientRecord) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // 1. Subtle Page Background & Border
  doc.setFillColor(252, 254, 255); // Ultra-light blue tint
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Double Frame Border for professional look
  doc.setDrawColor(44, 62, 80);
  doc.setLineWidth(0.4);
  doc.rect(5, 5, pageWidth - 10, pageHeight - 10); 
  doc.setDrawColor(41, 128, 185);
  doc.setLineWidth(0.1);
  doc.rect(7, 7, pageWidth - 14, pageHeight - 14);

  // 2. Header Branding Section (Filling the top)
  doc.setFillColor(44, 62, 80);
  doc.rect(14, 15, 40, 8, 'F'); // Mock Logo Box
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('HEALTHLINK', 18, 21);

  doc.setFontSize(24);
  doc.setTextColor(41, 128, 185);
  doc.setFont('helvetica', 'bold');
  doc.text('MEDICAL VISIT SUMMARY', 60, 22);
  
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.setFont('helvetica', 'normal');
  doc.text('Authorized Physician Record | Electronic Health Document', 60, 27);

  // 3. Prominent Patient Info Box (Fills more vertical space)
  doc.setFillColor(240, 244, 248);
  doc.roundedRect(14, 35, pageWidth - 28, 35, 3, 3, 'F');
  
  doc.setFontSize(11);
  doc.setTextColor(44, 62, 80);
  doc.setFont('helvetica', 'bold');
  doc.text('PATIENT DEMOGRAPHICS', 20, 42);
  
  doc.setDrawColor(41, 128, 185);
  doc.setLineWidth(0.5);
  doc.line(20, 44, 50, 44);

  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'normal');
  
  // Column 1
  doc.text(`Patient Name:  ${patient.name}`, 20, 52);
  doc.text(`Patient ID:        ${patient.id}`, 20, 59);
  doc.text(`Contact:            ${patient.contact || 'N/A'}`, 20, 66);

  // Column 2
  doc.text(`Age / Gender:  ${patient.age || 'N/A'} / ${patient.gender}`, 110, 52);
  
  doc.text(`Date Issued:     ${new Date().toLocaleDateString()}`, 110, 66);

  // 4. Clinical History Table
  const historyData = (patient.history || []).map((h: any) => [
    h.diagnosis || 'N/A',
    h.treatment || 'N/A',
    h.dateOfVisit ? new Date(h.dateOfVisit).toLocaleDateString() : 'N/A',
    h.notes || 'No clinical notes provided for this session.',
  ]);

  autoTable(doc, {
    startY: 75,
    head: [['DIAGNOSIS', 'TREATMENT PLAN', 'VISIT DATE', 'PHYSICIAN NOTES']],
    body: historyData,
    theme: 'striped',
    headStyles: {
      fillColor: [44, 62, 80],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 6,
      textColor: [40, 40, 40],
    },
    columnStyles: {
      3: { cellWidth: 65 }, // Wider notes column to fill space
    },
    margin: { left: 14, right: 14 }
  });

  // 5. Signature Section (Anchored to bottom properly)
  const finalY = (doc as any).lastAutoTable.finalY || 150;
  const sigAreaY = pageHeight - 55; // Fixed position at bottom to reduce "empty" look

  // Vertical fill: Add a small "Terms" box if the table is short
  if (finalY < sigAreaY - 20) {
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text('Notes:', 14, finalY + 15);
    doc.text('This document is intended for medical use only. Any unauthorized alteration of this report', 14, finalY + 20);
    doc.text('is strictly prohibited. For inquiries, contact the HealthLink Hospital Administration.', 14, finalY + 24);
  }

  // Physician Signature
  doc.setDrawColor(44, 62, 80);
  doc.setLineWidth(0.5);
  doc.line(pageWidth - 85, sigAreaY, pageWidth - 14, sigAreaY);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(44, 62, 80);
  doc.text('Attending Physician Signature', pageWidth - 85, sigAreaY + 7);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Digitally Signed via HealthLink Secure Portal', pageWidth - 85, sigAreaY + 12);
  doc.text(`Timestamp: ${new Date().toLocaleString()}`, pageWidth - 85, sigAreaY + 16);

  // 6. Footer
  doc.setFontSize(8);
  doc.setTextColor(160);
  doc.text(`HealthLink Portal | Record: ${patient.id} | Page 1 of 1`, pageWidth / 2, pageHeight - 10, { align: 'center' });

  // 7. Save
  doc.save(`Medical_Report_${patient.name.replace(/\s+/g, '_')}.pdf`);
}
}
