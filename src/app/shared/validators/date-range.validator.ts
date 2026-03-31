import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Cross-field validator: ensures endDate >= startDate.
 * Attach to the FormGroup (not individual controls).
 *
 * This is a protected date-range scenario per the project contract.
 * Any pair of semantic dates (start/end, from/to) must use this validator.
 *
 * Reuse pattern (3 layers):
 *
 * 1. FormGroup-level validator (this function):
 *    ```ts
 *    this.fb.group({
 *      startDate: ['', Validators.required],
 *      endDate: ['', Validators.required]
 *    }, {
 *      validators: [dateRangeValidator('startDate', 'endDate')]
 *    });
 *    ```
 *
 * 2. HTML input constraints (prevent invalid selection):
 *    ```html
 *    <input type="date" formControlName="endDate" [min]="startDateValue()">
 *    <input type="date" formControlName="startDate" [max]="endDateValue()">
 *    ```
 *    Use computed signals derived from the counterpart field's value.
 *
 * 3. Error display (translated message):
 *    ```html
 *    @if (form.get('endDate')?.hasError('dateRangeInvalid')) {
 *      <span class="error">{{ 'validation.dateRange.endBeforeStart' | t }}</span>
 *    }
 *    ```
 *
 * The validator propagates the `dateRangeInvalid` error to the end field
 * for per-field error display and clears it when the range becomes valid.
 */
export function dateRangeValidator(startField: string, endField: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const start = group.get(startField)?.value;
    const end = group.get(endField)?.value;
    if (!start || !end) return null;
    if (new Date(end) < new Date(start)) {
      group.get(endField)?.setErrors({ dateRangeInvalid: true });
      return { dateRangeInvalid: true };
    }
    const endErrors = group.get(endField)?.errors;
    if (endErrors?.['dateRangeInvalid']) {
      const { dateRangeInvalid, ...rest } = endErrors;
      group.get(endField)?.setErrors(Object.keys(rest).length ? rest : null);
    }
    return null;
  };
}

/**
 * Returns the i18n key for a date-range validation error.
 * Use to display a translated error message for the end field.
 */
export function dateRangeErrorMessageKey(startField: string, endField: string): string {
  return `validation.dateRange.${endField}BeforeStart`;
}

/**
 * Returns a min date string for an HTML date input.
 * Use with [min]="getMinDate(startDateValue)" on end date inputs.
 */
export function getMinDate(referenceDate: string | null): string | null {
  return referenceDate || null;
}

/**
 * Returns a max date string for an HTML date input.
 * Use with [max]="getMaxDate(endDateValue)" on registration date inputs.
 */
export function getMaxDate(referenceDate: string | null): string | null {
  return referenceDate || null;
}
