import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideTaiga, TuiRoot } from '@taiga-ui/core';

import { type WorkAct } from '../../models/work-act';
import { WorkActView } from './work-act-view';

const ACT: WorkAct = {
  id: 1,
  number: 'WR-2026-0001',
  date: '2026-11-03',
  equipment: {
    inventoryNumber: 'CNC-0142',
    name: 'CNC milling machine',
    model: 'MX-200',
    repairReason: 'Плановое техническое обслуживание',
    meterReading: '4 200 м/ч',
    brigade: ['Alex Morgan', 'Maya Chen'],
  },
  completedWorks: [
    { id: 1, name: 'Диагностика', laborHours: 1.5 },
    { id: 2, name: 'Замена деталей', laborHours: 2 },
  ],
  materials: [
    {
      id: 1,
      name: 'Комплект уплотнений',
      itemCode: 'KIT-001',
      unit: 'компл.',
      quantity: 1,
      unitPrice: 128,
      paymentSource: 'customer',
    },
    {
      id: 2,
      name: 'Индустриальное масло',
      itemCode: 'LUB-46',
      unit: 'л',
      quantity: 5,
      unitPrice: 9.8,
      paymentSource: 'warranty',
    },
  ],
  requiredWorks: [
    {
      id: 1,
      name: 'Защитный кожух',
      quantity: 1,
      deliveryTime: '10 рабочих дней',
      workType: 'Заменить повреждённый кожух',
    },
    {
      id: 2,
      name: 'Таблички',
      quantity: 1,
      deliveryTime: 'В наличии',
      workType: 'Обновить предупреждающие таблички',
    },
  ],
  postRepair: {
    operational: true,
    acceptance: 'Принято без замечаний',
    notes: '',
    seniorMaster: 'Иван Петров',
    receivedBy: 'Сергей Волков',
  },
  performers: ['Alex Morgan', 'Maya Chen'],
};

