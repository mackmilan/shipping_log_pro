import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DockStatus, DockType } from '../../../common/enums/dock-status.enum';

export class CreateDockDto {
  @ApiProperty({ example: 'DOCA-01' })
  @IsNotEmpty({ message: 'Código da doca é obrigatório' })
  code: string;

  @ApiProperty({ example: 'Doca Principal - Cargas Secas' })
  @IsNotEmpty({ message: 'Nome da doca é obrigatório' })
  name: string;

  @ApiPropertyOptional({ enum: DockType, default: DockType.DRY })
  @IsOptional()
  @IsEnum(DockType)
  type?: DockType;

  @ApiPropertyOptional({ enum: DockStatus, default: DockStatus.AVAILABLE })
  @IsOptional()
  @IsEnum(DockStatus)
  status?: DockStatus;

  @ApiPropertyOptional({ example: 'Equipada com niveladora hidráulica' })
  @IsOptional()
  notes?: string;
}
