import { Injectable, computed, inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Organization } from '../models';

@Injectable({ providedIn: 'root' })
export class OrganizationContextService {
  private readonly auth = inject(AuthService);

  readonly organizationId = computed<string | null>(() =>
    this.auth.session()?.organizationId ?? this.auth.currentUser()?.organizationId ?? null
  );

  readonly organizationName = computed<string>(() =>
    this.auth.session()?.organizationName ?? ''
  );

  readonly hasOrganization = computed<boolean>(() => this.organizationId() !== null);
}
