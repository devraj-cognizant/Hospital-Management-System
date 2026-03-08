import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientAuth } from './patient-auth';

describe('PatientAuth', () => {
  let component: PatientAuth;
  let fixture: ComponentFixture<PatientAuth>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientAuth]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientAuth);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
