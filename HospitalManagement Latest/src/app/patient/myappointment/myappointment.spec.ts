import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Myappointment } from './myappointment';

describe('Myappointment', () => {
  let component: Myappointment;
  let fixture: ComponentFixture<Myappointment>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Myappointment]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Myappointment);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
