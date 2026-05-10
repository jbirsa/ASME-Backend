import { PartialType } from '@nestjs/swagger';
import { CreatePatrocinadorDto } from './create-patrocinador.dto';

export class UpdatePatrocinadorDto extends PartialType(CreatePatrocinadorDto) {}
