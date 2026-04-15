import { Directive, Input, inject, TemplateRef, ViewContainerRef, OnInit, OnDestroy, effect } from '@angular/core';
import { PermissionService } from '../../core/auth/permission.service';

/**
 * Structural directive to conditionally render elements based on tool permissions.
 *
 * Usage:
 *   <div *appHasPermission="'users'">Only visible if user has 'users' tool access</div>
 *   <button *appHasPermission="'settings'">Settings</button>
 */
@Directive({
  selector: '[appHasPermission]',
  standalone: true,
})
export class HasPermissionDirective implements OnInit, OnDestroy {
  private readonly permissions = inject(PermissionService);
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private toolKey = '';
  private isRendered = false;
  private effectRef: ReturnType<typeof effect> | null = null;

  @Input()
  set appHasPermission(key: string) {
    this.toolKey = key;
  }

  ngOnInit(): void {
    this.effectRef = effect(() => {
      const hasAccess = this.permissions.allowedTools().includes(this.toolKey);
      if (hasAccess && !this.isRendered) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.isRendered = true;
      } else if (!hasAccess && this.isRendered) {
        this.viewContainer.clear();
        this.isRendered = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.effectRef?.destroy();
  }
}
