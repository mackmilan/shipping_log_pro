import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { DockStatus, DockType } from '../common/enums/dock-status.enum';
import { UnloadingSchedule } from './unloading-schedule.entity';

@Entity('docks')
export class Dock {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 20 })
  code: string;

  @Column({ length: 100 })
  name: string;

  @Column({
    type: 'text',
    default: DockType.DRY,
  })
  type: DockType;

  @Column({
    type: 'text',
    default: DockStatus.AVAILABLE,
  })
  status: DockStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany(() => UnloadingSchedule, (schedule) => schedule.dock)
  schedules: UnloadingSchedule[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
