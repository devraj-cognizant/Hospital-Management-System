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
    private cdr: ChangeDetectorRef // Inject ChangeDetectorRef
  ) {}

  ngOnInit() {
    // 1. Subscribe to the history stream
    this.subscription = this.historyService.patients$.subscribe((updatedPatients: any) => {
      console.log("🎨 UI updating with data:", updatedPatients);
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
      
      const matchesText = !this.searchTerm || 
        name.includes(this.searchTerm) ||
        (p.history && p.history.some((h: any) => h.diagnosis?.toLowerCase().includes(this.searchTerm)));

      const start = this.filterStartDate ? this.toTime(this.filterStartDate) : -Infinity;
      const end = this.filterEndDate ? this.toTime(this.filterEndDate) : Infinity;

      // Ensure history exists and is an array
      const historyArr = p.history || [];
      const matchesDate = historyArr.length === 0 || historyArr.some((h: any) => {
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
    doc.setFontSize(18);
    doc.text('Patient Medical Report', 14, 20);
    doc.setFontSize(12);
    doc.text(`Name: ${patient.name}`, 14, 30);
    doc.text(`ID: ${patient.id}`, 14, 40);
    doc.text(`Age: ${patient.age}`, 14, 50);
    doc.text(`Gender: ${patient.gender}`, 14, 60);
    
    const historyData = (patient.history || []).map((h: any) => [
      h.diagnosis ?? '',
      h.treatment ?? '',
      h.dateOfVisit ? new Date(h.dateOfVisit).toLocaleDateString() : '',
      h.notes ?? ''
    ]);

    autoTable(doc, {
      head: [['Diagnosis', 'Treatment', 'Date of Visit', 'Notes']],
      body: historyData,
      startY: 70,
    });

    doc.save(`${patient.name.replace(/\s+/g, '_')}_report.pdf`);
  }
}