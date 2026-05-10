import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MaxLength } from 'class-validator';
import { ToNormalizedEmail } from '../../common/validation/transforms';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'alumno@asme.org',
    description: 'Email del usuario que solicita el reseteo',
  })
  @ToNormalizedEmail()
  @IsEmail()
  @MaxLength(254)
  email: string;
}
