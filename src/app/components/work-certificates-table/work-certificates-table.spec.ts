import { ComponentFixture, TestBed } from '@angular/core/testing';

import { type WorkCertificate } from '../../models/work-certificate';
import { WorkCertificatesTable } from './work-certificates-table';

const CERTIFICATES: readonly WorkCertificate[] = [
  {
    id: 1,
    date: '2026-11-03',
    machineName: 'CNC milling machine',
    inventoryNumber: 'CNC-0142',
    employees: ['Alex Morgan', 'Maya Chen'],
  },
  {
    id: 2,
    date: '2026-10-28',
    machineName: 'Industrial lathe',
    inventoryNumber: 'LAT-0034',
    employees: ['Noah Wilson'],
  },
];

describe('WorkCertificatesTable', () => {
  let fixture: ComponentFixture<WorkCertificatesTable>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkCertificatesTable],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkCertificatesTable);
    fixture.componentRef.setInput('certificates', CERTIFICATES);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
  });

  it('renders all required columns and rows', () => {
    const headings = Array.from(element.querySelectorAll('th')).map((heading) =>
      heading.textContent?.trim(),
    );

    expect(headings).toEqual([
      '',
      'Date',
      'Machine name',
      'Inventory number',
      'Employees',
      'Actions',
    ]);
    expect(element.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(element.textContent).toContain('CNC milling machine');
    expect(element.textContent).toContain('Nov 3, 2026');
    expect(element.textContent).toContain('Alex Morgan, Maya Chen');
  });

  it('filters rows by machine name without case sensitivity', () => {
    const input = element.querySelector<HTMLInputElement>('[aria-label="Filter by machine name"]');

    expect(input).not.toBeNull();
    input!.value = 'LATHE';
    input!.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(element.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(element.textContent).toContain('Industrial lathe');
    expect(element.textContent).not.toContain('CNC milling machine');
  });

  it('filters rows by date, inventory number, and employee', () => {
    const date = element.querySelector<HTMLInputElement>('[aria-label="Filter by date"]');
    const inventory = element.querySelector<HTMLInputElement>(
      '[aria-label="Filter by inventory number"]',
    );
    const employee = element.querySelector<HTMLInputElement>('[aria-label="Filter by employee"]');

    date!.value = '2026-11-03';
    date!.dispatchEvent(new Event('input', { bubbles: true }));
    inventory!.value = '0142';
    inventory!.dispatchEvent(new Event('input', { bubbles: true }));
    employee!.value = 'maya';
    employee!.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(element.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(element.textContent).toContain('CNC milling machine');
  });

  it('sorts rows by machine name in both directions', () => {
    const sortButton = Array.from(element.querySelectorAll<HTMLButtonElement>('th button')).find(
      (button) => button.textContent?.includes('Machine name'),
    );
    const machineNames = (): string[] =>
      Array.from(element.querySelectorAll('tbody tr')).map(
        (row) => row.querySelectorAll('td')[2]?.textContent?.trim() ?? '',
      );

    sortButton!.click();
    fixture.detectChanges();
    expect(machineNames()).toEqual(['CNC milling machine', 'Industrial lathe']);

    sortButton!.click();
    fixture.detectChanges();
    expect(machineNames()).toEqual(['Industrial lathe', 'CNC milling machine']);
  });

  it('selects rows and filters by selection state', () => {
    const rowCheckbox = element.querySelector<HTMLInputElement>(
      '[aria-label="Select CNC milling machine"]',
    );

    rowCheckbox!.checked = true;
    rowCheckbox!.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();

    const selection = element.querySelector<HTMLSelectElement>(
      '[aria-label="Filter by selection"]',
    );
    selection!.value = 'selected';
    selection!.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();

    expect(element.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(element.textContent).toContain('CNC milling machine');
    expect(element.textContent).toContain('1 selected');
  });

  it('prunes selection after a selected certificate is removed', async () => {
    const rowCheckbox = element.querySelector<HTMLInputElement>(
      '[aria-label="Select Industrial lathe"]',
    );

    rowCheckbox!.checked = true;
    rowCheckbox!.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
    expect(element.textContent).toContain('1 selected');

    fixture.componentRef.setInput('certificates', [CERTIFICATES[0]]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(element.textContent).toContain('0 selected');
  });

  it('emits the corresponding certificate for edit and delete actions', () => {
    const edited: WorkCertificate[] = [];
    const deleted: WorkCertificate[] = [];
    fixture.componentInstance.editRequested.subscribe((certificate) => edited.push(certificate));
    fixture.componentInstance.deleteRequested.subscribe((certificate) => deleted.push(certificate));

    const rowCheckbox = element.querySelector<HTMLInputElement>(
      '[aria-label="Select Industrial lathe"]',
    );
    rowCheckbox!.checked = true;
    rowCheckbox!.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();

    element.querySelector<HTMLButtonElement>('[aria-label="Edit CNC milling machine"]')!.click();
    element.querySelector<HTMLButtonElement>('[aria-label="Delete Industrial lathe"]')!.click();

    expect(edited).toEqual([CERTIFICATES[0]]);
    expect(deleted).toEqual([CERTIFICATES[1]]);
    expect(element.textContent).toContain('1 selected');
  });

  it('shows an accessible empty state when filters have no matches', () => {
    const input = element.querySelector<HTMLInputElement>('[aria-label="Filter by machine name"]');

    input!.value = 'not-a-machine';
    input!.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(element.textContent).toContain('No certificates found');
    expect(element.querySelector('caption')?.textContent).toContain(
      'Certificates of work performed',
    );
  });
});
