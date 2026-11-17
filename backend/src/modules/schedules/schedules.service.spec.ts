import { Test, TestingModule } from '@nestjs/testing';
import { SchedulesService } from './schedules.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnloadingSchedule } from '../../entities/unloading-schedule.entity';
import { StageLog } from '../../entities/stage-log.entity';
import { Dock } from '../../entities/dock.entity';
import { Truck } from '../../entities/truck.entity';
import { ScheduleStage, SchedulePriority } from '../../common/enums/stage.enum';
import { DockStatus, DockType } from '../../common/enums/dock-status.enum';

describe('SchedulesService', () => {
  let service: SchedulesService;
  let mockScheduleRepo: any;
  let mockStageLogRepo: any;
  let mockDockRepo: any;
  let mockTruckRepo: any;

  beforeEach(async () => {
    mockScheduleRepo = {
      create: jest.fn((dto) => dto),
      save: jest.fn((entity) => Promise.resolve({ id: 10, ...entity })),
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    mockStageLogRepo = {
      create: jest.fn((dto) => dto),
      save: jest.fn((entity) => Promise.resolve({ id: 100, ...entity })),
    };

    mockDockRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
    };

    mockTruckRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulesService,
        { provide: getRepositoryToken(UnloadingSchedule), useValue: mockScheduleRepo },
        { provide: getRepositoryToken(StageLog), useValue: mockStageLogRepo },
        { provide: getRepositoryToken(Dock), useValue: mockDockRepo },
        { provide: getRepositoryToken(Truck), useValue: mockTruckRepo },
      ],
    }).compile();

    service = module.get<SchedulesService>(SchedulesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a schedule and its initial stage log', async () => {
      mockTruckRepo.findOne.mockResolvedValue({ id: 1, plate: 'ABC-1234' });
      mockDockRepo.findOne.mockResolvedValue({ id: 2, code: 'DOCA-01' });

      // Mock findOne for return of created schedule
      mockScheduleRepo.findOne.mockResolvedValue({
        id: 10,
        code: 'SCH-TEST',
        truckId: 1,
        dockId: 2,
        scheduledStartTime: new Date(),
        scheduledEndTime: new Date(),
        currentStage: ScheduleStage.IN_TRANSIT,
        stageLogs: [],
      });

      const result = await service.create(
        {
          truckId: 1,
          dockId: 2,
          scheduledStartTime: '2026-11-17T08:00:00Z',
          scheduledEndTime: '2026-11-17T10:00:00Z',
          cargoDescription: 'Carga Geral',
          initialStage: ScheduleStage.IN_TRANSIT,
        },
        1,
      );

      expect(mockScheduleRepo.create).toHaveBeenCalled();
      expect(mockStageLogRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          stage: ScheduleStage.IN_TRANSIT,
          scheduleId: 10,
        }),
      );
      expect(result).toHaveProperty('id', 10);
    });
  });

  describe('updateStage', () => {
    it('should close current stage log and create a new one with reason', async () => {
      const startedAt = new Date(Date.now() - 30 * 60 * 1000); // 30 min ago
      const existingLog: any = {
        id: 1,
        stage: ScheduleStage.IN_TRANSIT,
        startedAt,
        endedAt: null,
      };

      const existingSchedule: any = {
        id: 10,
        code: 'SCH-TEST',
        currentStage: ScheduleStage.IN_TRANSIT,
        stageLogs: [existingLog],
      };

      mockScheduleRepo.findOne.mockImplementation(({ where }) => {
        if (where?.id === 10) {
          return Promise.resolve(existingSchedule);
        }
        return Promise.resolve(null);
      });

      await service.updateStage(
        10,
        {
          stage: ScheduleStage.STOPPED,
          reason: 'Congestionamento na BR-101',
          notes: 'Previsão de 20 min',
        },
        2,
      );

      // Verify that existingLog was closed with duration calculated
      expect(existingLog.endedAt).toBeDefined();
      expect(existingLog.durationMinutes).toBeGreaterThanOrEqual(29);
      expect(mockStageLogRepo.save).toHaveBeenCalledWith(existingLog);

      // Verify that new stage log was created with reason
      expect(mockStageLogRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          scheduleId: 10,
          stage: ScheduleStage.STOPPED,
          reason: 'Congestionamento na BR-101',
        }),
      );
    });

    it('should record location and images when updating stage', async () => {
      const existingLog: any = {
        id: 1,
        stage: ScheduleStage.IN_TRANSIT,
        startedAt: new Date(Date.now() - 10 * 60 * 1000),
        endedAt: null,
      };

      const existingSchedule: any = {
        id: 10,
        code: 'SCH-TEST',
        currentStage: ScheduleStage.IN_TRANSIT,
        stageLogs: [existingLog],
      };

      mockScheduleRepo.findOne.mockResolvedValue(existingSchedule);

      await service.updateStage(
        10,
        {
          stage: ScheduleStage.STOPPED,
          reason: 'Troca de pneu',
          latitude: -23.55,
          longitude: -46.63,
          locationName: 'KM 50 Rodovia',
          images: [
            {
              url: 'data:image/png;base64,abc',
              caption: 'Pneu avariado',
            },
          ],
        },
        3,
      );

      expect(mockStageLogRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: -23.55,
          longitude: -46.63,
          locationName: 'KM 50 Rodovia',
          images: expect.arrayContaining([
            expect.objectContaining({ caption: 'Pneu avariado' }),
          ]),
        }),
      );
      expect(existingSchedule.lastLatitude).toBe(-23.55);
      expect(existingSchedule.lastLongitude).toBe(-46.63);
    });
  });

  describe('updateLocation', () => {
    it('should update location on schedule and active stage log', async () => {
      const activeLog: any = {
        id: 5,
        stage: ScheduleStage.IN_TRANSIT,
        startedAt: new Date(),
        endedAt: null,
      };
      const existingSchedule: any = {
        id: 10,
        stageLogs: [activeLog],
      };

      mockScheduleRepo.findOne.mockResolvedValue(existingSchedule);

      await service.updateLocation(10, {
        latitude: -23.123,
        longitude: -46.456,
        locationName: 'Posto de Gasolina Graal',
      });

      expect(existingSchedule.lastLatitude).toBe(-23.123);
      expect(existingSchedule.lastLongitude).toBe(-46.456);
      expect(activeLog.latitude).toBe(-23.123);
      expect(activeLog.locationName).toBe('Posto de Gasolina Graal');
      expect(mockStageLogRepo.save).toHaveBeenCalledWith(activeLog);
      expect(mockScheduleRepo.save).toHaveBeenCalledWith(existingSchedule);
    });
  });

  describe('addStageImage', () => {
    it('should add image to current active stage log', async () => {
      const activeLog: any = {
        id: 5,
        stage: ScheduleStage.WAITING_YARD,
        startedAt: new Date(),
        endedAt: null,
        images: [],
      };
      const existingSchedule: any = {
        id: 10,
        currentStage: ScheduleStage.WAITING_YARD,
        stageLogs: [activeLog],
      };

      mockScheduleRepo.findOne.mockResolvedValue(existingSchedule);

      await service.addStageImage(10, {
        url: '/uploads/canhoto.jpg',
        caption: 'Canhoto da NF assinado',
      });

      expect(activeLog.images.length).toBe(1);
      expect(activeLog.images[0]).toMatchObject({
        url: '/uploads/canhoto.jpg',
        caption: 'Canhoto da NF assinado',
        stage: ScheduleStage.WAITING_YARD,
      });
      expect(mockStageLogRepo.save).toHaveBeenCalledWith(activeLog);
    });
  });

  describe('getMetrics', () => {
    it('should aggregate stopped and unloading times correctly', async () => {
      mockScheduleRepo.find.mockResolvedValue([
        {
          id: 1,
          currentStage: ScheduleStage.STOPPED,
          scheduledEndTime: new Date(Date.now() + 60000),
          stageLogs: [
            {
              stage: ScheduleStage.STOPPED,
              startedAt: new Date(Date.now() - 25 * 60000),
              endedAt: null,
              durationMinutes: 0,
            },
          ],
        },
        {
          id: 2,
          currentStage: ScheduleStage.COMPLETED,
          actualEndAt: new Date(),
          scheduledEndTime: new Date(Date.now() + 60000),
          stageLogs: [
            {
              stage: ScheduleStage.UNLOADING,
              startedAt: new Date(Date.now() - 40 * 60000),
              endedAt: new Date(),
              durationMinutes: 40,
            },
          ],
        },
      ]);

      mockDockRepo.find.mockResolvedValue([
        { id: 1, status: DockStatus.AVAILABLE },
        { id: 2, status: DockStatus.OCCUPIED },
      ]);

      const metrics = await service.getMetrics();

      expect(metrics.activeCounts.stopped).toBe(1);
      expect(metrics.averages.avgStoppedMinutes).toBeGreaterThanOrEqual(24);
      expect(metrics.averages.avgUnloadingMinutes).toBe(40);
      expect(metrics.docks.total).toBe(2);
      expect(metrics.docks.available).toBe(1);
      expect(metrics.docks.occupied).toBe(1);
    });
  });
});
