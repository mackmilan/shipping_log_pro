import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { User } from '../../entities/user.entity';
import { Dock } from '../../entities/dock.entity';
import { Truck } from '../../entities/truck.entity';
import { UnloadingSchedule } from '../../entities/unloading-schedule.entity';
import { StageLog } from '../../entities/stage-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Dock,
      Truck,
      UnloadingSchedule,
      StageLog,
    ]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
