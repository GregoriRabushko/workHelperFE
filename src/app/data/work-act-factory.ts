import { type WorkAct } from '../models/work-act';
import { type WorkCertificate } from '../models/work-certificate';

export function createWorkAct(certificate: WorkCertificate): WorkAct {
  return {
    id: certificate.id,
    number: `WR-2026-${String(certificate.id).padStart(4, '0')}`,
    date: certificate.date,
    company: {
      name: 'TROS service workshop',
      address: '4 Moskovskaya Street, Minsk District',
      phone: '+375 17 511-51-91',
    },
    equipment: {
      inventoryNumber: certificate.inventoryNumber,
      name: certificate.machineName,
      model: 'Workshop equipment',
      repairReason: 'Scheduled maintenance and elimination of detected faults',
      meterReading: `${4_120 + certificate.id * 80} h`,
      brigade: certificate.employees,
    },
    completedWorks: [
      { id: 1, name: 'Incoming diagnostics and fault assessment', laborHours: 1.5 },
      { id: 2, name: 'Preventive maintenance and replacement of worn parts', laborHours: 3 },
      { id: 3, name: 'Functional test and final adjustment', laborHours: 1 },
    ],
    materials: [
      {
        id: 1,
        name: 'Service seal kit',
        itemCode: `KIT-${String(certificate.id).padStart(3, '0')}`,
        unit: 'set',
        quantity: 1,
        unitPrice: 128,
        paymentSource: 'customer',
      },
      {
        id: 2,
        name: 'Industrial lubricant ISO VG 46',
        itemCode: 'LUB-46',
        unit: 'l',
        quantity: 5,
        unitPrice: 9.8,
        paymentSource: 'warranty',
      },
    ],
    requiredWorks: [
      {
        id: 1,
        name: 'Protective guard',
        quantity: 1,
        deliveryTime: '10 business days',
        workType: 'Replace the damaged guard during the next planned stop',
      },
      {
        id: 2,
        name: 'Control panel labels',
        quantity: 1,
        deliveryTime: 'In stock',
        workType: 'Renew safety and operating labels',
      },
    ],
    postRepair: {
      operational: true,
      acceptance: 'Accepted without remarks',
      notes: 'Equipment passed the load test and is ready for operation.',
      seniorMaster: 'James Carter',
      receivedBy: 'Morgan Lee',
    },
    performers: certificate.employees,
  };
}
