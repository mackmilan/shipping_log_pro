import { IsEnum, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ScheduleStage } from '../../../common/enums/stage.enum';

export class UpdateStageDto {
  @ApiProperty({
    enum: ScheduleStage,
    example: ScheduleStage.STOPPED,
    description: 'Novo status da etapa do caminhão',
  })
  @IsEnum(ScheduleStage, { message: 'Etapa inválida' })
  @IsNotEmpty({ message: 'Etapa é obrigatória' })
  stage: ScheduleStage;

  @ApiPropertyOptional({
    example: 'Engarrafamento severo na Rodovia Presidente Dutra km 184',
    description: 'Motivo da etapa (fundamental quando parado ou atrasado)',
  })
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({ example: 'Previsão de liberação em 40 minutos' })
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    example: 2,
    description: 'Vincular ou trocar a Doca ao avançar para AT_DOCK ou UNLOADING',
  })
  @IsOptional()
  @IsNumber()
  dockId?: number;
}
