import { ComponentFixture, TestBed } from '@angular/core/testing';
import { I18nService } from '../../../core/i18n/i18n.service';
import { DataTablePaginatorComponent } from './data-table-paginator.component';

describe('DataTablePaginatorComponent', () => {
  let fixture: ComponentFixture<DataTablePaginatorComponent>;
  let emitted: number[];

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }
  function text(selector: string): string {
    return (el().querySelector(selector)?.textContent ?? '').replace(/\s+/g, ' ').trim();
  }
  function prevBtn(): HTMLButtonElement {
    return el().querySelectorAll<HTMLButtonElement>('.data-table__pagination-btn')[0];
  }
  function nextBtn(): HTMLButtonElement {
    return el().querySelectorAll<HTMLButtonElement>('.data-table__pagination-btn')[1];
  }
  function render(inputs: { page?: number; pageSize?: number; totalCount?: number; visibleCount?: number | null }): void {
    Object.entries(inputs).forEach(([key, value]) => fixture.componentRef.setInput(key, value));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DataTablePaginatorComponent] }).compileComponents();
    fixture = TestBed.createComponent(DataTablePaginatorComponent);
    emitted = [];
    fixture.componentInstance.pageChange.subscribe(page => emitted.push(page));
  });

  it('renders the range, total and page count for the first page', () => {
    render({ page: 1, pageSize: 20, totalCount: 45 });

    expect(text('.data-table__pagination-info')).toContain('1–20');
    expect(text('.data-table__pagination-info')).toContain('45');
    expect(text('.data-table__pagination-page')).toContain('1 / 3');
    expect(prevBtn().disabled).toBeTrue();
    expect(nextBtn().disabled).toBeFalse();
  });

  it('uses visibleCount for the range end instead of slicing by pageSize', () => {
    render({ page: 1, pageSize: 20, totalCount: 45, visibleCount: 25 });

    expect(text('.data-table__pagination-info')).toContain('1–25');
  });

  it('clamps the range on the last page and disables next', () => {
    render({ page: 3, pageSize: 20, totalCount: 45, visibleCount: 5 });

    expect(text('.data-table__pagination-info')).toContain('41–45');
    expect(text('.data-table__pagination-page')).toContain('3 / 3');
    expect(nextBtn().disabled).toBeTrue();
    expect(prevBtn().disabled).toBeFalse();
  });

  it('emits the requested page without changing its own page (controlled)', () => {
    render({ page: 2, pageSize: 20, totalCount: 45 });

    nextBtn().click();
    prevBtn().click();
    fixture.detectChanges();

    expect(emitted).toEqual([3, 1]);
    expect(text('.data-table__pagination-page')).toContain('2 / 3');
  });

  it('disables both buttons and never emits when the total is 0', () => {
    render({ page: 1, pageSize: 20, totalCount: 0 });

    expect(prevBtn().disabled).toBeTrue();
    expect(nextBtn().disabled).toBeTrue();
    expect(text('.data-table__pagination-page')).toContain('1 / 1');
    fixture.componentInstance.go(2);
    expect(emitted).toEqual([]);
  });

  describe('out-of-range page (e.g. server data shrank)', () => {
    beforeEach(() => render({ page: 5, pageSize: 10, totalCount: 20, visibleCount: 0 }));

    it('shows an honest empty range instead of a fake last row', () => {
      expect(text('.data-table__pagination-info')).toContain('0–0');
      expect(text('.data-table__pagination-info')).toContain('20');
      expect(text('.data-table__pagination-info')).not.toContain('20–20');
    });

    it('disables next and makes prev emit the last valid page', () => {
      expect(nextBtn().disabled).toBeTrue();
      expect(prevBtn().disabled).toBeFalse();

      prevBtn().click();
      nextBtn().click();

      expect(emitted).toEqual([2]);
    });
  });

  it('keeps prev emitting page - 1 for in-range pages', () => {
    render({ page: 2, pageSize: 10, totalCount: 20, visibleCount: 10 });

    expect(text('.data-table__pagination-info')).toContain('11–20');
    prevBtn().click();
    expect(emitted).toEqual([1]);
  });

  it('exposes a localized navigation landmark and page prefix', () => {
    render({ page: 1, pageSize: 10, totalCount: 30 });
    const i18n = TestBed.inject(I18nService);
    const label = i18n.translate('admin.pagination.label');
    expect(label).not.toBe('admin.pagination.label');

    const nav = el().querySelector('nav.data-table__pagination');
    expect(nav?.getAttribute('aria-label')).toBe(label);
    expect(text('.data-table__pagination-page')).toContain(i18n.translate('admin.pagination.page'));
    expect(prevBtn().textContent?.trim()).toBe(i18n.translate('admin.pagination.prev'));
    expect(nextBtn().textContent?.trim()).toBe(i18n.translate('admin.pagination.next'));
    expect(prevBtn().getAttribute('type')).toBe('button');
  });
});
