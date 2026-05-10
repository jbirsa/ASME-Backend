import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  ToNormalizedEmail,
  ToUpperTrimmedString,
} from '../../common/validation/transforms';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'alumno@asme.org',
    description: 'Email del usuario que recibio el codigo de reseteo',
  })
  @ToNormalizedEmail()
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({
    example: 'QJRMTA',
    description: 'Codigo de 6 letras enviado por email',
  })
  @ToUpperTrimmedString()
  @IsString()
  @Length(6, 6)
  @Matches(/^[A-Z]{6}$/, {
    message: 'code debe tener exactamente 6 letras mayusculas',
  })
  code: string;

  @ApiProperty({
    minLength: 6,
    example: '654321',
    description: 'Nueva password a establecer',
  })
  @IsString()
  @MinLength(6)
  @MaxLength(128)
  newPassword: string;
}
