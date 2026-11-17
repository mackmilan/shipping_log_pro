import { IsEnum, IsNotEmpty, IsOptional, IsNumber, IsString, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ScheduleStage } from '../../../common/enums/stage.enum';

export class StageImageDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ description: 'URL ou Data URL da imagem' })
  @IsString()
  url: string;

  @ApiPropertyOptional({ example: 'Comprovante assinado pelo conferente' })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiPropertyOptional({ enum: ScheduleStage })
  @IsOptional()
  @IsEnum(ScheduleStage)
  stage?: ScheduleStage;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  capturedAt?: string;

  @ApiPropertyOptional({ example: -23.55052 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: -46.633308 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ example: 'Portaria 1' })
  @IsOptional()
  @IsString()
  locationName?: string;
}

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

  @ApiPropertyOptional({ example: -23.55052, description: 'Latitude da localização atual' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: -46.633308, description: 'Longitude da localização atual' })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ example: 'BR-116 km 220, Registro - SP', description: 'Nome/descrição do local' })
  @IsOptional()
  @IsString()
  locationName?: string;

  @ApiPropertyOptional({ type: [StageImageDto], description: 'Imagens ou fotos registradas nesta etapa' })
  @IsOptional()
  @IsArray()
  images?: StageImageDto[];
}
