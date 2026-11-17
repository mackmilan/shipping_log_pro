import { IsNotEmpty, IsNumber, IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ScheduleStage } from '../../../common/enums/stage.enum';

export class AddStageImageDto {
  @ApiProperty({ description: 'URL ou Data URL da imagem' })
  @IsNotEmpty()
  @IsString()
  url: string;

  @ApiPropertyOptional({ example: 'Comprovante assinado / Canhoto' })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiPropertyOptional({ enum: ScheduleStage })
  @IsOptional()
  @IsEnum(ScheduleStage)
  stage?: ScheduleStage;

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
