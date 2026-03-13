import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { PasswordResetService } from './password-reset.service';
import { UsersService } from '../users/users.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordResetService: PasswordResetService,
    private readonly usersService: UsersService,
  ) {}

  @ApiOperation({ summary: 'Registro de usuario' })
  @ApiResponse({ status: 201, description: 'Usuario registrado' })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @ApiOperation({ summary: 'Login con credenciales' })
  @ApiResponse({ status: 200, description: 'JWT emitido' })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiOperation({ summary: 'Solicitud de restablecimiento de contraseña' })
  @ApiResponse({ status: 200, description: 'Se envió el correo si el usuario existe' })
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    // En dev devolvemos el token para poder probar; en prod solo { sent: true }
    const res = await this.passwordResetService.createResetToken(dto.email);
    return res;
  }

  @ApiOperation({ summary: 'Restablecer contraseña con token' })
  @ApiResponse({ status: 200 })
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    const ok = await this.passwordResetService.consumeResetToken(dto.token, dto.newPassword);
    if (!ok.ok) {
      return { ok: false, message: 'Token inválido o expirado' };
    }
    return { ok: true };
  }

  @ApiOperation({ summary: 'Reset de contraseña de un usuario (admin)' })
  @ApiResponse({ status: 200 })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('admin/reset-password')
  async adminResetPassword(@Body() body: { email: string; newPassword: string }) {
    await this.usersService.changePassword(body.email, body.newPassword);
    return { updated: true };
  }
}
