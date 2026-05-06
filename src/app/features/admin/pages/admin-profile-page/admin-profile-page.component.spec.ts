import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { AdminProfilePageComponent } from './admin-profile-page.component';

describe('AdminProfilePageComponent', () => {
  let component: AdminProfilePageComponent;
  let fixture: ComponentFixture<AdminProfilePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminProfilePageComponent],
      providers: [provideHttpClient()]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminProfilePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should compute initials from user name', () => {
    expect(component.initials()).toBeTruthy();
  });
});
