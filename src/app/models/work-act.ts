export interface WorkActCompany {
  readonly name: string;
  readonly address: string;
  readonly phone: string;
}

export interface WorkActEquipment {
  readonly inventoryNumber: string;
  readonly name: string;
  readonly model: string;
  readonly repairReason: string;
  readonly meterReading: string;
  readonly brigade: readonly string[];
}

export interface WorkActCompletedWork {
  readonly id: number;
  readonly name: string;
  readonly laborHours: number;
}

export type WorkActPaymentSource = 'customer' | 'warranty';

export interface WorkActMaterial {
  readonly id: number;
  readonly name: string;
  readonly itemCode: string;
  readonly unit: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly paymentSource: WorkActPaymentSource;
}

export interface WorkActRequiredWork {
  readonly id: number;
  readonly name: string;
  readonly quantity: number;
  readonly deliveryTime: string;
  readonly workType: string;
}

export interface WorkActPostRepair {
  readonly operational: boolean;
  readonly acceptance: string;
  readonly notes: string;
  readonly seniorMaster: string;
  readonly receivedBy: string;
}

export interface WorkAct {
  readonly id: number;
  readonly number: string;
  readonly date: string;
  readonly equipment: WorkActEquipment;
  readonly completedWorks: readonly WorkActCompletedWork[];
  readonly materials: readonly WorkActMaterial[];
  readonly requiredWorks: readonly WorkActRequiredWork[];
  readonly postRepair: WorkActPostRepair;
  readonly performers: readonly string[];
}
