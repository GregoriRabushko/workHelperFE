import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideTaiga } from '@taiga-ui/core';

import { App } from './app';
import { WorkActView } from './components/work-act-view/work-act-view';
import { WorkCertificatesTable } from './components/work-certificates-table/work-certificates-table';

async function renderApp(): Promise<ComponentFixture<App>> {
  const fixture = TestBed.createComponent(App);

  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();

  return fixture;
}

function findLastButton(root: HTMLElement, label: string): HTMLButtonElement | undefined {
  const matches = Array.from(root.querySelectorAll<HTMLButtonElement>('button')).filter(
    (button) => button.textContent?.trim() === label,
  );

  return matches[matches.length - 1];
}

function getCertificatesTable(fixture: ComponentFixture<App>): WorkCertificatesTable {
  return fixture.debugElement.query(By.directive(WorkCertificatesTable))
    .componentInstance as WorkCertificatesTable;
}

function getActView(fixture: ComponentFixture<App>): WorkActView {
  return fixture.debugElement.query(By.directive(WorkActView)).componentInstance as WorkActView;
}

describe('App', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: (query: string): MediaQueryList => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      }),
    });
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideTaiga()],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = await renderApp();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toContain('Certificates of work performed');
  });

  it('opens an act with two pages and returns to the table', async () => {
    const fixture = await renderApp();
    const compiled = fixture.nativeElement as HTMLElement;

    const hydraulicPressRow = Array.from(
      compiled.querySelectorAll<HTMLTableRowElement>('tbody tr'),
    ).find((row) => row.textContent?.includes('Hydraulic press'))!;

    hydraulicPressRow.querySelector<HTMLTableCellElement>('.machine-cell')!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(compiled.querySelectorAll('button[tuiTab]')).toHaveLength(2);
    expect(compiled.textContent).toContain('Акт выполненных работ');
    expect(compiled.textContent).not.toContain('WR-2026-0002');
    expect(compiled.textContent).toContain('Техника и заявка на ремонт');

    compiled.querySelector<HTMLButtonElement>('#act-back-tab')!.click();
    fixture.detectChanges();
    expect(compiled.textContent).toContain('Запасные части и использованные материалы');

    const back = Array.from(compiled.querySelectorAll<HTMLButtonElement>('button')).find(
      (button) => button.textContent?.trim() === 'Все акты',
    );
    back!.click();
    fixture.detectChanges();

    expect(compiled.textContent).toContain('Certificates of work performed');
  });

  it('persists edited act data and keeps the main table in sync', async () => {
    const fixture = await renderApp();
    const compiled = fixture.nativeElement as HTMLElement;

    const hydraulicPressRow = Array.from(
      compiled.querySelectorAll<HTMLTableRowElement>('tbody tr'),
    ).find((row) => row.textContent?.includes('Hydraulic press'))!;

    hydraulicPressRow.querySelector<HTMLTableCellElement>('.machine-cell')!.click();
    fixture.detectChanges();

    const view = getActView(fixture);
    const current = view.act();

    view.actUpdated.emit({
      ...current,
      date: '2026-11-06',
      equipment: {
        ...current.equipment,
        inventoryNumber: 'PRS-UPDATED',
        name: 'Updated hydraulic press',
        model: 'HP-42',
        repairReason: 'Hydraulic leak',
        meterReading: '4300 м/ч',
        brigade: ['Grace Hopper'],
      },
      completedWorks: [{ id: 1, name: 'Replace hydraulic seal', laborHours: 2.5 }],
      materials: [
        {
          id: 1,
          name: 'Hydraulic seal',
          itemCode: 'SEAL-42',
          unit: 'шт.',
          quantity: 1,
          unitPrice: 0,
          paymentSource: 'warranty',
        },
      ],
      performers: ['Grace Hopper'],
    });
    fixture.detectChanges();

    const back = Array.from(compiled.querySelectorAll<HTMLButtonElement>('button')).find(
      (button) => button.textContent?.trim() === 'Все акты',
    )!;

    back.click();
    fixture.detectChanges();

    expect(compiled.textContent).toContain('Updated hydraulic press');
    expect(compiled.textContent).toContain('PRS-UPDATED');
    expect(compiled.textContent).toContain('Grace Hopper');

    compiled
      .querySelector<HTMLButtonElement>('[aria-label="Edit Updated hydraulic press"]')!
      .click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const machineName = compiled.querySelector<HTMLInputElement>(
      '[aria-label="Certificate machine name"]',
    )!;

    machineName.value = 'Table-edited hydraulic press';
    machineName.dispatchEvent(new Event('input', { bubbles: true }));
    compiled.querySelector<HTMLFormElement>('.edit-form')!.requestSubmit();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const updatedRow = Array.from(compiled.querySelectorAll<HTMLTableRowElement>('tbody tr')).find(
      (row) => row.textContent?.includes('Table-edited hydraulic press'),
    )!;

    updatedRow.querySelector<HTMLTableCellElement>('.machine-cell')!.click();
    fixture.detectChanges();

    const reopened = getActView(fixture).act();

    expect(reopened.equipment.name).toBe('Table-edited hydraulic press');
    expect(reopened.completedWorks).toEqual([
      { id: 1, name: 'Replace hydraulic seal', laborHours: 2.5 },
    ]);
    expect(reopened.materials[0]).toMatchObject({
      name: 'Hydraulic seal',
      itemCode: 'SEAL-42',
      paymentSource: 'warranty',
    });
  });

  it('edits a certificate in the dialog', async () => {
    const fixture = await renderApp();
    const compiled = fixture.nativeElement as HTMLElement;

    compiled.querySelector<HTMLButtonElement>('[aria-label="Edit Hydraulic press"]')!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const machineName = compiled.querySelector<HTMLInputElement>(
      '[aria-label="Certificate machine name"]',
    );

    expect(machineName?.value).toBe('Hydraulic press');

    machineName!.value = 'Updated hydraulic press';
    machineName!.dispatchEvent(new Event('input', { bubbles: true }));
    compiled.querySelector<HTMLFormElement>('.edit-form')!.requestSubmit();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(compiled.textContent).toContain('Updated hydraulic press');
    expect(compiled.textContent).not.toContain('Ready to edit');
  });

  it('creates a new act from the dialog', async () => {
    const fixture = await renderApp();
    const compiled = fixture.nativeElement as HTMLElement;

    getCertificatesTable(fixture).createRequested.emit();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const setInputValue = (label: string, value: string): void => {
      const input = compiled.querySelector<HTMLInputElement>(`[aria-label="${label}"]`)!;

      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    };

    setInputValue('Certificate date', '2026-11-06');
    setInputValue('Certificate machine name', 'Packaging line');
    setInputValue('Certificate inventory number', 'PKG-0006');
    setInputValue('Certificate employees', 'Grace Hopper, Ada Lovelace');
    compiled.querySelector<HTMLFormElement>('.edit-form')!.requestSubmit();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(compiled.querySelectorAll('tbody tr')).toHaveLength(6);
    expect(compiled.textContent).toContain('Packaging line');
    expect(compiled.textContent).toContain('Grace Hopper, Ada Lovelace');
  });

  it('does not assign works or materials to a newly created act', async () => {
    const fixture = await renderApp();
    const compiled = fixture.nativeElement as HTMLElement;

    getCertificatesTable(fixture).createRequested.emit();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const setInputValue = (label: string, value: string): void => {
      const input = compiled.querySelector<HTMLInputElement>(`[aria-label="${label}"]`)!;

      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    };

    setInputValue('Certificate date', '2026-11-06');
    setInputValue('Certificate machine name', 'Empty packaging line');
    setInputValue('Certificate inventory number', 'PKG-EMPTY');
    setInputValue('Certificate employees', 'Grace Hopper');
    compiled.querySelector<HTMLFormElement>('.edit-form')!.requestSubmit();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const createdRow = Array.from(compiled.querySelectorAll<HTMLTableRowElement>('tbody tr')).find(
      (row) => row.textContent?.includes('Empty packaging line'),
    )!;

    createdRow.querySelector<HTMLTableCellElement>('.machine-cell')!.click();
    fixture.detectChanges();

    const createdAct = getActView(fixture).act();

    expect(createdAct.completedWorks).toEqual([]);
    expect(createdAct.materials).toEqual([]);
    expect(createdAct.requiredWorks).toEqual([]);
    expect(createdAct.postRepair.operational).toBeNull();
  });

  it('keeps a certificate when deletion is cancelled', async () => {
    const fixture = await renderApp();
    const compiled = fixture.nativeElement as HTMLElement;

    compiled.querySelector<HTMLButtonElement>('[aria-label="Delete Hydraulic press"]')!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const cancel = findLastButton(compiled, 'Cancel');

    expect(cancel).toBeDefined();
    cancel!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(compiled.textContent).toContain('Hydraulic press');
  });

  it('deletes a certificate after confirmation', async () => {
    const fixture = await renderApp();
    const compiled = fixture.nativeElement as HTMLElement;

    compiled.querySelector<HTMLButtonElement>('[aria-label="Delete Hydraulic press"]')!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const confirm = findLastButton(compiled, 'Delete');

    expect(confirm).toBeDefined();
    confirm!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(compiled.textContent).not.toContain('Hydraulic press');
  });

  it('keeps selected certificates when bulk deletion is cancelled', async () => {
    const fixture = await renderApp();
    const compiled = fixture.nativeElement as HTMLElement;
    const table = getCertificatesTable(fixture);

    table.deleteSelectedRequested.emit(table.certificates().slice(0, 2));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    findLastButton(compiled, 'Cancel')!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(compiled.textContent).toContain('CNC milling machine');
    expect(compiled.textContent).toContain('Hydraulic press');
  });

  it('deletes selected certificates after one confirmation', async () => {
    const fixture = await renderApp();
    const compiled = fixture.nativeElement as HTMLElement;
    const table = getCertificatesTable(fixture);

    table.deleteSelectedRequested.emit(table.certificates().slice(0, 2));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    findLastButton(compiled, 'Delete selected')!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(compiled.querySelectorAll('tbody tr')).toHaveLength(3);
    expect(compiled.textContent).not.toContain('CNC milling machine');
    expect(compiled.textContent).not.toContain('Hydraulic press');
  });
});
