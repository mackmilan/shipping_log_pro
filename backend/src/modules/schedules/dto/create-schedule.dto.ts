import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SchedulePriority, ScheduleStage } from '../../../common/enums/stage.enum';

export class CreateScheduleDto {
  @ApiPropertyOptional({ example: 'SCH-2026-001' })
  @IsOptional()
  code?: string;

  @ApiProperty({ example: 1, description: 'ID do caminhão' })
  @IsNumber()
  truckId: number;

  @ApiPropertyOptional({ example: 1, description: 'ID da doca designada' })
  @IsOptional()
  @IsNumber()
  dockId?: number;

  @ApiProperty({ example: '2026-11-17T08:00:00Z', description: 'Início da janela agendada' })
  @IsDateString()
  scheduledStartTime: string;

  @ApiProperty({ example: '2026-11-17T10:00:00Z', description: 'Fim da janela agendada' })
  @IsDateString()
  scheduledEndTime: string;

  @ApiPropertyOptional({ enum: ScheduleStage, default: ScheduleStage.SCHEDULED })
  @IsOptional()
  @IsEnum(ScheduleStage)
  initialStage?: ScheduleStage;

  @ApiPropertyOptional({ enum: SchedulePriority, default: SchedulePriority.NORMAL })
  @IsOptional()
  @IsEnum(SchedulePriority)
  priority?: SchedulePriority;

  @ApiProperty({ example: 'Carga de alimentos perecíveis - Lote 8892' })
  @IsNotEmpty({ message: 'Descrição da carga é obrigatória' })
  cargoDescription: string;

  @ApiPropertyOptional({ example: 14500.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cargoWeightKg?: number;

  @ApiPropertyOptional({ example: 'NF-e 0049210' })
  @IsOptional()
  invoiceNumber?: string;

  @ApiPropertyOptional({ example: 90, description: 'Duração estimada em minutos' })
  @IsOptional()
  @IsNumber()
  @Min(5)
  estimatedDurationMinutes?: number;

  @ApiPropertyOptional({ example: 'Necessário paleteira elétrica' })
  @IsOptional()
  notes?: string;
}
