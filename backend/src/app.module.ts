import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Dock } from './entities/dock.entity';
import { Truck } from './entities/truck.entity';
import { UnloadingSchedule } from './entities/unloading-schedule.entity';
import { StageLog } from './entities/stage-log.entity';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DocksModule } from './modules/docks/docks.module';
import { TrucksModule } from './modules/trucks/trucks.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { SeedModule } from './modules/seed/seed.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'database.sqlite',
      entities: [User, Dock, Truck, UnloadingSchedule, StageLog],
      synchronize: true, // Auto-create tables in development
      logging: false,
    }),
    AuthModule,
    UsersModule,
    DocksModule,
    TrucksModule,
    SchedulesModule,
    SeedModule,
  ],
})
export class AppModule {}
