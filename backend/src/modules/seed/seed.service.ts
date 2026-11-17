import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../../entities/user.entity';
import { Dock } from '../../entities/dock.entity';
import { Truck } from '../../entities/truck.entity';
import { UnloadingSchedule } from '../../entities/unloading-schedule.entity';
import { StageLog } from '../../entities/stage-log.entity';
import { UserRole } from '../../common/enums/role.enum';
import { DockStatus, DockType } from '../../common/enums/dock-status.enum';
import { SchedulePriority, ScheduleStage } from '../../common/enums/stage.enum';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Dock)
    private readonly dockRepo: Repository<Dock>,
    @InjectRepository(Truck)
    private readonly truckRepo: Repository<Truck>,
    @InjectRepository(UnloadingSchedule)
    private readonly scheduleRepo: Repository<UnloadingSchedule>,
    @InjectRepository(StageLog)
    private readonly stageLogRepo: Repository<StageLog>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedUsers();
    await this.seedDocks();
    await this.seedTrucks();
    await this.seedSchedules();
  }

  private async seedUsers() {
    this.logger.log('🌱 Verificando usuários padrão locais...');

    const defaultUsers = [
      {
        name: 'Administrador do Sistema',
        email: 'admin@shippinglog.local',
        password: await bcrypt.hash('admin123', 10),
        role: UserRole.ADMIN,
        active: true,
      },
      {
        name: 'Operador de Pátio e Docas',
        email: 'operador@shippinglog.local',
        password: await bcrypt.hash('operador123', 10),
        role: UserRole.OPERATOR,
        active: true,
      },
      {
        name: 'Usuário Visualizador',
        email: 'usuario@shippinglog.local',
        password: await bcrypt.hash('user123', 10),
        role: UserRole.USER,
        active: true,
      },
      {
        name: 'Carlos Santos (Motorista)',
        email: 'motorista@shippinglog.local',
        password: await bcrypt.hash('motorista123', 10),
        role: UserRole.DRIVER,
        active: true,
      },
    ];

    for (const u of defaultUsers) {
      const existing = await this.userRepo.findOne({ where: { email: u.email } });
      if (!existing) {
        await this.userRepo.save(this.userRepo.create(u));
        this.logger.log(`✅ Usuário padrão criado: ${u.email}`);
      }
    }
  }

  private async seedDocks() {
    const dockCount = await this.dockRepo.count();
    if (dockCount > 0) return;

    this.logger.log('🌱 Criando docas de descarga...');

    const docks = [
      {
        code: 'DOCA-01',
        name: 'Doca 01 - Carga Geral Seca',
        type: DockType.DRY,
        status: DockStatus.AVAILABLE,
        notes: 'Capacidade até 40t, plataforma niveladora pneumática',
      },
      {
        code: 'DOCA-02',
        name: 'Doca 02 - Frigorificada / Perecíveis',
        type: DockType.REFRIGERATED,
        status: DockStatus.OCCUPIED,
        notes: 'Doca vedada e climatizada (-18°C a 4°C)',
      },
      {
        code: 'DOCA-03',
        name: 'Doca 03 - Paletizados Rápidos',
        type: DockType.DRY,
        status: DockStatus.AVAILABLE,
        notes: 'Doca lateral rápida para carretas e trucks',
      },
      {
        code: 'DOCA-04',
        name: 'Doca 04 - Granel & Especiais',
        type: DockType.BULK,
        status: DockStatus.MAINTENANCE,
        notes: 'Manutenção programada no elevador de paletes',
      },
    ];

    for (const d of docks) {
      await this.dockRepo.save(this.dockRepo.create(d));
    }
  }

  private async seedTrucks() {
    const truckCount = await this.truckRepo.count();
    if (truckCount > 0) return;

    this.logger.log('🌱 Cadastrando caminhões e transportadoras...');

    const trucks = [
      {
        plate: 'BRA2E19',
        driverName: 'Carlos Eduardo Santos',
        driverPhone: '(11) 98765-4321',
        carrierName: 'Rodonaves Express',
        truckType: 'Carreta LS Baú',
      },
      {
        plate: 'PRT8K44',
        driverName: 'Rogério Ramos',
        driverPhone: '(41) 99123-8877',
        carrierName: 'TransSatélite Logística',
        truckType: 'Truck 6x2 Sider',
      },
      {
        plate: 'FRO9921',
        driverName: 'Valmir Aparecido Souza',
        driverPhone: '(19) 97654-3210',
        carrierName: 'LogFrio Cadeia Fria',
        truckType: 'Carreta Frigorífica',
      },
      {
        plate: 'GXP4310',
        driverName: 'Fernando Dias Alencar',
        driverPhone: '(31) 98844-2211',
        carrierName: 'Atlas Transporte Rodoviário',
        truckType: 'Bitrem 9 Eixos',
      },
    ];

    for (const t of trucks) {
      await this.truckRepo.save(this.truckRepo.create(t));
    }
  }

  private async seedSchedules() {
    const scheduleCount = await this.scheduleRepo.count();
    if (scheduleCount > 0) return;

    this.logger.log('🌱 Criando agendamentos de janelas e histórico de etapas...');

    const admin = await this.userRepo.findOne({ where: { role: UserRole.ADMIN } });
    const operator = await this.userRepo.findOne({ where: { role: UserRole.OPERATOR } });
    const driver = await this.userRepo.findOne({ where: { role: UserRole.DRIVER } });
    const trucks = await this.truckRepo.find();
    const docks = await this.dockRepo.find();

    const now = new Date();

    // 1. Caminhão PARADO (Alerta de parada em rodovia)
    const sch1Start = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2h atrás
    const sch1End = new Date(now.getTime() + 1 * 60 * 60 * 1000);   // daqui 1h
    const sch1 = await this.scheduleRepo.save(
      this.scheduleRepo.create({
        code: 'AGD-26101',
        truckId: trucks[0].id,
        dockId: docks[0].id,
        driverId: driver?.id,
        scheduledStartTime: sch1Start,
        scheduledEndTime: sch1End,
        currentStage: ScheduleStage.STOPPED,
        priority: SchedulePriority.HIGH,
        cargoDescription: 'Peças industriais e componentes automotivos',
        cargoWeightKg: 18500,
        invoiceNumber: 'NF-e 882194',
        estimatedDurationMinutes: 60,
        notes: 'Atenção: motorista avisou sobre paralisação temporária',
        lastLatitude: -24.4967,
        lastLongitude: -47.8447,
        lastLocationName: 'BR-116 km 220, Registro - SP',
      }),
    );

    // Logs do Sch1: Ficou 75 min em trânsito e está parado há 45 min
    const sch1TransitStart = new Date(now.getTime() - 120 * 60 * 1000);
    const sch1StoppedStart = new Date(now.getTime() - 45 * 60 * 1000);
    await this.stageLogRepo.save([
      this.stageLogRepo.create({
        scheduleId: sch1.id,
        stage: ScheduleStage.IN_TRANSIT,
        startedAt: sch1TransitStart,
        endedAt: sch1StoppedStart,
        durationMinutes: 75,
        reason: 'Saída da fábrica origem',
        recordedById: driver?.id || operator?.id,
        latitude: -23.6821,
        longitude: -46.6204,
        locationName: 'Rodovia dos Imigrantes, KM 12',
      }),
      this.stageLogRepo.create({
        scheduleId: sch1.id,
        stage: ScheduleStage.STOPPED,
        startedAt: sch1StoppedStart,
        endedAt: null,
        durationMinutes: 0,
        reason: 'Congestionamento severo e retenção policial na BR-116 km 220',
        notes: 'Previsão de retomada de trânsito em 30 minutos',
        recordedById: driver?.id || operator?.id,
        latitude: -24.4967,
        longitude: -47.8447,
        locationName: 'BR-116 km 220, Registro - SP',
        images: [
          {
            id: 'img_seed_1',
            url: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=600&q=80',
            caption: 'Foto do caminhão parado no acostamento por lentidão na pista',
            stage: ScheduleStage.STOPPED,
            capturedAt: new Date(now.getTime() - 40 * 60 * 1000).toISOString(),
            latitude: -24.4967,
            longitude: -47.8447,
            locationName: 'BR-116 km 220, Registro - SP',
          },
        ],
      }),
    ]);

    // 2. Caminhão EM DESCARGA (Na Doca 02 - Frigorificada)
    const sch2Start = new Date(now.getTime() - 1 * 60 * 60 * 1000);
    const sch2End = new Date(now.getTime() + 45 * 60 * 1000);
    const sch2 = await this.scheduleRepo.save(
      this.scheduleRepo.create({
        code: 'AGD-26102',
        truckId: trucks[2].id,
        dockId: docks[1].id,
        scheduledStartTime: sch2Start,
        scheduledEndTime: sch2End,
        actualArrivalAt: new Date(now.getTime() - 50 * 60 * 1000),
        actualStartAt: new Date(now.getTime() - 35 * 60 * 1000),
        currentStage: ScheduleStage.UNLOADING,
        priority: SchedulePriority.URGENT,
        cargoDescription: 'Carnes nobres resfriadas e laticínios (-2°C)',
        cargoWeightKg: 22000,
        invoiceNumber: 'NF-e 743012',
        estimatedDurationMinutes: 75,
        notes: 'Termometria conferida na portaria. Temperatura OK.',
      }),
    );

    const t2Transit = new Date(now.getTime() - 150 * 60 * 1000);
    const t2Yard = new Date(now.getTime() - 50 * 60 * 1000);
    const t2Unloading = new Date(now.getTime() - 35 * 60 * 1000);
    await this.stageLogRepo.save([
      this.stageLogRepo.create({
        scheduleId: sch2.id,
        stage: ScheduleStage.IN_TRANSIT,
        startedAt: t2Transit,
        endedAt: t2Yard,
        durationMinutes: 100,
        reason: 'Transporte frigorífico sem ocorrências',
        recordedById: operator?.id,
      }),
      this.stageLogRepo.create({
        scheduleId: sch2.id,
        stage: ScheduleStage.WAITING_YARD,
        startedAt: t2Yard,
        endedAt: t2Unloading,
        durationMinutes: 15,
        reason: 'Conferência de lacre e termômetro no pátio',
        recordedById: operator?.id,
      }),
      this.stageLogRepo.create({
        scheduleId: sch2.id,
        stage: ScheduleStage.UNLOADING,
        startedAt: t2Unloading,
        endedAt: null,
        durationMinutes: 0,
        reason: 'Descarregamento com 2 operadores na doca 02',
        recordedById: operator?.id,
      }),
    ]);

    // 3. Caminhão NO PÁTIO / FILA (WAITING_YARD)
    const sch3Start = new Date(now.getTime() - 20 * 60 * 1000);
    const sch3End = new Date(now.getTime() + 100 * 60 * 1000);
    const sch3 = await this.scheduleRepo.save(
      this.scheduleRepo.create({
        code: 'AGD-26103',
        truckId: trucks[1].id,
        dockId: docks[0].id,
        scheduledStartTime: sch3Start,
        scheduledEndTime: sch3End,
        actualArrivalAt: new Date(now.getTime() - 15 * 60 * 1000),
        currentStage: ScheduleStage.WAITING_YARD,
        priority: SchedulePriority.NORMAL,
        cargoDescription: 'Embalagens e papelão ondulado',
        cargoWeightKg: 9500,
        invoiceNumber: 'NF-e 119842',
        estimatedDurationMinutes: 45,
      }),
    );

    const t3Transit = new Date(now.getTime() - 80 * 60 * 1000);
    const t3Yard = new Date(now.getTime() - 15 * 60 * 1000);
    await this.stageLogRepo.save([
      this.stageLogRepo.create({
        scheduleId: sch3.id,
        stage: ScheduleStage.IN_TRANSIT,
        startedAt: t3Transit,
        endedAt: t3Yard,
        durationMinutes: 65,
        recordedById: admin?.id,
      }),
      this.stageLogRepo.create({
        scheduleId: sch3.id,
        stage: ScheduleStage.WAITING_YARD,
        startedAt: t3Yard,
        endedAt: null,
        durationMinutes: 0,
        reason: 'Aguardando liberação da Doca 01',
        recordedById: operator?.id,
      }),
    ]);

    // 4. Caminhão CONCLUÍDO hoje (Demonstrar métricas de histórico completo)
    const sch4Start = new Date(now.getTime() - 4 * 60 * 60 * 1000);
    const sch4End = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const sch4 = await this.scheduleRepo.save(
      this.scheduleRepo.create({
        code: 'AGD-26104',
        truckId: trucks[3].id,
        dockId: docks[2].id,
        scheduledStartTime: sch4Start,
        scheduledEndTime: sch4End,
        actualArrivalAt: new Date(now.getTime() - 3.8 * 60 * 60 * 1000),
        actualStartAt: new Date(now.getTime() - 3.4 * 60 * 60 * 1000),
        actualEndAt: new Date(now.getTime() - 2.5 * 60 * 60 * 1000),
        currentStage: ScheduleStage.COMPLETED,
        priority: SchedulePriority.NORMAL,
        cargoDescription: 'Grãos selecionados e sacarias',
        cargoWeightKg: 28000,
        invoiceNumber: 'NF-e 993100',
        estimatedDurationMinutes: 60,
      }),
    );

    const t4Transit = new Date(now.getTime() - 5.5 * 60 * 60 * 1000);
    const t4Stopped = new Date(now.getTime() - 4.5 * 60 * 60 * 1000);
    const t4Yard = new Date(now.getTime() - 3.8 * 60 * 60 * 1000);
    const t4Unload = new Date(now.getTime() - 3.4 * 60 * 60 * 1000);
    const t4Done = new Date(now.getTime() - 2.5 * 60 * 60 * 1000);

    await this.stageLogRepo.save([
      this.stageLogRepo.create({
        scheduleId: sch4.id,
        stage: ScheduleStage.IN_TRANSIT,
        startedAt: t4Transit,
        endedAt: t4Stopped,
        durationMinutes: 60,
        recordedById: admin?.id,
      }),
      this.stageLogRepo.create({
        scheduleId: sch4.id,
        stage: ScheduleStage.STOPPED,
        startedAt: t4Stopped,
        endedAt: t4Yard,
        durationMinutes: 42,
        reason: 'Parada regulamentar de descanso do motorista e abastecimento',
        recordedById: operator?.id,
      }),
      this.stageLogRepo.create({
        scheduleId: sch4.id,
        stage: ScheduleStage.WAITING_YARD,
        startedAt: t4Yard,
        endedAt: t4Unload,
        durationMinutes: 24,
        reason: 'Pesagem e triagem documental',
        recordedById: operator?.id,
      }),
      this.stageLogRepo.create({
        scheduleId: sch4.id,
        stage: ScheduleStage.UNLOADING,
        startedAt: t4Unload,
        endedAt: t4Done,
        durationMinutes: 54,
        reason: 'Descarga mecanizada concluída com sucesso',
        recordedById: operator?.id,
      }),
      this.stageLogRepo.create({
        scheduleId: sch4.id,
        stage: ScheduleStage.COMPLETED,
        startedAt: t4Done,
        endedAt: t4Done,
        durationMinutes: 0,
        reason: 'Veículo liberado da portaria',
        recordedById: operator?.id,
      }),
    ]);

    this.logger.log('✅ Dados de demonstração inicializados com sucesso!');
  }
}
