import { TestBed } from '@angular/core/testing';

import { MedicalHistory } from './medical-history';

describe('MedicalHistory', () => {
  let service: MedicalHistory;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MedicalHistory);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
