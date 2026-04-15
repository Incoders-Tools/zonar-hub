import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PermissionMatrixComponent } from './permission-matrix.component';
import { TranslatePipe } from '../../pipes/translate.pipe';

describe('PermissionMatrixComponent', () => {
  let component: PermissionMatrixComponent;
  let fixture: ComponentFixture<PermissionMatrixComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PermissionMatrixComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PermissionMatrixComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render module groups', () => {
    const groups = component.moduleGroups();
    expect(groups.length).toBeGreaterThan(0);
  });

  it('should initialize with empty selection when no value provided', () => {
    expect(component.selectedTools()).toEqual([]);
  });

  it('should reflect provided value in selectedTools', () => {
    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('value', ['dashboard', 'tournaments']);
    });
    fixture.detectChanges();
    expect(component.selectedTools()).toContain('dashboard');
    expect(component.selectedTools()).toContain('tournaments');
  });

  it('should toggle a tool on', () => {
    const spy = spyOn(component.changed, 'emit');
    const event = new Event('change');
    Object.defineProperty(event, 'stopPropagation', { value: jasmine.createSpy() });
    component.toggleTool('dashboard', event);
    expect(component.selectedTools()).toContain('dashboard');
    expect(spy).toHaveBeenCalled();
  });

  it('should toggle a tool off', () => {
    component.selectedTools.set(['dashboard', 'tournaments']);
    const spy = spyOn(component.changed, 'emit');
    const event = new Event('change');
    component.toggleTool('dashboard', event);
    expect(component.selectedTools()).not.toContain('dashboard');
    expect(spy).toHaveBeenCalled();
  });

  it('should select all tools', () => {
    const spy = spyOn(component.changed, 'emit');
    component.selectAll();
    expect(component.selectedTools().length).toBe(component.availableTools().length);
    expect(spy).toHaveBeenCalled();
  });

  it('should deselect all tools', () => {
    component.selectAll();
    const spy = spyOn(component.changed, 'emit');
    component.deselectAll();
    expect(component.selectedTools().length).toBe(0);
    expect(spy).toHaveBeenCalled();
  });

  it('should toggle module expansion', () => {
    const module = component.moduleGroups()[0].module;
    expect(component.isExpanded(module)).toBe(true);
    component.toggleExpand(module);
    expect(component.isExpanded(module)).toBe(false);
    component.toggleExpand(module);
    expect(component.isExpanded(module)).toBe(true);
  });

  it('should detect fully selected module', () => {
    const group = component.moduleGroups()[0];
    const allKeys = group.tools.map(t => t.key);
    component.selectedTools.set(allKeys);
    expect(component.isModuleFullySelected(group.module)).toBe(true);
  });

  it('should detect partially selected module', () => {
    const group = component.moduleGroups()[0];
    if (group.tools.length > 1) {
      component.selectedTools.set([group.tools[0].key]);
      expect(component.isModulePartiallySelected(group.module)).toBe(true);
    }
  });

  it('should toggle entire module on', () => {
    const group = component.moduleGroups()[0];
    const event = new Event('change');
    Object.defineProperty(event, 'target', { value: { checked: true } });
    Object.defineProperty(event, 'stopPropagation', { value: jasmine.createSpy() });
    component.toggleModule(group.module, event);
    expect(component.isModuleFullySelected(group.module)).toBe(true);
  });

  it('should toggle entire module off', () => {
    component.selectAll();
    const group = component.moduleGroups()[0];
    const event = new Event('change');
    Object.defineProperty(event, 'target', { value: { checked: false } });
    Object.defineProperty(event, 'stopPropagation', { value: jasmine.createSpy() });
    component.toggleModule(group.module, event);
    expect(component.isModuleFullySelected(group.module)).toBe(false);
  });

  it('should respect disabled state', () => {
    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('disabled', true);
    });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.permission-matrix--disabled')).toBeTruthy();
  });

  it('should restrict to specified tools', () => {
    TestBed.runInInjectionContext(() => {
      fixture.componentRef.setInput('restrictToTools', ['dashboard', 'tournaments']);
    });
    fixture.detectChanges();
    expect(component.availableTools().length).toBe(2);
  });
});
