import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedulesService } from './schedules.service';
import { SchedulesController } from './schedules.controller';
import { UnloadingSchedule } from '../../entities/unloading-schedule.entity';
import { StageLog } from '../../entities/stage-log.entity';
import { Dock } from '../../entities/dock.entity';
import { Truck } from '../../entities/truck.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UnloadingSchedule, StageLog, Dock, Truck]),
  ],
  controllers: [SchedulesController],
  providers: [SchedulesService],
  exports: [SchedulesService],
})
export class SchedulesModule {}
