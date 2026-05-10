import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { ToTrimmedString } from '../../common/validation/transforms';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'token-dev-obtenido-en-forgot-password',
    description: 'Token emitido por el flujo de forgot-password',
  })
  @ToTrimmedString()
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  token: string;

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
