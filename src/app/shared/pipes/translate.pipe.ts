import { ChangeDetectorRef, Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';

@Pipe({
  name: 't',
  standalone: true,
  pure: false
})
export class TranslatePipe implements PipeTransform {
  private readonly i18nService = inject(I18nService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  transform(key: string): string {
    this.changeDetectorRef.markForCheck();
    return this.i18nService.translate(key);
  }
}