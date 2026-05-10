import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  ToNormalizedEmail,
  ToTrimmedString,
} from '../../common/validation/transforms';

export class RegisterDto {
  @ApiProperty({
    example: 'alumno@asme.org',
    description: 'Email unico del alumno o usuario comun',
  })
  @ToNormalizedEmail()
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({
    example: 'Juan Perez',
    description: 'Nombre visible del usuario',
  })
  @ToTrimmedString()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nombre: string;

  @ApiProperty({
    minLength: 6,
    example: '123456',
    description: 'Password inicial del usuario',
  })
  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password: string;
}
