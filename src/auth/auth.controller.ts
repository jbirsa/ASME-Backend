import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { PasswordResetService } from './password-reset.service';
import { UsersService } from '../users/users.service';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationEmailDto } from './dto/resend-verification-email.dto';
import { EmailVerificationService } from './email-verification.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordResetService: PasswordResetService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly usersService: UsersService,
  ) {}

  @ApiOperation({ summary: 'Registro de usuario' })
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado. Debe verificar su email para loguearse.',
  })
  @ApiBody({
    type: RegisterDto,
    examples: {
      alumno: {
        summary: 'Registro basico',
        value: {
          email: 'alumno@asme.org',
          nombre: 'Juan Perez',
          password: '123456',
        },
      },
    },
  })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @ApiOperation({ summary: 'Verificar email de un usuario registrado' })
  @ApiResponse({ status: 200, description: 'Resultado de la verificacion' })
  @ApiBody({
    type: VerifyEmailDto,
    examples: {
      verificacion: {
        summary: 'Verificacion con token recibido por email',
        value: {
          token:
            '39bc44721505adbfd6a0558ea8d6eb4beb7d7dfd74555b7b99df72cd0b9f947f',
        },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  @Post('verify-email')
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    const ok = await this.emailVerificationService.consumeVerificationToken(
      dto.token,
    );
    if (!ok.ok) {
      return { ok: false, message: 'Token inválido o expirado' };
    }
    return { ok: true };
  }

  @ApiOperation({ summary: 'Reenviar email de verificacion' })
  @ApiResponse({ status: 200, description: 'Se envió el correo si aplica' })
  @ApiBody({
    type: ResendVerificationEmailDto,
    examples: {
      reenvio: {
        summary: 'Reenviar email de verificacion',
        value: {
          email: 'alumno@asme.org',
        },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  @Post('resend-verification-email')
  resendVerificationEmail(@Body() dto: ResendVerificationEmailDto) {
    return this.emailVerificationService.resendVerificationEmail(dto.email);
  }

  @ApiOperation({ summary: 'Login con credenciales' })
  @ApiResponse({ status: 200, description: 'JWT emitido' })
  @ApiResponse({
    status: 403,
    description: 'El usuario debe verificar su email antes de iniciar sesión',
  })
  @ApiBody({
    type: LoginDto,
    examples: {
      acceso: {
        summary: 'Login de alumno',
        value: {
          email: 'alumno@asme.org',
          password: '123456',
        },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiOperation({ summary: 'Solicitud de restablecimiento de contraseña' })
  @ApiResponse({
    status: 200,
    description: 'Se envió el correo si el usuario existe',
  })
  @ApiBody({
    type: ForgotPasswordDto,
    examples: {
      solicitud: {
        summary: 'Solicitar reset',
        value: {
          email: 'alumno@asme.org',
        },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const res = await this.passwordResetService.createResetCode(dto.email);
    return res;
  }

  @ApiOperation({ summary: 'Restablecer contraseña con codigo' })
  @ApiResponse({ status: 200 })
  @ApiBody({
    type: ResetPasswordDto,
    examples: {
      reset: {
        summary: 'Reset con codigo enviado por email',
        value: {
          email: 'alumno@asme.org',
          code: 'QJRMTA',
          newPassword: '654321',
        },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    const ok = await this.passwordResetService.consumeResetCode(
      dto.email,
      dto.code,
      dto.newPassword,
    );
    if (!ok.ok) {
      return { ok: false, message: 'Codigo inválido o expirado' };
    }
    return { ok: true };
  }

  @ApiOperation({ summary: 'Cambiar mi contraseña' })
  @ApiResponse({ status: 200, description: 'Contraseña actualizada' })
  @ApiBearerAuth()
  @ApiBody({
    type: ChangePasswordDto,
    examples: {
      cambio: {
        summary: 'Cambio de contraseña autenticado',
        value: {
          currentPassword: '123456',
          newPassword: '654321',
        },
      },
    },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'user')
  @HttpCode(HttpStatus.OK)
  @Post('change-password')
  changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changeOwnPassword(req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Reset de contraseña de un usuario (admin)' })
  @ApiResponse({ status: 200 })
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'newPassword'],
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'alumno@asme.org',
        },
        newPassword: {
          type: 'string',
          minLength: 6,
          example: '123456',
        },
      },
    },
    examples: {
      adminReset: {
        summary: 'Reset ejecutado por admin',
        value: {
          email: 'alumno@asme.org',
          newPassword: '123456',
        },
      },
    },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @Post('admin/reset-password')
  async adminResetPassword(
    @Body() body: { email: string; newPassword: string },
  ) {
    await this.usersService.changePassword(body.email, body.newPassword);
    return { updated: true };
  }
}
