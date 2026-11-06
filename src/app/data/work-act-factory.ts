import { type WorkAct } from '../models/work-act';
import { type WorkCertificate } from '../models/work-certificate';

export function createWorkAct(certificate: WorkCertificate): WorkAct {
  return {
    id: certificate.id,
    number: `WR-2026-${String(certificate.id).padStart(4, '0')}`,
    date: certificate.date,
    equipment: {
      inventoryNumber: certificate.inventoryNumber,
      name: certificate.machineName,
      model: '',
      repairReason: '',
      meterReading: '',
      brigade: certificate.employees,
    },
    completedWorks: [],
    materials: [],
    requiredWorks: [],
    postRepair: {
      operational: null,
      acceptance: '',
      notes: '',
      seniorMaster: '',
      receivedBy: '',
    },
    performers: certificate.employees,
  };
}
