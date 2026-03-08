import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoctorAvailability } from './doctor-availability';

describe('DoctorAvailability', () => {
  let component: DoctorAvailability;
  let fixture: ComponentFixture<DoctorAvailability>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctorAvailability]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DoctorAvailability);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
