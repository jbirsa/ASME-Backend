import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsInt, IsOptional, Min } from 'class-validator';
import { CreateClaseDto } from './create-clase.dto';
import { ToOptionalIntegerArray } from '../../common/validation/transforms';

export class UpdateClaseDto extends PartialType(CreateClaseDto) {
  @ApiPropertyOptional({
    example: [1, 2],
    description:
      'IDs de archivos de la clase a eliminar. En multipart se puede enviar como JSON string, por ejemplo [1,2]',
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
