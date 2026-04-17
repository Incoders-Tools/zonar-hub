import { Component, inject, signal, computed, HostListener, ElementRef } from '@angular/core';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { ActiveOrganizationService } from '../../../core/services/active-organization.service';

@Component({
  selector: 'app-org-selector',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './org-selector.component.html',
  styleUrl: './org-selector.component.scss'
})
export class OrgSelectorComponent {
  protected readonly activeOrg = inject(ActiveOrganizationService);
  private readonly elRef = inject(ElementRef);

  readonly isOpen = signal(false);

  readonly organizations = this.activeOrg.manageableOrganizations;
  readonly activeOrganization = this.activeOrg.activeOrganization;
  readonly activeOrgId = this.activeOrg.activeOrganizationId;
  readonly primaryOrgId = this.activeOrg.primaryOrganizationId;
  readonly hasMultiple = this.activeOrg.hasMultipleOrganizations;

  /** First two letters of org name for avatar */
  readonly orgInitials = computed(() => {
    const name = this.activeOrg.activeOrganizationName();
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  });

  toggle(): void {
    if (this.organizations().length <= 1) return;
    this.isOpen.update(v => !v);
  }

  selectOrganization(orgId: string): void {
    this.activeOrg.switchOrganization(orgId);
    this.isOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }
}
