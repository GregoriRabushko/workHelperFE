import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  type AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  type ValidationErrors,
  type ValidatorFn,
  Validators,
} from '@angular/forms';
import { TuiButton, TuiDialog, TuiDialogService, TuiInput } from '@taiga-ui/core';
import { TUI_CONFIRM } from '@taiga-ui/kit';

import {
  type WorkAct,
  type WorkActCompletedWork,
  type WorkActMaterial,
  type WorkActPaymentSource,
  type WorkActRequiredWork,
} from '../../models/work-act';

const nonBlank: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  typeof control.value === 'string' && control.value.trim() ? null : { required: true };

const positiveNumber: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  typeof control.value === 'number' && Number.isFinite(control.value) && control.value > 0
    ? null
    : { positive: true };

@Component({
  selector: 'app-work-act-editors',
  imports: [ReactiveFormsModule, TuiButton, TuiDialog, TuiInput],
  templateUrl: './work-act-editors.html',
  styleUrl: './work-act-editors.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkActEditors {
  private readonly dialogs = inject(TuiDialogService);

  readonly act = input.required<WorkAct>();
  readonly actUpdated = output<WorkAct>();

  protected readonly actDialogOpen = signal(false);
  protected readonly workDialogOpen = signal(false);
  protected readonly materialDialogOpen = signal(false);
  protected readonly requiredWorkDialogOpen = signal(false);
  protected readonly workTarget = signal<WorkActCompletedWork | null>(null);
  protected readonly materialTarget = signal<WorkActMaterial | null>(null);
  protected readonly requiredWorkTarget = signal<WorkActRequiredWork | null>(null);

  protected readonly actDialogOptions = {
    label: 'Редактировать сведения акта',
    size: 'l' as const,
  };
  protected readonly workDialogOptions = computed(() => ({
    label: this.workTarget() ? 'Редактировать работу' : 'Добавить работу',
    size: 's' as const,
  }));
  protected readonly materialDialogOptions = computed(() => ({
    label: this.materialTarget() ? 'Редактировать материал' : 'Добавить материал',
    size: 's' as const,
  }));
  protected readonly requiredWorkDialogOptions = computed(() => ({
    label: this.requiredWorkTarget() ? 'Редактировать вид работ' : 'Добавить вид работ',
    size: 's' as const,
  }));

  protected readonly actForm = new FormGroup({
    date: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    equipmentName: new FormControl('', { nonNullable: true, validators: [nonBlank] }),
    inventoryNumber: new FormControl('', { nonNullable: true, validators: [nonBlank] }),
    model: new FormControl('', { nonNullable: true, validators: [nonBlank] }),
    repairReason: new FormControl('', { nonNullable: true, validators: [nonBlank] }),
    meterReading: new FormControl('', { nonNullable: true, validators: [nonBlank] }),
    performers: new FormControl('', { nonNullable: true, validators: [nonBlank] }),
    operational: new FormControl<boolean | null>(null),
  });
  protected readonly workForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [nonBlank] }),
    laborHours: new FormControl(1, { nonNullable: true, validators: [positiveNumber] }),
  });
  protected readonly materialForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [nonBlank] }),
    itemCode: new FormControl('', { nonNullable: true, validators: [nonBlank] }),
    unit: new FormControl('', { nonNullable: true, validators: [nonBlank] }),
    quantity: new FormControl(1, { nonNullable: true, validators: [positiveNumber] }),
    paymentSource: new FormControl<WorkActPaymentSource>('customer', { nonNullable: true }),
    receivedBy: new FormControl('', { nonNullable: true, validators: [nonBlank] }),
  });
  protected readonly requiredWorkForm = new FormGroup({
    workType: new FormControl('', { nonNullable: true, validators: [nonBlank] }),
  });

  openActEditor(): void {
    const act = this.act();
    const performers = act.performers.length ? act.performers : act.equipment.brigade;

    this.actForm.reset({
      date: act.date,
      equipmentName: act.equipment.name,
      inventoryNumber: act.equipment.inventoryNumber,
      model: act.equipment.model,
      repairReason: act.equipment.repairReason,
      meterReading: act.equipment.meterReading,
      performers: performers.join(', '),
      operational: act.postRepair.operational,
    });
    this.actDialogOpen.set(true);
  }

  openWorkEditor(work: WorkActCompletedWork | null = null): void {
    this.workTarget.set(work);
    this.workForm.reset({
      name: work?.name ?? '',
      laborHours: work?.laborHours ?? 1,
    });
    this.workDialogOpen.set(true);
  }

  deleteWork(work: WorkActCompletedWork): void {
    this.confirmDeletion('Удалить работу?', `Работа «${work.name}» будет удалена из акта.`, () => {
      const act = this.act();

      this.actUpdated.emit({
        ...act,
        completedWorks: act.completedWorks.filter(({ id }) => id !== work.id),
      });
    });
  }

  openMaterialEditor(material: WorkActMaterial | null = null): void {
    const brigade = this.act().equipment.brigade;
    const receivedBy =
      material && brigade.includes(material.receivedBy) ? material.receivedBy : (brigade[0] ?? '');

    this.materialTarget.set(material);
    this.materialForm.reset({
      name: material?.name ?? '',
      itemCode: material?.itemCode ?? '',
      unit: material?.unit ?? '',
      quantity: material?.quantity ?? 1,
      paymentSource: material?.paymentSource ?? 'customer',
      receivedBy,
    });
    this.materialDialogOpen.set(true);
  }

  deleteMaterial(material: WorkActMaterial): void {
    this.confirmDeletion(
      'Удалить материал?',
      `Материал «${material.name}» будет удалён из акта.`,
      () => {
        const act = this.act();

        this.actUpdated.emit({
          ...act,
          materials: act.materials.filter(({ id }) => id !== material.id),
        });
      },
    );
  }

  openRequiredWorkEditor(work: WorkActRequiredWork | null = null): void {
    this.requiredWorkTarget.set(work);
    this.requiredWorkForm.reset({ workType: work?.workType ?? '' });
    this.requiredWorkDialogOpen.set(true);
  }

  deleteRequiredWork(work: WorkActRequiredWork): void {
    this.confirmDeletion(
      'Удалить необходимую работу?',
      `Работа «${work.workType}» будет удалена из акта.`,
      () => {
        const act = this.act();

        this.actUpdated.emit({
          ...act,
          requiredWorks: act.requiredWorks.filter(({ id }) => id !== work.id),
        });
      },
    );
  }

  protected saveAct(): void {
    if (this.actForm.invalid) {
      this.actForm.markAllAsTouched();
      return;
    }

    const value = this.actForm.getRawValue();
    const performers = this.parseList(value.performers);

    if (!performers.length) {
      this.actForm.controls.performers.setErrors({ required: true });
      this.actForm.controls.performers.markAsTouched();
      return;
    }

    const act = this.act();

    this.actUpdated.emit({
      ...act,
      date: value.date,
      equipment: {
        ...act.equipment,
        inventoryNumber: value.inventoryNumber.trim(),
        name: value.equipmentName.trim(),
        model: value.model.trim(),
        repairReason: value.repairReason.trim(),
        meterReading: value.meterReading.trim(),
        brigade: performers,
      },
      postRepair: {
        ...act.postRepair,
        operational: value.operational,
      },
      performers,
    });
    this.actDialogOpen.set(false);
  }

  protected saveWork(): void {
    if (this.workForm.invalid) {
      this.workForm.markAllAsTouched();
      return;
    }

    const act = this.act();
    const target = this.workTarget();
    const value = this.workForm.getRawValue();
    const updated: WorkActCompletedWork = {
      id: target?.id ?? this.nextId(act.completedWorks),
      name: value.name.trim(),
      laborHours: value.laborHours,
    };

    this.actUpdated.emit({
      ...act,
      completedWorks: target
        ? act.completedWorks.map((work) => (work.id === target.id ? updated : work))
        : [...act.completedWorks, updated],
    });
    this.workDialogOpen.set(false);
    this.workTarget.set(null);
  }

  protected saveMaterial(): void {
    if (this.materialForm.invalid) {
      this.materialForm.markAllAsTouched();
      return;
    }

    const act = this.act();
    const target = this.materialTarget();
    const value = this.materialForm.getRawValue();
    const updated: WorkActMaterial = {
      id: target?.id ?? this.nextId(act.materials),
      name: value.name.trim(),
      itemCode: value.itemCode.trim(),
      unit: value.unit.trim(),
      quantity: value.quantity,
      unitPrice: target?.unitPrice ?? 0,
      paymentSource: value.paymentSource,
      receivedBy: value.receivedBy,
    };

    this.actUpdated.emit({
      ...act,
      materials: target
        ? act.materials.map((material) => (material.id === target.id ? updated : material))
        : [...act.materials, updated],
    });
    this.materialDialogOpen.set(false);
    this.materialTarget.set(null);
  }

  protected saveRequiredWork(): void {
    if (this.requiredWorkForm.invalid) {
      this.requiredWorkForm.markAllAsTouched();
      return;
    }

    const act = this.act();
    const target = this.requiredWorkTarget();
    const workType = this.requiredWorkForm.controls.workType.getRawValue().trim();
    const updated: WorkActRequiredWork = {
      id: target?.id ?? this.nextId(act.requiredWorks),
      name: workType,
      quantity: target?.quantity ?? 1,
      deliveryTime: target?.deliveryTime ?? '',
      workType,
    };

    this.actUpdated.emit({
      ...act,
      requiredWorks: target
        ? act.requiredWorks.map((work) => (work.id === target.id ? updated : work))
        : [...act.requiredWorks, updated],
    });
    this.requiredWorkDialogOpen.set(false);
    this.requiredWorkTarget.set(null);
  }

  protected closeDialog(dialog: 'act' | 'work' | 'material' | 'requiredWork'): void {
    if (dialog === 'act') {
      this.actDialogOpen.set(false);
    } else if (dialog === 'work') {
      this.workDialogOpen.set(false);
      this.workTarget.set(null);
    } else if (dialog === 'material') {
      this.materialDialogOpen.set(false);
      this.materialTarget.set(null);
    } else {
      this.requiredWorkDialogOpen.set(false);
      this.requiredWorkTarget.set(null);
    }
  }

  private nextId(items: readonly { readonly id: number }[]): number {
    return items.reduce((highestId, { id }) => Math.max(highestId, id), 0) + 1;
  }

  private parseList(value: string): readonly string[] {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private confirmDeletion(label: string, content: string, onConfirm: () => void): void {
    this.dialogs
      .open<boolean>(TUI_CONFIRM, {
        label,
        size: 's',
        data: {
          content,
          yes: 'Удалить',
          no: 'Отмена',
          appearance: ['primary-destructive', 'secondary'],
        },
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          onConfirm();
        }
      });
  }
}
