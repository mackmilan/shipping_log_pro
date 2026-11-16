import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UnloadingSchedule } from './unloading-schedule.entity';

@Entity('trucks')
export class Truck {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 15 })
  plate: string;

  @Column({ length: 120 })
  driverName: string;

  @Column({ length: 30, nullable: true })
  driverPhone: string;

  @Column({ length: 120 })
  carrierName: string;

  @Column({ length: 50, default: 'Carreta' })
  truckType: string;

  @OneToMany(() => UnloadingSchedule, (schedule) => schedule.truck)
  schedules: UnloadingSchedule[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
