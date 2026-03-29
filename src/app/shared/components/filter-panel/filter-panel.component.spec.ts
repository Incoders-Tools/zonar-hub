import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilterPanelComponent, SortRule } from './filter-panel.component';

describe('FilterPanelComponent', () => {
  let fixture: ComponentFixture<FilterPanelComponent>;
  let component: FilterPanelComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FilterPanelComponent] }).compileComponents();
    fixture = TestBed.createComponent(FilterPanelComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('fields', []);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('multi-criteria sort', () => {
    const sortFields = [
      { key: 'name', labelKey: 'Name' },
      { key: 'level', labelKey: 'Level' },
      { key: 'date', labelKey: 'Date' }
    ];

    beforeEach(() => {
      fixture.componentRef.setInput('sortFields', sortFields);
      fixture.detectChanges();
    });

    it('should add a sort rule with first available field', () => {
      component.addSortRule();
      expect(component.sortRules.length).toBe(1);
      expect(component.sortRules[0]).toEqual({ field: 'name', dir: 'asc' });
    });

    it('should emit sortRulesChanged when adding a rule', () => {
      let emitted: SortRule[] = [];
      component.sortRulesChanged.subscribe(rules => emitted = rules);
      component.addSortRule();
      expect(emitted.length).toBe(1);
    });

    it('should remove a sort rule by index', () => {
      component.addSortRule();
      component.addSortRule();
      expect(component.sortRules.length).toBe(2);
      component.removeSortRule(0);
      expect(component.sortRules.length).toBe(1);
      expect(component.sortRules[0].field).toBe('level');
    });

    it('should update sort field for a rule', () => {
      component.addSortRule();
      component.updateSortField(0, 'date');
      expect(component.sortRules[0].field).toBe('date');
    });

    it('should update sort direction for a rule', () => {
      component.addSortRule();
      component.updateSortDir(0, 'desc');
      expect(component.sortRules[0].dir).toBe('desc');
    });

    it('should not add more rules than available fields', () => {
      component.addSortRule();
      component.addSortRule();
      component.addSortRule();
      expect(component.sortRules.length).toBe(3);
      expect(component.canAddSortRule()).toBeFalse();
      component.addSortRule();
      expect(component.sortRules.length).toBe(3);
    });

    it('should only show available fields in availableFieldsForRule', () => {
      component.addSortRule(); // takes 'name'
      const available = component.availableFieldsForRule('');
      expect(available.map(f => f.key)).toEqual(['level', 'date']);
    });

    it('should include current field in availableFieldsForRule', () => {
      component.addSortRule(); // takes 'name'
      const available = component.availableFieldsForRule('name');
      expect(available.map(f => f.key)).toContain('name');
    });

    it('should clear sort rules on clear()', () => {
      component.addSortRule();
      component.addSortRule();
      let emitted: SortRule[] | null = null;
      component.sortRulesChanged.subscribe(rules => emitted = rules);
      component.clear();
      expect(component.sortRules.length).toBe(0);
      expect(emitted).toEqual([]);
    });

    it('should initialize with defaultSortRules', () => {
      fixture.componentRef.setInput('defaultSortRules', [{ field: 'level', dir: 'desc' }]);
      component.ngOnInit();
      expect(component.sortRules).toEqual([{ field: 'level', dir: 'desc' }]);
    });

    it('should toggle sorts panel visibility', () => {
      expect(component.sortsOpen()).toBeFalse();
      component.toggleSorts();
      expect(component.sortsOpen()).toBeTrue();
      component.toggleSorts();
      expect(component.sortsOpen()).toBeFalse();
    });
  });
});
