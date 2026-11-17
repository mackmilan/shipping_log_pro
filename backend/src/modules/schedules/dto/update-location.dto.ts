import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLocationDto {
  @ApiProperty({ example: -23.55052, description: 'Latitude' })
  @IsNumber()
  @IsNotEmpty()
  latitude: number;

  @ApiProperty({ example: -46.633308, description: 'Longitude' })
  @IsNumber()
  @IsNotEmpty()
  longitude: number;

  @ApiPropertyOptional({ example: 'BR-116 km 220, Registro - SP', description: 'Nome/descrição amigável do local' })
  @IsOptional()
  @IsString()
  locationName?: string;
}
