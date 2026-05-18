import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateEventoDto } from './create-evento.dto';
import { ToOptionalBoolean } from '../../common/validation/transforms';

export class UpdateEventoDto extends PartialType(CreateEventoDto) {
  @ApiPropertyOptional({
    example: true,
    description:
      'Quita la foto actual del evento si no se desea reemplazarla por otra',
  })
  @ToOptionalBoolean()
  @IsOptional()
  @IsBoolean()
  eliminarFoto?: boolean;
}
