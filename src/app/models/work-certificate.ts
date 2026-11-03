export interface WorkCertificate {
  readonly id: number;
  readonly date: string;
  readonly machineName: string;
  readonly inventoryNumber: string;
  readonly employees: readonly string[];
}
