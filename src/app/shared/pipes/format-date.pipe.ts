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

    const date = value instanceof Date ? value : new Date(value);

    if (isNaN(date.getTime())) {
      return String(value);
    }

    return this.applyFormat(date, this.dateFormat.format());
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
