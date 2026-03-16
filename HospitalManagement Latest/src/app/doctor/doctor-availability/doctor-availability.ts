import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core'; // ✅ Imported ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DoctorService } from '../../services/doctor';

@Component({
  selector: 'app-doctor-availability',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './doctor-availability.html',
  styleUrls: ['./doctor-availability.css'],
})
export class DoctorAvailability implements OnInit {
  @Input() doctorID!: string; 

  today: string = new Date().toISOString().split('T')[0];
  selectedDate: string = '';
  timeSlots: string[] = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
  successMessage: string = '';

  isSaving = false;

  localAvailability: Record<string, { available: string[]; blocked: string[] }> = {};

  // Injected ChangeDetectorRef (cdr) here
  constructor(
    private route: ActivatedRoute, 
    private doctorService: DoctorService,
    private cdr: ChangeDetectorRef 
  ) {
    this.doctorID = this.route.parent?.snapshot.paramMap.get('id') || '';
  }

  ngOnInit() {
    if (this.doctorID) {
      this.doctorService.getAvailabilityFromDB(this.doctorID).subscribe({
        next: (response: any) => {
          this.localAvailability = response.availability || {};
          this.doctorService.updateAvailability(this.doctorID, this.localAvailability);
          this.cdr.detectChanges(); //  Wake up UI
        },
        error: (err) => console.error("Error fetching availability:", err)
      });
    }
  }

  private normalizedDate(date: string) {
    if (!date || isNaN(new Date(date).getTime())) return '';
    return new Date(date).toISOString().split('T')[0];
  }

  get entryForSelectedDate() {
    const normalizedDate = this.normalizedDate(this.selectedDate);
    if (!normalizedDate) return { available: [...this.timeSlots], blocked: [] };

    if (!this.localAvailability[normalizedDate]) {
      this.localAvailability[normalizedDate] = { available: [...this.timeSlots], blocked: [] };
    }
    return this.localAvailability[normalizedDate];
  }

  isPastSlot(slot: string): boolean {
    if (!this.selectedDate) return false;
    const normalizedDate = this.normalizedDate(this.selectedDate);
    if (normalizedDate !== this.today) return false;

    const now = new Date();
    const [hours, minutes] = slot.split(':').map(Number);
    const slotDateTime = new Date();
    slotDateTime.setHours(hours, minutes, 0, 0);

    return slotDateTime.getTime() <= now.getTime();
  }

  isSlotAvailable(slot: string): boolean {
    return this.entryForSelectedDate.available.includes(slot);
  }

  isSlotBlocked(slot: string): boolean {
    return this.entryForSelectedDate.blocked.includes(slot);
  }

  toggleSlot(slot: string) {
    if (this.isPastSlot(slot) || !this.selectedDate) return;
    const entry = this.entryForSelectedDate;

    if (entry.available.includes(slot)) {
      entry.available = entry.available.filter(s => s !== slot);
      entry.blocked.push(slot);
    } else {
      entry.blocked = entry.blocked.filter(s => s !== slot);
      entry.available.push(slot);
    }

    const normalizedDate = this.normalizedDate(this.selectedDate);
    this.localAvailability[normalizedDate] = entry;
  }

  blockAll() {
    const normalizedDate = this.normalizedDate(this.selectedDate);
    this.localAvailability[normalizedDate] = { available: [], blocked: [...this.timeSlots] };
  }

  unblockAll() {
    const normalizedDate = this.normalizedDate(this.selectedDate);
    this.localAvailability[normalizedDate] = { available: [...this.timeSlots], blocked: [] };
  }

  saveAvailability() {
    if (!this.selectedDate) {
      this.successMessage = '⚠️ Please select a date before saving availability.';
      return;
    }

    this.isSaving = true;
    this.successMessage = '';
    this.cdr.detectChanges(); // Tell UI we are starting the save

    this.doctorService.saveAvailabilityToDB(this.doctorID, { availability: this.localAvailability }).subscribe({
      next: () => {
        this.isSaving = false; 
        const normalizedDate = this.normalizedDate(this.selectedDate);
        this.successMessage = `✅ Availability updated for ${normalizedDate} in Database`;
        
        this.doctorService.updateAvailability(this.doctorID, this.localAvailability);
        
        // Tell Angular to refresh the HTML immediately!
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        this.isSaving = false; 
        console.error("Save Error", err);
        this.successMessage = '❌ Error saving availability to server.';
        
        // Tell Angular to refresh the HTML on error too!
        this.cdr.detectChanges(); 
      }
    });
  }
}