import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminTeamsPageComponent } from './admin-teams-page.component';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('AdminTeamsPageComponent', () => {
  let component: AdminTeamsPageComponent;
  let fixture: ComponentFixture<AdminTeamsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminTeamsPageComponent],
      providers: [provideAnimations(), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminTeamsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render title', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.teams-page__title')).toBeTruthy();
  });

  it('should show form panel when openCreate is called', () => {
    component.openCreate();
    expect(component.showFormPanel()).toBe(true);
    expect(component.editingTeam()).toBeNull();
  });

  it('should hide form panel when closeFormPanel is called', () => {
    component.openCreate();
    component.closeFormPanel();
    expect(component.showFormPanel()).toBe(false);
  });

  it('should track selected rows', () => {
    const rows = [{ id: 'tm1', name: 'Test Team' } as any];
    component.onSelectionChanged(rows);
    expect(component.hasSelection()).toBe(true);
  });
});
