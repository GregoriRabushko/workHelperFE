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
      model: 'Производственное оборудование',
      repairReason: 'Плановое техническое обслуживание и устранение выявленных неисправностей',
      meterReading: `${4_120 + certificate.id * 80} м/ч`,
      brigade: certificate.employees,
    },
    completedWorks: [
      { id: 1, name: 'Входная диагностика и выявление неисправностей', laborHours: 1.5 },
      { id: 2, name: 'Техническое обслуживание и замена изношенных деталей', laborHours: 3 },
      { id: 3, name: 'Проверка под нагрузкой и окончательная регулировка', laborHours: 1 },
    ],
    materials: [
      {
        id: 1,
        name: 'Комплект уплотнений',
        itemCode: `KIT-${String(certificate.id).padStart(3, '0')}`,
        unit: 'компл.',
        quantity: 1,
        unitPrice: 128,
        paymentSource: 'customer',
      },
      {
        id: 2,
        name: 'Индустриальное масло ISO VG 46',
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
        workType: 'Заменить повреждённый кожух во время следующей плановой остановки',
      },
      {
        id: 2,
        name: 'Таблички панели управления',
        quantity: 1,
        deliveryTime: 'В наличии',
        workType: 'Обновить предупреждающие и эксплуатационные таблички',
      },
    ],
    postRepair: {
      operational: true,
      acceptance: 'Принято без замечаний',
      notes: 'Техника прошла проверку под нагрузкой и готова к эксплуатации.',
      seniorMaster: 'Иван Петров',
      receivedBy: 'Сергей Волков',
    },
    performers: certificate.employees,
  };
}
