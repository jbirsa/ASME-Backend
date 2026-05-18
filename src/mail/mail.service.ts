import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import {
  buildPasswordResetEmailTemplate,
  buildVerificationEmailTemplate,
} from './mail.templates';

type PasswordResetEmailParams = {
  to: string;
  code: string;
  ttlMinutes: number;
};

type EmailVerificationEmailParams = {
  to: string;
  nombre?: string | null;
  token: string;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {}

  async sendPasswordResetEmail({
    to,
    code,
    ttlMinutes,
  }: PasswordResetEmailParams) {
    const resetUrl = this.buildFrontendUrl('/restablecer-contrasena');
    const template = buildPasswordResetEmailTemplate({
      code,
      ttlMinutes,
      resetUrl,
    });

    await this.sendMail({
      to,
      subject: 'Restablece tu contrasena de ASME',
      text: template.text,
      html: template.html,
    });
  }

  async sendEmailVerificationEmail({
    to,
    nombre,
    token,
  }: EmailVerificationEmailParams) {
    const verifyUrl = this.buildFrontendUrl('/verificar-email', {
      token,
    });
    const template = buildVerificationEmailTemplate({
      nombre,
      verifyUrl,
    });

    await this.sendMail({
      to,
      subject: 'Verifica tu correo para activar tu cuenta ASME',
      text: template.text,
      html: template.html,
    });
  }

  private async sendMail(options: {
    to: string;
    subject: string;
    text: string;
    html: string;
  }) {
    const transporter = this.getTransporter();
    if (!transporter) {
      return;
    }

    try {
      await transporter.sendMail({
        from: this.getFormattedFrom(),
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
    } catch (error) {
      this.logger.error(`No se pudo enviar email a ${options.to}`, error);
      throw new InternalServerErrorException('No se pudo enviar el email');
    }
  }

  private getTransporter() {
    if (this.transporter) {
      return this.transporter;
    }

    const user = this.configService.get<string>('GMAIL_USER')?.trim();
    const pass = this.configService.get<string>('GMAIL_APP_PASSWORD')?.trim();

    if (!user || !pass) {
      if (process.env.NODE_ENV === 'test') {
        return null;
      }

      throw new InternalServerErrorException(
        'SMTP no configurado. Define GMAIL_USER y GMAIL_APP_PASSWORD.',
      );
    }

    this.transporter = createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass },
    });

    return this.transporter;
  }

  private getFormattedFrom() {
    const mailFromName =
      this.configService.get<string>('MAIL_FROM_NAME')?.trim() || 'ASME';
    const mailFrom =
      this.configService.get<string>('MAIL_FROM')?.trim() ||
      this.configService.get<string>('GMAIL_USER')?.trim() ||
      '';

    return mailFrom ? `${mailFromName} <${mailFrom}>` : mailFromName;
  }

  private buildFrontendUrl(
    pathname: string,
    query?: Record<string, string>,
  ) {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL')?.trim() ||
      'https://asme-test-cursos.vercel.app';
    const url = new URL(pathname, frontendUrl);

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        url.searchParams.set(key, value);
      }
    }

    return url.toString();
  }
}
