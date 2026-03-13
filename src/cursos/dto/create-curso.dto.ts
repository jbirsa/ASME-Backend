import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateCursoDto {
  @ApiProperty()
  @IsString()
  nombre: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({ name: 'imagenUrl' })
  @IsOptional()
  @IsString()
  imagenUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  estado?: string;
}

