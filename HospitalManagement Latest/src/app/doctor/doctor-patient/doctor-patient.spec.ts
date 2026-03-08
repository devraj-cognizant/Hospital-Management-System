import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoctorPatient } from './doctor-patient';

describe('DoctorPatient', () => {
  let component: DoctorPatient;
  let fixture: ComponentFixture<DoctorPatient>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctorPatient]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DoctorPatient);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
