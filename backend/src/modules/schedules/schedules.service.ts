import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { UnloadingSchedule } from '../../entities/unloading-schedule.entity';
import { StageLog } from '../../entities/stage-log.entity';
import { Dock } from '../../entities/dock.entity';
import { Truck } from '../../entities/truck.entity';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { FilterScheduleDto } from './dto/filter-schedule.dto';
import { ScheduleStage } from '../../common/enums/stage.enum';
import { DockStatus } from '../../common/enums/dock-status.enum';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(UnloadingSchedule)
    private readonly scheduleRepository: Repository<UnloadingSchedule>,
    @InjectRepository(StageLog)
    private readonly stageLogRepository: Repository<StageLog>,
    @InjectRepository(Dock)
    private readonly dockRepository: Repository<Dock>,
    @InjectRepository(Truck)
    private readonly truckRepository: Repository<Truck>,
  ) {}

  private formatScheduleWithMetrics(schedule: UnloadingSchedule) {
    const now = new Date();
    let totalInTransitMinutes = 0;
    let totalStoppedMinutes = 0;
    let totalYardMinutes = 0;
    let totalUnloadingMinutes = 0;

    const logs = (schedule.stageLogs || []).sort(
      (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
    );

    for (const log of logs) {
      let duration = log.durationMinutes || 0;
      if (!log.endedAt) {
        // Active stage currently in progress
        const diffMs = now.getTime() - new Date(log.startedAt).getTime();
        duration = Math.max(0, Math.floor(diffMs / 60000));
      }

      switch (log.stage) {
        case ScheduleStage.IN_TRANSIT:
          totalInTransitMinutes += duration;
          break;
        case ScheduleStage.STOPPED:
          totalStoppedMinutes += duration;
          break;
        case ScheduleStage.WAITING_YARD:
          totalYardMinutes += duration;
          break;
        case ScheduleStage.UNLOADING:
          totalUnloadingMinutes += duration;
          break;
      }
    }

    // Active stage duration
    const currentActiveLog = logs.find((l) => !l.endedAt);
    let activeStageDurationMinutes = 0;
    let activeStageDurationSeconds = 0;
    let activeStageStartedAt: Date | null = null;
    if (currentActiveLog) {
      const diffMs = now.getTime() - new Date(currentActiveLog.startedAt).getTime();
      activeStageDurationMinutes = Math.max(0, Math.floor(diffMs / 60000));
      activeStageDurationSeconds = Math.max(0, Math.floor(diffMs / 1000));
      activeStageStartedAt = currentActiveLog.startedAt;
    }

    // Window adherence check
    const plannedEnd = new Date(schedule.scheduledEndTime).getTime();
    const isOverdue =
      schedule.currentStage !== ScheduleStage.COMPLETED &&
      schedule.currentStage !== ScheduleStage.CANCELLED &&
      now.getTime() > plannedEnd;

    const delayMinutes = isOverdue
      ? Math.floor((now.getTime() - plannedEnd) / 60000)
      : 0;

    return {
      ...schedule,
      stageLogs: logs,
      metrics: {
        totalInTransitMinutes,
        totalStoppedMinutes,
        totalYardMinutes,
        totalUnloadingMinutes,
        activeStageDurationMinutes,
        activeStageDurationSeconds,
        activeStageStartedAt,
        isOverdue,
        delayMinutes,
      },
    };
  }

  async findAll(filter: FilterScheduleDto = {}) {
    const query = this.scheduleRepository
      .createQueryBuilder('schedule')
      .leftJoinAndSelect('schedule.truck', 'truck')
      .leftJoinAndSelect('schedule.dock', 'dock')
      .leftJoinAndSelect('schedule.driver', 'driver')
      .leftJoinAndSelect('schedule.stageLogs', 'stageLogs')
      .leftJoinAndSelect('stageLogs.recordedBy', 'recordedBy')
      .orderBy('schedule.scheduledStartTime', 'DESC');

    if (filter.stage) {
      query.andWhere('schedule.currentStage = :stage', { stage: filter.stage });
    }

    if (filter.priority) {
      query.andWhere('schedule.priority = :priority', { priority: filter.priority });
    }

    if (filter.driverId) {
      query.andWhere('schedule.driverId = :driverId', { driverId: filter.driverId });
    }

    if (filter.search) {
      const term = `%${filter.search.toLowerCase()}%`;
      query.andWhere(
        '(LOWER(truck.plate) LIKE :term OR LOWER(truck.driverName) LIKE :term OR LOWER(truck.carrierName) LIKE :term OR LOWER(schedule.code) LIKE :term OR LOWER(schedule.cargoDescription) LIKE :term)',
        { term },
      );
    }

    const items = await query.getMany();
    return items.map((item) => this.formatScheduleWithMetrics(item));
  }

  async findOne(id: number) {
    const schedule = await this.scheduleRepository.findOne({
      where: { id },
      relations: ['truck', 'dock', 'driver', 'stageLogs', 'stageLogs.recordedBy'],
    });

    if (!schedule) {
      throw new NotFoundException(`Agendamento #${id} não encontrado`);
    }

    return this.formatScheduleWithMetrics(schedule);
  }

  async create(dto: CreateScheduleDto, userId?: number) {
    const truck = await this.truckRepository.findOne({ where: { id: dto.truckId } });
    if (!truck) {
      throw new BadRequestException(`Caminhão #${dto.truckId} não existe`);
    }

    let dock: Dock | null = null;
    if (dto.dockId) {
      dock = await this.dockRepository.findOne({ where: { id: dto.dockId } });
      if (!dock) {
        throw new BadRequestException(`Doca #${dto.dockId} não existe`);
      }
    }

    const code =
      dto.code ||
      `AGD-${new Date().getFullYear().toString().slice(-2)}${Math.floor(
        1000 + Math.random() * 9000,
      )}`;

    const initialStage = dto.initialStage || ScheduleStage.SCHEDULED;
    const now = new Date();

    const schedule = this.scheduleRepository.create({
      code,
      truckId: dto.truckId,
      dockId: dto.dockId,
      driverId: dto.driverId,
      scheduledStartTime: new Date(dto.scheduledStartTime),
      scheduledEndTime: new Date(dto.scheduledEndTime),
      currentStage: initialStage,
      priority: dto.priority,
      cargoDescription: dto.cargoDescription,
      cargoWeightKg: dto.cargoWeightKg,
      invoiceNumber: dto.invoiceNumber,
      estimatedDurationMinutes: dto.estimatedDurationMinutes || 60,
      notes: dto.notes,
      actualArrivalAt:
        initialStage === ScheduleStage.WAITING_YARD ||
        initialStage === ScheduleStage.AT_DOCK
          ? now
          : null,
    });

    const savedSchedule = await this.scheduleRepository.save(schedule);

    // Create the initial stage log
    const initialLog = this.stageLogRepository.create({
      scheduleId: savedSchedule.id,
      stage: initialStage,
      startedAt: now,
      recordedById: userId,
      reason: initialStage === ScheduleStage.STOPPED ? 'Início de rota com parada informada' : undefined,
    });
    await this.stageLogRepository.save(initialLog);

    return this.findOne(savedSchedule.id);
  }

  async updateStage(id: number, dto: UpdateStageDto, userId?: number) {
    const schedule = await this.scheduleRepository.findOne({
      where: { id },
      relations: ['stageLogs', 'dock'],
    });

    if (!schedule) {
      throw new NotFoundException(`Agendamento #${id} não encontrado`);
    }

    const now = new Date();

    // 1. Close active stage log
    const activeLog = schedule.stageLogs.find((log) => !log.endedAt);
    if (activeLog) {
      activeLog.endedAt = now;
      const durationMs = now.getTime() - new Date(activeLog.startedAt).getTime();
      activeLog.durationMinutes = Math.max(1, Math.round(durationMs / 60000));
      await this.stageLogRepository.save(activeLog);
    }

    // 2. Process stage transition specifics
    schedule.currentStage = dto.stage;

    // Optional dock update or assignment
    if (dto.dockId) {
      const newDock = await this.dockRepository.findOne({ where: { id: dto.dockId } });
      if (newDock) {
        schedule.dockId = newDock.id;
        schedule.dock = newDock;
      }
    }

    if (
      (dto.stage === ScheduleStage.WAITING_YARD || dto.stage === ScheduleStage.AT_DOCK) &&
      !schedule.actualArrivalAt
    ) {
      schedule.actualArrivalAt = now;
    }

    if (dto.stage === ScheduleStage.UNLOADING && !schedule.actualStartAt) {
      schedule.actualStartAt = now;
      // Mark assigned dock as occupied
      if (schedule.dockId) {
        await this.dockRepository.update(schedule.dockId, { status: DockStatus.OCCUPIED });
      }
    }

    if (
      dto.stage === ScheduleStage.COMPLETED ||
      dto.stage === ScheduleStage.CANCELLED
    ) {
      schedule.actualEndAt = now;
      // Free the dock
      if (schedule.dockId) {
        await this.dockRepository.update(schedule.dockId, { status: DockStatus.AVAILABLE });
      }
    }

    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      schedule.lastLatitude = dto.latitude;
      schedule.lastLongitude = dto.longitude;
    }
    if (dto.locationName) {
      schedule.lastLocationName = dto.locationName;
    }

    await this.scheduleRepository.save(schedule);

    // 3. Create new stage log
    const newLog = this.stageLogRepository.create({
      scheduleId: schedule.id,
      stage: dto.stage,
      startedAt: now,
      endedAt:
        dto.stage === ScheduleStage.COMPLETED || dto.stage === ScheduleStage.CANCELLED
          ? now
          : null,
      durationMinutes: 0,
      reason: dto.reason,
      notes: dto.notes,
      latitude: dto.latitude,
      longitude: dto.longitude,
      locationName: dto.locationName,
      images: dto.images || [],
      recordedById: userId,
    });
    await this.stageLogRepository.save(newLog);

    return this.findOne(schedule.id);
  }

  async updateLocation(
    id: number,
    dto: { latitude: number; longitude: number; locationName?: string },
    userId?: number,
  ) {
    const schedule = await this.scheduleRepository.findOne({
      where: { id },
      relations: ['stageLogs'],
    });

    if (!schedule) {
      throw new NotFoundException(`Agendamento #${id} não encontrado`);
    }

    schedule.lastLatitude = dto.latitude;
    schedule.lastLongitude = dto.longitude;
    if (dto.locationName) {
      schedule.lastLocationName = dto.locationName;
    }
    await this.scheduleRepository.save(schedule);

    const activeLog = (schedule.stageLogs || []).find((log) => !log.endedAt);
    if (activeLog) {
      activeLog.latitude = dto.latitude;
      activeLog.longitude = dto.longitude;
      if (dto.locationName) {
        activeLog.locationName = dto.locationName;
      }
      await this.stageLogRepository.save(activeLog);
    }

    return this.findOne(schedule.id);
  }

  async addStageImage(
    id: number,
    dto: {
      url: string;
      caption?: string;
      stage?: ScheduleStage;
      latitude?: number;
      longitude?: number;
      locationName?: string;
    },
    userId?: number,
  ) {
    const schedule = await this.scheduleRepository.findOne({
      where: { id },
      relations: ['stageLogs'],
    });

    if (!schedule) {
      throw new NotFoundException(`Agendamento #${id} não encontrado`);
    }

    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      schedule.lastLatitude = dto.latitude;
      schedule.lastLongitude = dto.longitude;
    }
    if (dto.locationName) {
      schedule.lastLocationName = dto.locationName;
    }
    await this.scheduleRepository.save(schedule);

    const logs = (schedule.stageLogs || []).sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
    );
    let targetLog = dto.stage ? logs.find((l) => l.stage === dto.stage) : logs.find((l) => !l.endedAt);
    if (!targetLog && logs.length > 0) {
      targetLog = logs[0];
    }

    if (!targetLog) {
      targetLog = this.stageLogRepository.create({
        scheduleId: schedule.id,
        stage: schedule.currentStage,
        startedAt: new Date(),
        recordedById: userId,
      });
    }

    const currentImages = Array.isArray(targetLog.images) ? [...targetLog.images] : [];
    const imageItem = {
      id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      url: dto.url,
      caption: dto.caption || '',
      stage: targetLog.stage,
      capturedAt: new Date().toISOString(),
      latitude: dto.latitude || targetLog.latitude,
      longitude: dto.longitude || targetLog.longitude,
      locationName: dto.locationName || targetLog.locationName,
    };
    currentImages.push(imageItem);
    targetLog.images = currentImages;

    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      targetLog.latitude = dto.latitude;
      targetLog.longitude = dto.longitude;
    }
    if (dto.locationName) {
      targetLog.locationName = dto.locationName;
    }

    await this.stageLogRepository.save(targetLog);

    return this.findOne(schedule.id);
  }

  async getMetrics() {
    const allSchedules = await this.scheduleRepository.find({
      relations: ['stageLogs'],
    });

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    let inTransitCount = 0;
    let stoppedCount = 0;
    let waitingYardCount = 0;
    let unloadingCount = 0;
    let completedTodayCount = 0;
    let overdueCount = 0;

    let totalStoppedDuration = 0;
    let stoppedInstances = 0;

    let totalUnloadingDuration = 0;
    let unloadingInstances = 0;

    let totalInTransitDuration = 0;
    let transitInstances = 0;

    let totalYardDuration = 0;
    let yardInstances = 0;

    let onTimeCompleted = 0;
    let totalCompleted = 0;

    for (const item of allSchedules) {
      // Stage counts
      switch (item.currentStage) {
        case ScheduleStage.IN_TRANSIT:
          inTransitCount++;
          break;
        case ScheduleStage.STOPPED:
          stoppedCount++;
          break;
        case ScheduleStage.WAITING_YARD:
          waitingYardCount++;
          break;
        case ScheduleStage.UNLOADING:
          unloadingCount++;
          break;
        case ScheduleStage.COMPLETED:
          const itemEndStr = item.actualEndAt
            ? new Date(item.actualEndAt).toISOString().slice(0, 10)
            : '';
          if (itemEndStr === todayStr) {
            completedTodayCount++;
          }
          break;
      }

      // Overdue check
      const plannedEnd = new Date(item.scheduledEndTime).getTime();
      if (
        item.currentStage !== ScheduleStage.COMPLETED &&
        item.currentStage !== ScheduleStage.CANCELLED &&
        now.getTime() > plannedEnd
      ) {
        overdueCount++;
      }

      // Adherence check for completed
      if (item.currentStage === ScheduleStage.COMPLETED && item.actualEndAt) {
        totalCompleted++;
        if (new Date(item.actualEndAt).getTime() <= plannedEnd) {
          onTimeCompleted++;
        }
      }

      // Process logs for durations
      for (const log of item.stageLogs || []) {
        let dur = log.durationMinutes || 0;
        if (!log.endedAt) {
          const diffMs = now.getTime() - new Date(log.startedAt).getTime();
          dur = Math.max(0, Math.floor(diffMs / 60000));
        }

        switch (log.stage) {
          case ScheduleStage.STOPPED:
            totalStoppedDuration += dur;
            stoppedInstances++;
            break;
          case ScheduleStage.UNLOADING:
            totalUnloadingDuration += dur;
            unloadingInstances++;
            break;
          case ScheduleStage.IN_TRANSIT:
            totalInTransitDuration += dur;
            transitInstances++;
            break;
          case ScheduleStage.WAITING_YARD:
            totalYardDuration += dur;
            yardInstances++;
            break;
        }
      }
    }

    const docks = await this.dockRepository.find();
    const docksSummary = {
      total: docks.length,
      available: docks.filter((d) => d.status === DockStatus.AVAILABLE).length,
      occupied: docks.filter((d) => d.status === DockStatus.OCCUPIED).length,
      maintenance: docks.filter((d) => d.status === DockStatus.MAINTENANCE).length,
    };

    const avgStoppedMinutes = stoppedInstances > 0 ? Math.round(totalStoppedDuration / stoppedInstances) : 0;
    const avgUnloadingMinutes = unloadingInstances > 0 ? Math.round(totalUnloadingDuration / unloadingInstances) : 0;
    const avgTransitMinutes = transitInstances > 0 ? Math.round(totalInTransitDuration / transitInstances) : 0;
    const avgYardWaitMinutes = yardInstances > 0 ? Math.round(totalYardDuration / yardInstances) : 0;
    const windowAdherenceRate = totalCompleted > 0 ? Math.round((onTimeCompleted / totalCompleted) * 100) : 100;

    return {
      activeCounts: {
        inTransit: inTransitCount,
        stopped: stoppedCount,
        waitingYard: waitingYardCount,
        unloading: unloadingCount,
        completedToday: completedTodayCount,
        overdue: overdueCount,
        totalActive: inTransitCount + stoppedCount + waitingYardCount + unloadingCount,
      },
      averages: {
        avgStoppedMinutes,
        avgUnloadingMinutes,
        avgTransitMinutes,
        avgYardWaitMinutes,
        windowAdherenceRate,
      },
      docks: docksSummary,
    };
  }

  async remove(id: number) {
    const schedule = await this.scheduleRepository.findOne({ where: { id } });
    if (!schedule) {
      throw new NotFoundException(`Agendamento #${id} não encontrado`);
    }
    await this.scheduleRepository.remove(schedule);
    return { success: true, message: `Agendamento #${id} excluído com sucesso` };
  }
}
