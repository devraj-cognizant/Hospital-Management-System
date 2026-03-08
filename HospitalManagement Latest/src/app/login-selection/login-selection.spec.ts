import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginSelection } from './login-selection';

describe('LoginSelection', () => {
  let component: LoginSelection;
  let fixture: ComponentFixture<LoginSelection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginSelection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginSelection);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
