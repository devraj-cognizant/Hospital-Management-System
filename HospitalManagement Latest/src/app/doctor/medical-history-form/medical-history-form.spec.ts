import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MedicalHistoryForm } from './medical-history-form';

describe('MedicalHistoryForm', () => {
  let component: MedicalHistoryForm;
  let fixture: ComponentFixture<MedicalHistoryForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MedicalHistoryForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MedicalHistoryForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
