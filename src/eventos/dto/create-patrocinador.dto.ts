import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
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

export class CreatePatrocinadorDto {
  @ApiProperty({
    example: 'SolidWorks',
    description: 'Nombre visible del patrocinador',
  })
  @ToTrimmedString()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nombre: string;

  @ApiPropertyOptional({
    example: 'contacto@solidworks.com',
    description: 'Email de contacto del patrocinador',
  })
  @ToOptionalTrimmedString()
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @ApiPropertyOptional({
    example: 'https://www.solidworks.com/',
    description: 'Sitio web o landing del patrocinador',
  })
  @ToOptionalTrimmedString()
  @IsOptional()
  @Matches(HTTP_URL_REGEX, {
    message: 'link debe ser una URL http o https valida',
  })
  @MaxLength(500)
  link?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/patrocinadores/solidworks.png',
    description: 'Logo o imagen principal del patrocinador',
  })
  @ToOptionalTrimmedString()
  @IsOptional()
  @Matches(HTTP_URL_REGEX, {
    message: 'imagenUrl debe ser una URL http o https valida',
  })
  @MaxLength(500)
  imagenUrl?: string;
}
