import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import {
  HTTP_URL_REGEX,
  ToOptionalTrimmedString,
  ToTrimmedString,
} from '../../common/validation/transforms';

export class CreateCursoDto {
  @ApiProperty({
    example: 'Introduccion a CAD',
    description: 'Nombre publico del curso',
  })
  @ToTrimmedString()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nombre: string;

  @ApiPropertyOptional({
    example: 'Curso inicial de modelado 3D para estudiantes.',
    description: 'Descripcion breve del curso',
  })
  @ToOptionalTrimmedString()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  descripcion?: string;

  @ApiPropertyOptional({
    name: 'imagenUrl',
    example: 'https://example.com/cursos/intro-cad.jpg',
    description:
      'URL externa opcional de la portada si no se sube una foto al storage privado',
  })
  @ToOptionalTrimmedString()
  @IsOptional()
  @Matches(HTTP_URL_REGEX, {
    message: 'imagenUrl debe ser una URL http o https valida',
  })
  @MaxLength(500)
  imagenUrl?: string;

  @ApiPropertyOptional({
    example: 'activo',
    description: 'Estado visible del curso, por ejemplo activo o borrador',
  })
  @ToOptionalTrimmedString()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  estado?: string;
}
