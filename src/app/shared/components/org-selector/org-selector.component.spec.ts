import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrgSelectorComponent } from './org-selector.component';
import { ActiveOrganizationService } from '../../../core/services/active-organization.service';
import { computed, signal } from '@angular/core';

describe('OrgSelectorComponent', () => {
  let component: OrgSelectorComponent;
  let fixture: ComponentFixture<OrgSelectorComponent>;

  const mockActiveOrgService = {
    activeOrganization: signal(null),
    activeOrganizationId: signal(null),
    activeOrganizationName: signal(''),
    primaryOrganizationId: signal(null),
    manageableOrganizations: signal([]),
    hasMultipleOrganizations: signal(false),
    switchOrganization: jasmine.createSpy('switchOrganization')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrgSelectorComponent],
      providers: [
        { provide: ActiveOrganizationService, useValue: mockActiveOrgService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OrgSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
