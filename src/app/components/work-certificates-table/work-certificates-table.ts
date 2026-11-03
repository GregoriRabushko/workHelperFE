import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  Pipe,
  type PipeTransform,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  type TuiComparator,
  TuiTableDirective,
  TuiTableSortPipe,
  TuiTableTbody,
  TuiTableTd,
  TuiTableTh,
} from '@taiga-ui/addon-table';
import { TuiButton, TuiInput } from '@taiga-ui/core';

import { type WorkCertificate } from '../../models/work-certificate';

type SelectionFilter = 'all' | 'selected' | 'unselected';

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeZone: 'UTC',
});

@Pipe({ name: 'dateOnly' })
class DateOnlyPipe implements PipeTransform {
  transform(value: string): string {
    const date = new Date(`${value}T00:00:00Z`);

    return Number.isNaN(date.getTime()) ? value : DATE_FORMATTER.format(date);
  }
}

@Component({
  selector: 'app-work-certificates-table',
  imports: [
    DateOnlyPipe,
    ReactiveFormsModule,
    TuiButton,
    TuiInput,
    TuiTableDirective,
    TuiTableSortPipe,
    TuiTableTbody,
    TuiTableTd,
    TuiTableTh,
  ],
  templateUrl: './work-certificates-table.html',
  styleUrl: './work-certificates-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkCertificatesTable {
  readonly certificates = input<readonly WorkCertificate[]>([]);
  readonly editRequested = output<WorkCertificate>();
  readonly deleteRequested = output<WorkCertificate>();

  protected readonly filters = new FormGroup({
    date: new FormControl('', { nonNullable: true }),
    machineName: new FormControl('', { nonNullable: true }),
    inventoryNumber: new FormControl('', { nonNullable: true }),
    employees: new FormControl('', { nonNullable: true }),
    selection: new FormControl<SelectionFilter>('all', { nonNullable: true }),
  });
  protected readonly selectedIds = signal<ReadonlySet<number>>(new Set<number>());

  private readonly filterValues = toSignal(this.filters.valueChanges, {
    initialValue: this.filters.getRawValue(),
  });

  protected readonly filteredCertificates = computed(() => {
    const filters = this.filterValues();
    const date = filters.date ?? '';
    const machineName = this.normalize(filters.machineName);
    const inventoryNumber = this.normalize(filters.inventoryNumber);
    const employees = this.normalize(filters.employees);
    const selection = filters.selection ?? 'all';
    const selectedIds = this.selectedIds();

    return this.certificates().filter((certificate) => {
      const isSelected = selectedIds.has(certificate.id);
      const matchesSelection =
        selection === 'all' ||
        (selection === 'selected' && isSelected) ||
        (selection === 'unselected' && !isSelected);

      return (
        (!date || certificate.date === date) &&
        (!machineName || this.normalize(certificate.machineName).includes(machineName)) &&
        (!inventoryNumber ||
          this.normalize(certificate.inventoryNumber).includes(inventoryNumber)) &&
        (!employees || this.normalize(certificate.employees.join(' ')).includes(employees)) &&
        matchesSelection
      );
    });
  });

  protected readonly hasActiveFilters = computed(() => {
    const filters = this.filterValues();

    return Boolean(
      filters.date ||
      filters.machineName?.trim() ||
      filters.inventoryNumber?.trim() ||
      filters.employees?.trim() ||
      filters.selection !== 'all',
    );
  });

  protected readonly selectedCount = computed(() => {
    const selectedIds = this.selectedIds();

    return this.certificates().filter(({ id }) => selectedIds.has(id)).length;
  });

  protected readonly allVisibleSelected = computed(() => {
    const visible = this.filteredCertificates();
    const selectedIds = this.selectedIds();

    return visible.length > 0 && visible.every(({ id }) => selectedIds.has(id));
  });

  protected readonly someVisibleSelected = computed(() => {
    const visible = this.filteredCertificates();
    const selectedIds = this.selectedIds();
    const selectedVisibleCount = visible.filter(({ id }) => selectedIds.has(id)).length;

    return selectedVisibleCount > 0 && selectedVisibleCount < visible.length;
  });

  protected readonly dateSorter: TuiComparator<WorkCertificate> = (first, second) =>
    first.date.localeCompare(second.date);
  protected readonly machineSorter: TuiComparator<WorkCertificate> = (first, second) =>
    first.machineName.localeCompare(second.machineName);
  protected readonly inventorySorter: TuiComparator<WorkCertificate> = (first, second) =>
    first.inventoryNumber.localeCompare(second.inventoryNumber, undefined, { numeric: true });
  protected readonly employeesSorter: TuiComparator<WorkCertificate> = (first, second) =>
    first.employees.join(', ').localeCompare(second.employees.join(', '));

  protected clearFilters(): void {
    this.filters.reset({
      date: '',
      machineName: '',
      inventoryNumber: '',
      employees: '',
      selection: 'all',
    });
  }

  protected isSelected(id: number): boolean {
    return this.selectedIds().has(id);
  }

  protected toggleAllVisible(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const visibleIds = this.filteredCertificates().map(({ id }) => id);

    this.selectedIds.update((current) => {
      const next = new Set(current);

      visibleIds.forEach((id) => (checked ? next.add(id) : next.delete(id)));

      return next;
    });
  }

  protected toggleRow(id: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;

    this.selectedIds.update((current) => {
      const next = new Set(current);

      checked ? next.add(id) : next.delete(id);

      return next;
    });
  }

  protected requestEdit(certificate: WorkCertificate): void {
    this.editRequested.emit(certificate);
  }

  protected requestDelete(certificate: WorkCertificate): void {
    this.selectedIds.update((current) => {
      const next = new Set(current);
      next.delete(certificate.id);
      return next;
    });
    this.deleteRequested.emit(certificate);
  }

  private normalize(value: string | null | undefined): string {
    return value?.trim().toLocaleLowerCase() ?? '';
  }
}
