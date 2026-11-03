import { DecimalPipe } from '@angular/common';
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
  long: new Intl.DateTimeFormat('en-US', {
    dateStyle: 'long',
    timeZone: 'UTC',
  }),
  medium: new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }),
};

@Pipe({ name: 'workActDate' })
class WorkActDatePipe implements PipeTransform {
  transform(value: string, style: keyof typeof ACT_DATE_FORMATTERS): string {
    const date = new Date(`${value}T00:00:00Z`);

    return Number.isNaN(date.getTime()) ? value : ACT_DATE_FORMATTERS[style].format(date);
  }
}

@Component({
  selector: 'app-work-act-view',
  imports: [DecimalPipe, TuiButton, TuiTabs, WorkActDatePipe],
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
  protected readonly totalMaterials = computed(() =>
    this.act().materials.reduce(
      (total, material) => total + material.quantity * material.unitPrice,
      0,
    ),
  );

  protected selectTab(index: number): void {
    this.activeTab.set(index === 1 ? 1 : 0);
  }
}
