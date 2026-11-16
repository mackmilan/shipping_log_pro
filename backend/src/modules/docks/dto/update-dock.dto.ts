import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DockStatus, DockType } from '../../../common/enums/dock-status.enum';

export class UpdateDockDto {
  @ApiPropertyOptional({ example: 'DOCA-01' })
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ example: 'Doca Principal - Cargas Secas' })
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ enum: DockType })
  @IsOptional()
  @IsEnum(DockType)
  type?: DockType;

  @ApiPropertyOptional({ enum: DockStatus })
  @IsOptional()
  @IsEnum(DockStatus)
  status?: DockStatus;

  @ApiPropertyOptional({ example: 'Em manutenção até as 14h' })
  @IsOptional()
  notes?: string;
}
