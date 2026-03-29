import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'zh-date-format';
const DEFAULT_FORMAT = 'dd/MM/yyyy';

@Injectable({
  providedIn: 'root'
})
export class DateFormatService {
  private readonly formatState = signal<string>(
    localStorage.getItem(STORAGE_KEY) ?? DEFAULT_FORMAT
  );

  readonly format = this.formatState.asReadonly();

  setFormat(fmt: string): void {
    this.formatState.set(fmt);
    localStorage.setItem(STORAGE_KEY, fmt);
  }
}
