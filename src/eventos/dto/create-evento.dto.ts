import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import {
  EVENT_PAGE_REGEX,
  HTTP_URL_REGEX,
  ToInteger,
  ToOptionalTrimmedString,
  ToTrimmedString,
} from '../../common/validation/transforms';

export class CreateEventoDto {
  @ApiProperty({
    example: 'Feria de Proyectos ASME',
    description: 'Nombre publico del evento',
  })
  @ToTrimmedString()
  @IsString()
  @IsNotEmpty()
  @MaxLength(140)
  nombre: string;

  @ApiPropertyOptional({ example: 'presencial', description: 'Tipo de evento' })
  @ToOptionalTrimmedString()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  tipo?: string;

  @ApiPropertyOptional({
    description: 'Fecha ISO en formato YYYY-MM-DD',
    example: '2026-05-20',
  })
  @IsOptional()
  @IsDateString()
  fecha?: string;

  @ApiPropertyOptional({
    example: 'Av. Siempre Viva 123',
    description: 'Direccion del evento',
  })
  @ToOptionalTrimmedString()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  direccion?: string;

  @ApiPropertyOptional({
    example: 'Centro',
    description: 'Barrio donde se realiza el evento',
  })
  @ToOptionalTrimmedString()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  barrio?: string;

  @ApiPropertyOptional({
    example: 'Cordoba',
    description: 'Provincia del evento',
  })
  @ToOptionalTrimmedString()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  provincia?: string;

  @ApiPropertyOptional({
    example: 'Evento institucional abierto para la comunidad.',
    description: 'Descripcion general del evento',
  })
  @ToOptionalTrimmedString()
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  descripcion?: string;

  @ApiPropertyOptional({
    example: 'https://meet.example.com/asme-feria',
    description: 'Link util del evento, por ejemplo registro o streaming',
  })
  @ToOptionalTrimmedString()
  @IsOptional()
  @Matches(HTTP_URL_REGEX, {
    message: 'link debe ser una URL http o https valida',
  })
  @MaxLength(500)
  link?: string;

  @ApiPropertyOptional({
    name: 'imagenUrl',
    example: 'https://example.com/eventos/feria.jpg',
    description: 'Imagen principal del evento',
  })
  @ToOptionalTrimmedString()
  @IsOptional()
  @Matches(HTTP_URL_REGEX, {
    message: 'imagenUrl debe ser una URL http o https valida',
  })
  @MaxLength(500)
  imagenUrl?: string;

  @ApiPropertyOptional({
    name: 'paginaEvento',
    example: 'https://asme.org/eventos/feria-2026',
    description: 'Pagina publica del evento',
  })
  @ToOptionalTrimmedString()
  @IsOptional()
  @Matches(EVENT_PAGE_REGEX, {
    message: 'paginaEvento debe ser una URL segura o un path relativo valido',
  })
  @MaxLength(500)
  paginaEvento?: string;

  @ApiPropertyOptional({
    type: [Number],
    example: [1, 2],
    description: 'IDs numericos de patrocinadores ya existentes',
  })
  @IsOptional()
  @IsArray()
  @ToInteger()
  @IsInt({ each: true })
  @Min(1, { each: true })
  patrocinadorIds?: number[];
}