@Component({
  imports: [TuiRoot, WorkActView],
  template: `
    <tui-root>
      <app-work-act-view [act]="act()" (actUpdated)="handleUpdate($event)" />
    </tui-root>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TestHost {
  readonly act = signal(ACT);
  readonly updates: WorkAct[] = [];

  handleUpdate(act: WorkAct): void {
    this.updates.push(act);
    this.act.set(act);
  }
}

describe('WorkActView', () => {
  let fixture: ComponentFixture<TestHost>;
  let element: HTMLElement;
  let component: WorkActView;

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
      imports: [TestHost],
      providers: [provideTaiga()],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
    component = fixture.debugElement.query(By.directive(WorkActView))
      .componentInstance as WorkActView;
  });

  async function stabilize(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function setInputValue(label: string, value: string): void {
    const input = element.querySelector<HTMLInputElement>(`[aria-label="${label}"]`);

    expect(input).not.toBeNull();
    input!.value = value;
    input!.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function findButton(label: string): HTMLButtonElement | undefined {
    return Array.from(element.querySelectorAll<HTMLButtonElement>('button')).find(
      (button) => button.textContent?.trim() === label,
    );
  }

  function findLastButton(label: string): HTMLButtonElement | undefined {
    return Array.from(element.querySelectorAll<HTMLButtonElement>('button'))
      .filter((button) => button.textContent?.trim() === label)
      .at(-1);
  }

  it('renders exactly two tabs and opens the act front by default', () => {
    const tabs = Array.from(element.querySelectorAll<HTMLButtonElement>('button[tuiTab]'));

    expect(tabs).toHaveLength(2);
    expect(tabs.map((tab) => tab.textContent?.trim())).toEqual([
      'Начало акта',
      'Материалы и завершение',
    ]);
    expect(tabs[0]?.getAttribute('aria-selected')).toBe('true');
    expect(tabs[1]?.getAttribute('aria-selected')).toBe('false');
    expect(element.querySelector('#act-front-panel')).not.toBeNull();
    expect(element.textContent).toContain('3 нояб. 2026 г.');
    expect(element.textContent).toContain('Техника и заявка на ремонт');
    expect(element.textContent).toContain('Выполненные работы');
    expect(element.textContent).toContain('3,5 м/ч');
  });

  it('shows only the date in the act header', () => {
    const metadata = element.querySelector<HTMLElement>('.act-header .document-meta');

    expect(metadata).not.toBeNull();
    expect(metadata!.textContent).toContain('Дата акта');
    expect(metadata!.textContent).toContain('3 нояб. 2026 г.');
    expect(metadata!.textContent).not.toContain('Исполнитель');
    expect(metadata!.textContent).not.toContain('Номер акта');
    expect(metadata!.textContent).not.toContain('WR-2026-0001');
  });

  it('shows material, post-repair, and required-work fields with row actions', async () => {
    element.querySelector<HTMLButtonElement>('#act-back-tab')!.click();
    await stabilize();

    const materialHeadings = Array.from(
      element.querySelectorAll<HTMLTableCellElement>('.materials-table thead th'),
      (heading) => heading.textContent?.trim(),
    );

    expect(materialHeadings).toEqual([
      '#',
      'Наименование',
      'Код товара',
      'Ед. изм.',
      'Кол-во',
      'Гарантия',
      'Действия',
    ]);
    expect(element.querySelector('.materials-table tfoot')).toBeNull();
    expect(element.textContent).not.toContain('Цена с НДС');

    const postRepair =
      element.querySelector<HTMLElement>('#post-repair-title')!.parentElement!.parentElement!;

    expect(postRepair.querySelectorAll('.post-repair-grid > div')).toHaveLength(1);
    expect(postRepair.textContent).toContain('Состояние техники');
    expect(postRepair.textContent).toContain('Рабочее');

    const requiredTable = element.querySelector<HTMLTableElement>('.required-table')!;
    const requiredHeadings = Array.from(
      requiredTable.querySelectorAll<HTMLTableCellElement>('thead th'),
      (heading) => heading.textContent?.trim(),
    );

    expect(requiredHeadings).toEqual(['Необходимые виды работ', 'Действия']);
    expect(requiredTable.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(requiredTable.textContent).toContain('Заменить повреждённый кожух');
    expect(requiredTable.textContent).not.toContain('10 рабочих дней');
  });

  it('renders accessible empty states for manually filled collections', async () => {
    fixture.componentInstance.act.set({
      ...ACT,
      completedWorks: [],
      materials: [],
      requiredWorks: [],
    });
    await stabilize();

    expect(element.textContent).toContain('Выполненные работы не добавлены');
    expect(element.textContent).toContain('0,0 м/ч');

    element.querySelector<HTMLButtonElement>('#act-back-tab')!.click();
    await stabilize();

    expect(element.textContent).toContain('Материалы не добавлены');
    expect(element.textContent).toContain('Необходимые работы не добавлены');
  });

  it('shows a neutral state when equipment condition is not specified', async () => {
    fixture.componentInstance.act.set({
      ...ACT,
      postRepair: {
        ...ACT.postRepair,
        operational: null,
      },
    });
    await stabilize();
    element.querySelector<HTMLButtonElement>('#act-back-tab')!.click();
    await stabilize();

    const condition = element.querySelector<HTMLElement>('.condition')!;

    expect(condition.textContent?.trim()).toBe('Не указано');
    expect(condition.classList.contains('condition--neutral')).toBe(true);
    expect(condition.classList.contains('condition--negative')).toBe(false);
  });

  it('emits edited act information as an immutable value', async () => {
    findButton('Редактировать сведения')!.click();
    await stabilize();

    setInputValue('Наименование техники', 'Обновлённый станок');
    setInputValue('Бригада и исполнители', 'Иван Иванов, Анна Петрова');
    const operational = element.querySelector<HTMLSelectElement>(
      'select[formControlName="operational"]',
    )!;

    operational.selectedIndex = 2;
    operational.dispatchEvent(new Event('change', { bubbles: true }));
    element.querySelector<HTMLFormElement>('.act-edit-form')!.requestSubmit();
    await stabilize();

    const updated = fixture.componentInstance.updates.at(-1)!;

    expect(updated).not.toBe(ACT);
    expect(updated.equipment).not.toBe(ACT.equipment);
    expect(updated.equipment.name).toBe('Обновлённый станок');
    expect(updated.equipment.brigade).toEqual(['Иван Иванов', 'Анна Петрова']);
    expect(updated.performers).toEqual(['Иван Иванов', 'Анна Петрова']);
    expect(updated.postRepair.operational).toBe(false);
    expect(ACT.equipment.name).toBe('CNC milling machine');
  });

  it('keeps submit enabled and announces validation errors after a failed attempt', async () => {
    findButton('Добавить работу')!.click();
    await stabilize();

    const form = element.querySelector<HTMLFormElement>('.work-edit-form')!;
    const submit = Array.from(form.querySelectorAll<HTMLButtonElement>('button')).find(
      (button) => button.type === 'submit',
    )!;

    expect(form.hasAttribute('novalidate')).toBe(true);
    expect(submit.disabled).toBe(false);

    form.requestSubmit();
    await stabilize();

    expect(form.querySelector('[role="alert"]')?.textContent).toContain(
      'Укажите наименование работы',
    );
    expect(fixture.componentInstance.updates).toHaveLength(0);
  });

  it('adds, edits, and deletes completed works', async () => {
    findButton('Добавить работу')!.click();
    await stabilize();

    setInputValue('Наименование работы', 'Настройка автоматики');
    setInputValue('Моточасы', '2.5');
    element.querySelector<HTMLFormElement>('.work-edit-form')!.requestSubmit();
    await stabilize();

    let updated = fixture.componentInstance.updates.at(-1)!;
    const added = updated.completedWorks.at(-1)!;

    expect(added).toEqual({ id: 3, name: 'Настройка автоматики', laborHours: 2.5 });

    element
      .querySelector<HTMLButtonElement>(
        '[aria-label="Редактировать работу: Настройка автоматики"]',
      )!
      .click();
    await stabilize();
    setInputValue('Наименование работы', 'Настройка контроллера');
    element.querySelector<HTMLFormElement>('.work-edit-form')!.requestSubmit();
    await stabilize();

    updated = fixture.componentInstance.updates.at(-1)!;
    expect(updated.completedWorks.find(({ id }) => id === 3)?.name).toBe('Настройка контроллера');

    element
      .querySelector<HTMLButtonElement>('[aria-label="Удалить работу: Настройка контроллера"]')!
      .click();
    await stabilize();

    expect(
      fixture.componentInstance.updates.at(-1)!.completedWorks.some(({ id }) => id === 3),
    ).toBe(true);
    findLastButton('Удалить')!.click();
    await stabilize();

    updated = fixture.componentInstance.updates.at(-1)!;
    expect(updated.completedWorks.some(({ id }) => id === 3)).toBe(false);
  });

  it('adds, edits, and deletes materials without exposing price columns', async () => {
    element.querySelector<HTMLButtonElement>('#act-back-tab')!.click();
    await stabilize();
    findButton('Добавить материал')!.click();
    await stabilize();

    setInputValue('Наименование материала', 'Воздушный фильтр');
    setInputValue('Код товара', 'FLT-100');
    setInputValue('Единица измерения', 'шт.');
    setInputValue('Количество материала', '2');
    const paymentSource = element.querySelector<HTMLSelectElement>(
      '[aria-label="Источник оплаты"]',
    )!;

    paymentSource.value = 'warranty';
    paymentSource.dispatchEvent(new Event('change', { bubbles: true }));
    element.querySelector<HTMLFormElement>('.material-edit-form')!.requestSubmit();
    await stabilize();

    let updated = fixture.componentInstance.updates.at(-1)!;
    const added = updated.materials.at(-1)!;

    expect(added).toMatchObject({
      id: 3,
      name: 'Воздушный фильтр',
      quantity: 2,
      unitPrice: 0,
      paymentSource: 'warranty',
    });

    element
      .querySelector<HTMLButtonElement>(
        '[aria-label="Редактировать материал: Комплект уплотнений"]',
      )!
      .click();
    await stabilize();
    setInputValue('Количество материала', '3');
    element.querySelector<HTMLFormElement>('.material-edit-form')!.requestSubmit();
    await stabilize();

    updated = fixture.componentInstance.updates.at(-1)!;
    const edited = updated.materials.find(({ id }) => id === 1)!;

    expect(edited.quantity).toBe(3);
    expect(edited.unitPrice).toBe(128);

    element
      .querySelector<HTMLButtonElement>('[aria-label="Удалить материал: Воздушный фильтр"]')!
      .click();
    await stabilize();

    findLastButton('Удалить')!.click();
    await stabilize();

    updated = fixture.componentInstance.updates.at(-1)!;
    expect(updated.materials.some(({ id }) => id === 3)).toBe(false);
  });

  it('adds, edits, and deletes required work descriptions', async () => {
    element.querySelector<HTMLButtonElement>('#act-back-tab')!.click();
    await stabilize();
    findButton('Добавить вид работ')!.click();
    await stabilize();

    setInputValue('Описание необходимой работы', 'Проверить систему охлаждения');
    element.querySelector<HTMLFormElement>('.required-work-edit-form')!.requestSubmit();
    await stabilize();

    let updated = fixture.componentInstance.updates.at(-1)!;
    const added = updated.requiredWorks.at(-1)!;

    expect(added).toMatchObject({
      id: 3,
      name: 'Проверить систему охлаждения',
      quantity: 1,
      deliveryTime: '',
      workType: 'Проверить систему охлаждения',
    });

    element
      .querySelector<HTMLButtonElement>(
        '[aria-label="Редактировать вид работ: Проверить систему охлаждения"]',
      )!
      .click();
    await stabilize();
    setInputValue('Описание необходимой работы', 'Промыть систему охлаждения');
    element.querySelector<HTMLFormElement>('.required-work-edit-form')!.requestSubmit();
    await stabilize();

    updated = fixture.componentInstance.updates.at(-1)!;
    expect(updated.requiredWorks.find(({ id }) => id === 3)?.workType).toBe(
      'Промыть систему охлаждения',
    );
    expect(updated.requiredWorks.find(({ id }) => id === 3)?.name).toBe(
      'Промыть систему охлаждения',
    );

    element
      .querySelector<HTMLButtonElement>(
        '[aria-label="Удалить вид работ: Промыть систему охлаждения"]',
      )!
      .click();
    await stabilize();

    findLastButton('Удалить')!.click();
    await stabilize();

    updated = fixture.componentInstance.updates.at(-1)!;
    expect(updated.requiredWorks.some(({ id }) => id === 3)).toBe(false);
  });

  it('emits a back request', () => {
    let emitted = false;

    component.backRequested.subscribe(() => (emitted = true));
    findButton('Все акты')!.click();

    expect(emitted).toBe(true);
  });
});
