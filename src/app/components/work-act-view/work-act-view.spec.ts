import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTaiga } from '@taiga-ui/core';

import { createWorkAct } from '../../data/work-act-factory';
import { WorkActView } from './work-act-view';

const ACT = createWorkAct({
  id: 1,
  date: '2026-11-03',
  machineName: 'CNC milling machine',
  inventoryNumber: 'CNC-0142',
  employees: ['Alex Morgan', 'Maya Chen'],
});

describe('WorkActView', () => {
  let fixture: ComponentFixture<WorkActView>;
  let element: HTMLElement;

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
      imports: [WorkActView],
      providers: [provideTaiga()],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkActView);
    fixture.componentRef.setInput('act', ACT);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
  });

  it('renders exactly two tabs and opens the act front by default', () => {
    const tabs = Array.from(element.querySelectorAll<HTMLButtonElement>('button[tuiTab]'));

    expect(tabs).toHaveLength(2);
    expect(tabs.map((tab) => tab.textContent?.trim())).toEqual([
      'Act details',
      'Materials & completion',
    ]);
    expect(tabs[0]?.getAttribute('aria-selected')).toBe('true');
    expect(tabs[1]?.getAttribute('aria-selected')).toBe('false');
    expect(element.querySelector('#act-front-panel')).not.toBeNull();
    expect(element.textContent).toContain('November 3, 2026');
    expect(element.textContent).toContain('Equipment and repair request');
    expect(element.textContent).toContain('Completed work');
    expect(element.textContent).toContain('5.5 h');
  });

  it('shows materials and post-repair information on the second tab', async () => {
    element
      .querySelector<HTMLButtonElement>('#act-back-tab')!
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(element.querySelector('#act-back-panel')).not.toBeNull();
    expect(element.textContent).toContain('Spare parts and materials');
    expect(element.textContent).toContain('177.00 BYN');
    expect(element.textContent).toContain('Post-repair information');
    expect(element.textContent).toContain('Required follow-up work');
  });

  it('emits a back request', () => {
    let emitted = false;
    fixture.componentInstance.backRequested.subscribe(() => (emitted = true));

    element.querySelector<HTMLButtonElement>('button')!.click();

    expect(emitted).toBe(true);
  });
});
