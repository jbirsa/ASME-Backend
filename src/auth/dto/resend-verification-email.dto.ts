import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MaxLength } from 'class-validator';
import { ToNormalizedEmail } from '../../common/validation/transforms';

export class ResendVerificationEmailDto {
  @ApiProperty({
    example: 'alumno@asme.org',
    description: 'Email del usuario que necesita reenviar la verificacion',
  })
  @ToNormalizedEmail()
  @IsEmail()
  @MaxLength(254)
  email: string;
}
