import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TuiRoot } from '@taiga-ui/core';

import { WorkCertificatesTable } from './components/work-certificates-table/work-certificates-table';
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

@Component({
  selector: 'app-root',
  imports: [TuiRoot, WorkCertificatesTable],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly certificates = signal(INITIAL_CERTIFICATES);
  protected readonly editTarget = signal<WorkCertificate | null>(null);

  protected handleEdit(certificate: WorkCertificate): void {
    this.editTarget.set(certificate);
  }

  protected handleDelete(certificate: WorkCertificate): void {
    this.certificates.update((current) => current.filter(({ id }) => id !== certificate.id));

    if (this.editTarget()?.id === certificate.id) {
      this.editTarget.set(null);
    }
  }
}
