import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTaiga } from '@taiga-ui/core';

import { App } from './app';

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

    compiled.querySelector<HTMLButtonElement>('[aria-label="View Hydraulic press"]')!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(compiled.querySelectorAll('button[tuiTab]')).toHaveLength(2);
    expect(compiled.textContent).toContain('Work completion act WR-2026-0002');
    expect(compiled.textContent).toContain('Equipment and repair request');

    compiled.querySelector<HTMLButtonElement>('#act-back-tab')!.click();
    fixture.detectChanges();
    expect(compiled.textContent).toContain('Spare parts and materials');

    const back = Array.from(compiled.querySelectorAll<HTMLButtonElement>('button')).find(
      (button) => button.textContent?.trim() === 'All acts',
    );
    back!.click();
    fixture.detectChanges();

    expect(compiled.textContent).toContain('Certificates of work performed');
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
});
