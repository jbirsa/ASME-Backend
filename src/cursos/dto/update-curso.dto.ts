import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';
import { CreateCursoDto } from './create-curso.dto';
import {
  ToOptionalBoolean,
  ToOptionalIntegerArray,
} from '../../common/validation/transforms';

export class UpdateCursoDto extends PartialType(CreateCursoDto) {
  @ApiPropertyOptional({
    example: true,
    description:
      'Permite quitar la foto actual del curso si no se sube una nueva',
  })
  @ToOptionalBoolean()
  @IsOptional()
  @IsBoolean()
  eliminarFoto?: boolean;

  @ApiPropertyOptional({
    example: [1, 2],
    description:
      'IDs de archivos del curso a eliminar. En multipart se puede enviar como JSON string, por ejemplo [1,2]',
    type: [Number],
  })
  @ToOptionalIntegerArray()
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  archivoIdsAEliminar?: number[];
}
