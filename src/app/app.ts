import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  type AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  type ValidationErrors,
  type ValidatorFn,
  Validators,
} from '@angular/forms';
import { TuiButton, TuiDialog, TuiDialogService, TuiInput, TuiRoot } from '@taiga-ui/core';
import { TUI_CONFIRM } from '@taiga-ui/kit';

import { WorkActView } from './components/work-act-view/work-act-view';
import { WorkCertificatesTable } from './components/work-certificates-table/work-certificates-table';
import { createWorkAct } from './data/work-act-factory';
import { type WorkAct } from './models/work-act';
import { type WorkCertificate } from './models/work-certificate';

const INITIAL_CERTIFICATES: readonly WorkCertificate[] = [
  {
    id: 1,
    date: '2026-11-03',
    machineName: 'CNC milling machine',
    inventoryNumber: 'CNC-0142',
    employees: ['Alex Morgan', 'Maya Chen'],
  },
  {
    id: 2,
    date: '2026-11-01',
    machineName: 'Hydraulic press',
    inventoryNumber: 'PRS-0087',
    employees: ['Daniel Kim'],
  },
  {
    id: 3,
    date: '2026-10-30',
    machineName: 'Laser cutting station',
    inventoryNumber: 'LCS-0219',
    employees: ['Sofia Turner', 'Liam Brown'],
  },
  {
    id: 4,
    date: '2026-10-28',
    machineName: 'Industrial lathe',
    inventoryNumber: 'LAT-0034',
    employees: ['Noah Wilson'],
  },
  {
    id: 5,
    date: '2026-10-24',
    machineName: 'Welding robot',
    inventoryNumber: 'WLD-0118',
    employees: ['Olivia Davis', 'Ethan Clark'],
  },
];

const nonBlank: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  typeof control.value === 'string' && control.value.trim() ? null : { required: true };

const hasEmployee: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  typeof control.value === 'string' &&
  control.value.split(',').some((employee: string) => employee.trim())
    ? null
    : { required: true };

@Component({
  selector: 'app-root',
  imports: [
    ReactiveFormsModule,
    TuiButton,
    TuiDialog,
    TuiInput,
    TuiRoot,
    WorkActView,
    WorkCertificatesTable,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly dialogs = inject(TuiDialogService);

  protected readonly certificates = signal(INITIAL_CERTIFICATES);
  protected readonly selectedAct = signal<WorkAct | null>(null);
  protected readonly editTarget = signal<WorkCertificate | null>(null);
  protected readonly editDialogOpen = signal(false);
  protected readonly editDialogOptions = {
    label: 'Edit certificate',
    size: 's' as const,
  };
  protected readonly editForm = new FormGroup({
    date: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    machineName: new FormControl('', { nonNullable: true, validators: [nonBlank] }),
    inventoryNumber: new FormControl('', { nonNullable: true, validators: [nonBlank] }),
    employees: new FormControl('', { nonNullable: true, validators: [hasEmployee] }),
  });

  protected handleEdit(certificate: WorkCertificate): void {
    this.editTarget.set(certificate);
    this.editForm.reset({
      date: certificate.date,
      machineName: certificate.machineName,
      inventoryNumber: certificate.inventoryNumber,
      employees: certificate.employees.join(', '),
    });
    this.editDialogOpen.set(true);
  }

  protected handleView(certificate: WorkCertificate): void {
    this.selectedAct.set(createWorkAct(certificate));
  }

  protected closeAct(): void {
    this.selectedAct.set(null);
  }

  protected handleDelete(certificate: WorkCertificate): void {
    this.dialogs
      .open<boolean>(TUI_CONFIRM, {
        label: 'Delete certificate?',
        size: 's',
        data: {
          content: 'This certificate will be permanently removed. This action cannot be undone.',
          yes: 'Delete',
          no: 'Cancel',
          appearance: ['primary-destructive', 'secondary'],
        },
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.deleteCertificate(certificate);
        }
      });
  }

  protected handleEditDialogChange(open: boolean): void {
    this.editDialogOpen.set(open);

    if (!open) {
      this.editTarget.set(null);
      this.editForm.reset();
    }
  }

  protected closeEditDialog(): void {
    this.handleEditDialogChange(false);
  }

  protected saveCertificate(): void {
    const target = this.editTarget();

    if (!target || this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const value = this.editForm.getRawValue();
    const updated: WorkCertificate = {
      ...target,
      date: value.date,
      machineName: value.machineName.trim(),
      inventoryNumber: value.inventoryNumber.trim(),
      employees: value.employees
        .split(',')
        .map((employee) => employee.trim())
        .filter(Boolean),
    };

    this.certificates.update((current) =>
      current.map((certificate) => (certificate.id === updated.id ? updated : certificate)),
    );
    this.closeEditDialog();
  }

  private deleteCertificate(certificate: WorkCertificate): void {
    this.certificates.update((current) => current.filter(({ id }) => id !== certificate.id));

    if (this.editTarget()?.id === certificate.id) {
      this.closeEditDialog();
    }
  }
}
