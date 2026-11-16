import { IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTruckDto {
  @ApiProperty({ example: 'ABC1D23' })
  @IsNotEmpty({ message: 'Placa do caminhão é obrigatória' })
  plate: string;

  @ApiProperty({ example: 'Marcos Oliveira' })
  @IsNotEmpty({ message: 'Nome do motorista é obrigatório' })
  driverName: string;

  @ApiPropertyOptional({ example: '(11) 98765-4321' })
  @IsOptional()
  driverPhone?: string;

  @ApiProperty({ example: 'TransLogística Brasil' })
  @IsNotEmpty({ message: 'Nome da transportadora é obrigatório' })
  carrierName: string;

  @ApiPropertyOptional({ example: 'Carreta Baú' })
  @IsOptional()
  truckType?: string;
}
