import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import {
  HTTP_URL_REGEX,
  ToInteger,
  ToOptionalTrimmedString,
  ToTrimmedString,
} from '../../common/validation/transforms';

export class CreateClaseDto {
  @ApiProperty({
    example: 1,
    description: 'ID numerico del curso al que pertenece la clase',
  })
  @ToInteger()
  @IsInt()
  @Min(1)
  cursoId: number;

  @ApiProperty({
    example: 'Clase 1 - Interfaz y primeros pasos',
    description: 'Titulo visible de la clase',
  })
  @ToTrimmedString()
  @IsString()
  @IsNotEmpty()
  @MaxLength(140)
  titulo: string;

  @ApiPropertyOptional({
    example: 'Recorrido inicial por el entorno de trabajo.',
    description: 'Descripcion de la clase',
  })
  @ToOptionalTrimmedString()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  descripcion?: string;

  @ApiPropertyOptional({
    example: 'https://www.youtube.com/watch?v=abcd1234',
    description: 'URL del video de YouTube usado como material principal',
  })
  @ToOptionalTrimmedString()
  @IsOptional()
  @Matches(HTTP_URL_REGEX, {
    message: 'videoUrl debe ser una URL http o https valida',
  })
  @MaxLength(500)
  videoUrl?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Orden de aparicion de la clase dentro del curso',
  })
  @ToInteger()
  @IsOptional()
  @IsInt()
  @Min(1)
  orden?: number;
}
