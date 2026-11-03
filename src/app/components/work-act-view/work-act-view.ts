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
import { TuiButton } from '@taiga-ui/core';
import { TuiTabs } from '@taiga-ui/kit';

import { type WorkAct } from '../../models/work-act';

const ACT_DATE_FORMATTERS = {
  medium: new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }),
};

const ACT_NUMBER_FORMATTERS = {
  hours: new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }),
};

@Pipe({ name: 'workActDate' })
class WorkActDatePipe implements PipeTransform {
  transform(value: string, style: keyof typeof ACT_DATE_FORMATTERS): string {
    const date = new Date(`${value}T00:00:00Z`);

    return Number.isNaN(date.getTime()) ? value : ACT_DATE_FORMATTERS[style].format(date);
  }
}

@Pipe({ name: 'workActNumber' })
class WorkActNumberPipe implements PipeTransform {
  transform(value: number, style: keyof typeof ACT_NUMBER_FORMATTERS): string {
    return ACT_NUMBER_FORMATTERS[style].format(value);
  }
}

@Component({
  selector: 'app-work-act-view',
  imports: [TuiButton, TuiTabs, WorkActDatePipe, WorkActNumberPipe],
  templateUrl: './work-act-view.html',
  styleUrl: './work-act-view.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkActView {
  readonly act = input.required<WorkAct>();
  readonly backRequested = output<void>();

  protected readonly activeTab = signal(0);
  protected readonly totalWorkHours = computed(() =>
    this.act().completedWorks.reduce((total, work) => total + work.laborHours, 0),
  );

  protected selectTab(index: number): void {
    this.activeTab.set(index === 1 ? 1 : 0);
  }
}
