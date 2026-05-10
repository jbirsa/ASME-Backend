import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    example: '123456',
    description: 'Password actual del usuario',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  currentPassword: string;

  @ApiProperty({
    minLength: 6,
    example: '654321',
    description: 'Nueva password, distinta de la actual',
  })
  @IsString()
  @MinLength(6)
  @MaxLength(128)
  newPassword: string;
}
