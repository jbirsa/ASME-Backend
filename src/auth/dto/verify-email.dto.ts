import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    example:
      '39bc44721505adbfd6a0558ea8d6eb4beb7d7dfd74555b7b99df72cd0b9f947f',
    description: 'Token enviado por email para verificar la cuenta',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  token: string;
}
