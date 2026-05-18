import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsIn,
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
  ToOptionalIntegerArray,
  ToOptionalTrimmedString,
  ToTrimmedString,
} from '../../common/validation/transforms';

const EVENT_TYPE_OPTIONS = [
  'Charla',
  'Visita',
  'Competencia',
  'Evento especial',
] as const;

const EVENT_SEDE_OPTIONS = [
  'Sede Distrito Financiero (SDF)',
  'Sede Distrito Rectorado (SDR)',
  'Sede Distrito Tecnologico (SDT)',
] as const;

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

  @ApiProperty({
    example: 'Charla',
    description: 'Tipo de evento',
    enum: EVENT_TYPE_OPTIONS,
  })
  @ToTrimmedString()
  @IsString()
  @IsNotEmpty()
  @IsIn(EVENT_TYPE_OPTIONS, {
    message: 'tipo debe ser uno de los valores permitidos',
  })
  @MaxLength(40)
  tipo: string;

  @ApiProperty({
    description: 'Fecha ISO en formato YYYY-MM-DD',
    example: '2026-05-20',
  })
  @IsNotEmpty()
  @IsDateString()
  fecha: string;

  @ApiProperty({
    example: 'Av. Siempre Viva 123',
    description: 'Direccion del evento',
  })
  @ToTrimmedString()
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  direccion: string;

  @ApiPropertyOptional({
    example: 'Sede Distrito Financiero (SDF)',
    description: 'Sede del evento dentro de ASME',
    enum: EVENT_SEDE_OPTIONS,
  })
  @ToOptionalTrimmedString()
  @IsOptional()
  @IsString()
  @IsIn(EVENT_SEDE_OPTIONS, {
    message: 'sede debe ser una de las sedes permitidas',
  })
  sede?: string;

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

  @ApiProperty({
    example: 'Evento institucional abierto para la comunidad.',
    description: 'Descripcion general del evento',
  })
  @ToTrimmedString()
  @IsString()
  @IsNotEmpty()
  @MaxLength(3000)
  descripcion: string;

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
  @ToOptionalIntegerArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  patrocinadorIds?: number[];
}
