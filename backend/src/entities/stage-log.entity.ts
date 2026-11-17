import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ScheduleStage } from '../common/enums/stage.enum';
import { UnloadingSchedule } from './unloading-schedule.entity';
import { User } from './user.entity';

@Entity('stage_logs')
export class StageLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  scheduleId: number;

  @ManyToOne(() => UnloadingSchedule, (schedule) => schedule.stageLogs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'scheduleId' })
  schedule: UnloadingSchedule;

  @Column({
    type: 'text',
  })
  stage: ScheduleStage;

  @Column({ type: 'datetime' })
  startedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  endedAt: Date;

  @Column({ type: 'integer', default: 0 })
  durationMinutes: number;

  @Column({ type: 'text', nullable: true })
  reason: string; // Ex: "Trânsito na BR-101", "Pneu furado", "Aguardando conferência", "Doca ocupada"

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'float', nullable: true })
  latitude: number;

  @Column({ type: 'float', nullable: true })
  longitude: number;

  @Column({ type: 'text', nullable: true })
  locationName: string;

  @Column({ type: 'simple-json', nullable: true })
  images: Array<{
    id?: string;
    url: string;
    caption?: string;
    stage?: ScheduleStage;
    capturedAt?: string;
    latitude?: number;
    longitude?: number;
    locationName?: string;
  }>;

  @Column({ nullable: true })
  recordedById: number;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'recordedById' })
  recordedBy: User;

  @CreateDateColumn()
  createdAt: Date;
}
