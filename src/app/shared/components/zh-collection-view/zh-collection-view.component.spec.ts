import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ZhCollectionViewComponent } from './zh-collection-view.component';
import { DataTableComponent } from '../data-table/data-table.component';
import { DataTableColumn } from '../data-table/data-table.component';

interface TestRow extends Record<string, unknown> {
  id: string;
  name: string;
}

@Component({
  standalone: true,
  imports: [ZhCollectionViewComponent],
  template: `
    <zh-collection-view
      viewKey="test-key"
      [items]="items"
      [columns]="columns"
      [paginated]="paginated"
      [rowActionsFilter]="filter">
    </zh-collection-view>
  `
})
class TestHostComponent {
  items: TestRow[] = [{ id: '1', name: 'Row 1' }];
  columns: DataTableColumn[] = [{ key: 'name', labelKey: 'Name' }];
  filter: ((row: TestRow) => { icon: string; labelKey: string; action: string }[]) | null = null;
  /** true → default mode is table (needed for tests that query DataTableComponent) */
  paginated = true;
}

describe('ZhCollectionViewComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(host).toBeTruthy();
  });

  it('should render collection view', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('zh-collection-view')).toBeTruthy();
  });

  it('forwards rowActionsFilter to inner data-table in table mode', () => {
    const filterFn = (row: TestRow) => row.id === '1'
      ? [{ icon: 'edit', labelKey: 'Edit', action: 'edit' }]
      : [];

    host.filter = filterFn;
    fixture.detectChanges();

    const tableDebug = fixture.debugElement.query(By.directive(DataTableComponent));
    expect(tableDebug).toBeTruthy();
    const tableInstance = tableDebug.componentInstance as DataTableComponent<TestRow>;
    expect(tableInstance.rowActionsFilter()).toBe(filterFn);
  });

  it('forwards null rowActionsFilter to inner data-table', () => {
    host.filter = null;
    fixture.detectChanges();

    const tableDebug = fixture.debugElement.query(By.directive(DataTableComponent));
    expect(tableDebug).toBeTruthy();
    const tableInstance = tableDebug.componentInstance as DataTableComponent<TestRow>;
    expect(tableInstance.rowActionsFilter()).toBeNull();
  });
});
