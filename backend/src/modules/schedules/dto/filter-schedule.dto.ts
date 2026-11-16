import { IsOptional, IsEnum, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ScheduleStage, SchedulePriority } from '../../../common/enums/stage.enum';

export class FilterScheduleDto {
  @ApiPropertyOptional({ enum: ScheduleStage })
  @IsOptional()
  @IsEnum(ScheduleStage)
  stage?: ScheduleStage;

  @ApiPropertyOptional({ enum: SchedulePriority })
  @IsOptional()
  @IsEnum(SchedulePriority)
  priority?: SchedulePriority;

  @ApiPropertyOptional({ example: '2026-11-17' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({ example: 'ABC' })
  @IsOptional()
  @IsString()
  search?: string;
}
