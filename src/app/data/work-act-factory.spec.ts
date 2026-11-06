import { createWorkAct } from './work-act-factory';

describe('createWorkAct', () => {
  it('creates an empty act from certificate information', () => {
    const act = createWorkAct({
      id: 7,
      date: '2026-11-06',
      machineName: 'Packaging line',
      inventoryNumber: 'PKG-0007',
      employees: ['Grace Hopper', 'Ada Lovelace'],
    });

    expect(act).toMatchObject({
      id: 7,
      number: 'WR-2026-0007',
      date: '2026-11-06',
      equipment: {
        inventoryNumber: 'PKG-0007',
        name: 'Packaging line',
        model: '',
        repairReason: '',
        meterReading: '',
        brigade: ['Grace Hopper', 'Ada Lovelace'],
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
      performers: ['Grace Hopper', 'Ada Lovelace'],
    });
  });
});
