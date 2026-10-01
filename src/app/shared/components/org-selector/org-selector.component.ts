import { Component, inject, signal, computed, HostListener, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { ActiveOrganizationService } from '../../../core/services/active-organization.service';
import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-org-selector',
  standalone: true,
  imports: [TranslatePipe, FormsModule, ConfirmDialogComponent],
  templateUrl: './org-selector.component.html',
  styleUrl: './org-selector.component.scss'
})
export class OrgSelectorComponent {
  protected readonly activeOrg = inject(ActiveOrganizationService);
  private readonly elRef = inject(ElementRef);
  private readonly auth = inject(AuthService);
  private readonly notification = inject(NotificationService);

  readonly isOpen = signal(false);
  readonly searchQuery = signal('');
  readonly pendingPrimaryId = signal<string | null>(null);
  readonly savingPrimary = signal(false);
  readonly canSetPrimary = computed(() => this.auth.isAdmin() && this.activeOrg.primaryEligibleOrganizations().length > 1);
  readonly hasMultiplePrimaryEligible = computed(() => this.activeOrg.primaryEligibleOrganizations().length > 1);
  readonly primaryEligibleIds = computed(() => new Set(this.activeOrg.primaryEligibleOrganizations().map(org => org.id)));

  readonly organizations = computed(() => {
    const primaryId = this.activeOrg.primaryOrganizationId();
    return [...this.activeOrg.manageableOrganizations()].sort((a, b) =>
      Number(b.id === primaryId) - Number(a.id === primaryId));
  });
  readonly activeOrganization = this.activeOrg.activeOrganization;
  readonly activeOrgId = this.activeOrg.activeOrganizationId;
  readonly primaryOrgId = this.activeOrg.primaryOrganizationId;
  readonly hasMultiple = this.activeOrg.hasMultipleOrganizations;

  /** Show search input when there are more than 5 organizations */
  readonly showSearch = computed(() => this.organizations().length > 5);

  /** Organizations filtered by the search query */
  readonly filteredOrganizations = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) return this.organizations();
    return this.organizations().filter(o => o.name.toLowerCase().includes(query));
  });

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
    if (!this.isOpen()) {
      this.searchQuery.set('');
    }
  }

  selectOrganization(orgId: string): void {
    this.activeOrg.switchOrganization(orgId);
    this.isOpen.set(false);
    this.searchQuery.set('');
  }

  requestPrimary(orgId: string): void {
    if (!this.canSetPrimary() || !this.primaryEligibleIds().has(orgId) || this.savingPrimary() || this.primaryOrgId() === orgId) return;
    if (this.primaryOrgId() === null) {
      void this.savePrimary(orgId);
    } else {
      this.pendingPrimaryId.set(orgId);
    }
  }

  async confirmPrimary(): Promise<void> {
    const id = this.pendingPrimaryId();
    if (!id || this.savingPrimary()) return;
    await this.savePrimary(id);
  }

  private async savePrimary(id: string): Promise<void> {
    this.savingPrimary.set(true);
    try {
      await this.activeOrg.setPrimaryOrganization(id);
      this.pendingPrimaryId.set(null);
      this.notification.success('org.selector.primarySuccess');
    } catch {
      this.notification.error('org.selector.primaryError');
    } finally {
      this.savingPrimary.set(false);
    }
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
      this.searchQuery.set('');
    }
  }
}
