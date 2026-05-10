import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ToNormalizedEmail } from '../../common/validation/transforms';

export class LoginDto {
  @ApiProperty({ example: 'alumno@asme.org', description: 'Email registrado' })
  @ToNormalizedEmail()
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({ example: '123456', description: 'Password del usuario' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password: string;
}
