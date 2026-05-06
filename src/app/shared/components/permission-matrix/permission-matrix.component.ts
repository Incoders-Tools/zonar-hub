import { Component, input, output, computed, signal, effect } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { MatIcon } from '@angular/material/icon';
import {
  PLATFORM_TOOLS,
  ToolPermission,
  getToolsByModule
} from '../../../core/auth/permissions.model';
import { PermissionModule, PermissionTool } from '../../../core/models';

export interface ModuleGroup {
  module: string;
  labelKey: string;
  tools: PermissionTool[];
}

const MODULE_LABELS: Record<string, string> = {
  dashboard: 'admin.permissions.module.dashboard',
  circuit: 'admin.permissions.module.circuit',
  catalog: 'admin.permissions.module.catalog',
  system: 'admin.permissions.module.system'
};

const MODULE_ORDER: string[] = ['dashboard', 'circuit', 'catalog', 'system'];

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
  readonly moduleCatalog = input<PermissionModule[] | null>(null);
  readonly disabledToolKeys = input<string[] | null>(null);
  readonly changed = output<string[]>();

  readonly selectedTools = signal<string[]>([]);
  private readonly expandedModules = signal<Set<string>>(new Set());

  constructor() {
    effect(() => {
      this.selectedTools.set([...(this.value() || [])]);
    });
  }

  readonly availableTools = computed(() => {
    const modules = this.catalogModules();
    const allTools = modules.flatMap(module => module.tools);
    const restrict = this.restrictToTools();
    if (restrict) {
      return allTools.filter(tool => restrict.includes(tool.key));
    }
    return allTools;
  });

  readonly moduleGroups = computed<ModuleGroup[]>(() => {
    const available = new Set(this.availableTools().map(tool => tool.key));
    return this.catalogModules()
      .map(module => ({
        module: module.key,
        labelKey: module.labelKey,
        tools: module.tools.filter(tool => available.has(tool.key))
      }))
      .filter(group => group.tools.length > 0);
  });

  isToolSelected(key: string): boolean {
    return this.selectedTools().includes(key);
  }

  isModuleFullySelected(module: string): boolean {
    const tools = this.getSelectableModuleTools(module);
    const selected = new Set(this.selectedTools());
    return tools.length > 0 && tools.every(tool => selected.has(tool.key));
  }

  isModulePartiallySelected(module: string): boolean {
    const tools = this.getSelectableModuleTools(module);
    const selected = new Set(this.selectedTools());
    const count = tools.filter(tool => selected.has(tool.key)).length;
    return count > 0 && count < tools.length;
  }

  isModuleSelectionDisabled(module: string): boolean {
    if (this.disabled()) {
      return true;
    }

    const tools = this.getModuleAvailableTools(module);
    return tools.length === 0 || tools.every(tool => this.isToolDisabled(tool.key));
  }

  getModuleSelectedCount(module: string): number {
    const tools = this.getModuleAvailableTools(module);
    const selected = new Set(this.selectedTools());
    return tools.filter(tool => selected.has(tool.key)).length;
  }

  toggleTool(key: string, event: Event): void {
    event.stopPropagation();
    if (this.isToolDisabled(key)) {
      return;
    }

    const current = this.selectedTools();
    const next = current.includes(key)
      ? current.filter(k => k !== key)
      : [...current, key];
    this.selectedTools.set(next);
    this.changed.emit(next);
  }

  toggleModule(module: string, event: Event): void {
    event.stopPropagation();
    const checked = (event.target as HTMLInputElement).checked;
    const tools = this.getSelectableModuleTools(module);
    const toolKeys = tools.map(tool => tool.key);
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

  isExpanded(module: string): boolean {
    return this.expandedModules().has(module);
  }

  toggleExpand(module: string): void {
    const current = new Set(this.expandedModules());
    if (current.has(module)) {
      current.delete(module);
    } else {
      current.add(module);
    }
    this.expandedModules.set(current);
  }

  selectAll(): void {
    const all = this.availableTools()
      .filter(tool => !this.isToolDisabled(tool.key))
      .map(tool => tool.key);
    this.selectedTools.set(all);
    this.changed.emit(all);
  }

  deselectAll(): void {
    this.selectedTools.set([]);
    this.changed.emit([]);
  }

  isToolDisabled(toolKey: string): boolean {
    if (this.disabled()) {
      return true;
    }

    const disabledTools = new Set(this.disabledToolKeys() ?? []);
    return disabledTools.has(toolKey);
  }

  private getModuleAvailableTools(module: string): PermissionTool[] {
    const group = this.moduleGroups().find(item => item.module === module);
    return group?.tools ?? [];
  }

  private getSelectableModuleTools(module: string): PermissionTool[] {
    return this.getModuleAvailableTools(module)
      .filter(tool => !this.isToolDisabled(tool.key));
  }

  private catalogModules(): PermissionModule[] {
    const catalog = this.moduleCatalog();
    if (catalog && catalog.length > 0) {
      return [...catalog]
        .sort((left, right) => left.sortOrder - right.sortOrder);
    }

    return MODULE_ORDER.map((module, index) => ({
      key: module,
      labelKey: MODULE_LABELS[module],
      sortOrder: index + 1,
      isActive: true,
      tools: getToolsByModule(module as ToolPermission['module']).map(tool => this.toPermissionTool(tool))
    }));
  }

  private toPermissionTool(tool: ToolPermission): PermissionTool {
    return {
      key: tool.key,
      moduleKey: tool.module,
      labelKey: tool.labelKey,
      route: tool.route,
      sortOrder: 0,
      isSystemAdminOnly: false,
      isActive: true
    };
  }
}
