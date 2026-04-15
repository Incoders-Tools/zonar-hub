import { Component, input, output, computed, signal, effect } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { MatIcon } from '@angular/material/icon';
import {
  PLATFORM_TOOLS,
  ToolPermission,
  AppModule,
  getToolsByModule
} from '../../../core/auth/permissions.model';

export interface ModuleGroup {
  module: AppModule;
  labelKey: string;
  tools: ToolPermission[];
}

const MODULE_LABELS: Record<AppModule, string> = {
  dashboard: 'admin.permissions.module.dashboard',
  circuit: 'admin.permissions.module.circuit',
  catalog: 'admin.permissions.module.catalog',
  system: 'admin.permissions.module.system'
};

const MODULE_ORDER: AppModule[] = ['dashboard', 'circuit', 'catalog', 'system'];

@Component({
  selector: 'app-permission-matrix',
  standalone: true,
  imports: [TranslatePipe, MatIcon],
  templateUrl: './permission-matrix.component.html',
  styleUrl: './permission-matrix.component.scss'
})
export class PermissionMatrixComponent {
  readonly value = input<string[]>([]);
  readonly disabled = input(false);
  readonly restrictToTools = input<string[] | null>(null);
  readonly changed = output<string[]>();

  readonly selectedTools = signal<string[]>([]);
  private readonly expandedModules = signal<Set<AppModule>>(new Set(MODULE_ORDER));

  constructor() {
    effect(() => {
      this.selectedTools.set([...(this.value() || [])]);
    });
  }

  readonly availableTools = computed(() => {
    const restrict = this.restrictToTools();
    if (restrict) {
      return PLATFORM_TOOLS.filter(t => restrict.includes(t.key));
    }
    return [...PLATFORM_TOOLS];
  });

  readonly moduleGroups = computed<ModuleGroup[]>(() => {
    const available = new Set(this.availableTools().map(t => t.key));
    return MODULE_ORDER
      .map(module => ({
        module,
        labelKey: MODULE_LABELS[module],
        tools: getToolsByModule(module).filter(t => available.has(t.key))
      }))
      .filter(g => g.tools.length > 0);
  });

  isToolSelected(key: string): boolean {
    return this.selectedTools().includes(key);
  }

  isModuleFullySelected(module: AppModule): boolean {
    const tools = this.getModuleAvailableTools(module);
    const selected = new Set(this.selectedTools());
    return tools.length > 0 && tools.every(t => selected.has(t.key));
  }

  isModulePartiallySelected(module: AppModule): boolean {
    const tools = this.getModuleAvailableTools(module);
    const selected = new Set(this.selectedTools());
    const count = tools.filter(t => selected.has(t.key)).length;
    return count > 0 && count < tools.length;
  }

  getModuleSelectedCount(module: AppModule): number {
    const tools = this.getModuleAvailableTools(module);
    const selected = new Set(this.selectedTools());
    return tools.filter(t => selected.has(t.key)).length;
  }

  toggleTool(key: string, event: Event): void {
    event.stopPropagation();
    const current = this.selectedTools();
    const next = current.includes(key)
      ? current.filter(k => k !== key)
      : [...current, key];
    this.selectedTools.set(next);
    this.changed.emit(next);
  }

  toggleModule(module: AppModule, event: Event): void {
    event.stopPropagation();
    const checked = (event.target as HTMLInputElement).checked;
    const tools = this.getModuleAvailableTools(module);
    const toolKeys = tools.map(t => t.key);
    const current = this.selectedTools();

    let next: string[];
    if (checked) {
      const set = new Set([...current, ...toolKeys]);
      next = [...set];
    } else {
      next = current.filter(k => !toolKeys.includes(k));
    }
    this.selectedTools.set(next);
    this.changed.emit(next);
  }

  isExpanded(module: AppModule): boolean {
    return this.expandedModules().has(module);
  }

  toggleExpand(module: AppModule): void {
    const current = new Set(this.expandedModules());
    if (current.has(module)) {
      current.delete(module);
    } else {
      current.add(module);
    }
    this.expandedModules.set(current);
  }

  selectAll(): void {
    const all = this.availableTools().map(t => t.key);
    this.selectedTools.set(all);
    this.changed.emit(all);
  }

  deselectAll(): void {
    this.selectedTools.set([]);
    this.changed.emit([]);
  }

  private getModuleAvailableTools(module: AppModule): ToolPermission[] {
    const available = new Set(this.availableTools().map(t => t.key));
    return getToolsByModule(module).filter(t => available.has(t.key));
  }
}
