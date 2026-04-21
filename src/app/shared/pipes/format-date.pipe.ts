import { inject, Pipe, PipeTransform } from '@angular/core';
import { DateFormatService } from '../../core/services/date-format.service';

@Pipe({
  name: 'formatDate',
  standalone: true,
  pure: false
})
export class FormatDatePipe implements PipeTransform {
  private readonly dateFormat = inject(DateFormatService);

  transform(value: string | Date | null | undefined): string {
    if (value == null || value === '') {
      return '';
    }

    const date = this.parseDate(value);

    if (isNaN(date.getTime())) {
      return String(value);
    }

    return this.applyFormat(date, this.dateFormat.format());
  }

  /**
   * Parse a date value safely.
   * Date-only strings like "2024-06-15" are parsed as local midnight
   * to avoid the UTC-offset bug where getDate() returns the previous day
   * in timezones behind UTC.
   */
  private parseDate(value: string | Date): Date {
    if (value instanceof Date) return value;
    // Date-only ISO string (YYYY-MM-DD)
    const dateOnlyMatch = /^\d{4}-\d{2}-\d{2}$/.exec(value);
    if (dateOnlyMatch) {
      const [y, m, d] = value.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date(value);
  }

  private applyFormat(date: Date, fmt: string): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear());

    return fmt
      .replace('dd', day)
      .replace('MM', month)
      .replace('yyyy', year);
  }
}
