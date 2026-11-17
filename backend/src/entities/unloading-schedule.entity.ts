import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { SchedulePriority, ScheduleStage } from '../common/enums/stage.enum';
import { Truck } from './truck.entity';
import { Dock } from './dock.entity';
import { StageLog } from './stage-log.entity';
import { User } from './user.entity';

@Entity('unloading_schedules')
export class UnloadingSchedule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 30 })
  code: string;

  @Column()
  truckId: number;

  @ManyToOne(() => Truck, (truck) => truck.schedules, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'truckId' })
  truck: Truck;

  @Column({ nullable: true })
  dockId: number;

  @ManyToOne(() => Dock, (dock) => dock.schedules, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'dockId' })
  dock: Dock;

  @Column({ nullable: true })
  driverId: number;

  @ManyToOne(() => User, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'driverId' })
  driver: User;

  @Column({ type: 'datetime' })
  scheduledStartTime: Date;

  @Column({ type: 'datetime' })
  scheduledEndTime: Date;

  @Column({ type: 'datetime', nullable: true })
  actualArrivalAt: Date;

  @Column({ type: 'datetime', nullable: true })
  actualStartAt: Date;

  @Column({ type: 'datetime', nullable: true })
  actualEndAt: Date;

  @Column({
    type: 'text',
    default: ScheduleStage.SCHEDULED,
  })
  currentStage: ScheduleStage;

  @Column({
    type: 'text',
    default: SchedulePriority.NORMAL,
  })
  priority: SchedulePriority;

  @Column({ length: 255 })
  cargoDescription: string;

  @Column({ type: 'float', nullable: true })
  cargoWeightKg: number;

  @Column({ length: 50, nullable: true })
  invoiceNumber: string;

  @Column({ type: 'integer', default: 60 })
  estimatedDurationMinutes: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'float', nullable: true })
  lastLatitude: number;

  @Column({ type: 'float', nullable: true })
  lastLongitude: number;

  @Column({ type: 'text', nullable: true })
  lastLocationName: string;

  @OneToMany(() => StageLog, (log) => log.schedule, { cascade: true })
  stageLogs: StageLog[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
