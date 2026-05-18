type VerificationEmailTemplateParams = {
  nombre?: string | null;
  verifyUrl: string;
};

type PasswordResetEmailTemplateParams = {
  code: string;
  ttlMinutes: number;
  resetUrl: string;
};

type MailTemplate = {
  html: string;
  text: string;
};

const COLORS = {
  primary: '#798ea1',
  secondary: '#f5d98b',
  text: '#111111',
  textMuted: '#5f6770',
  background: '#f3f5f7',
  surface: '#ffffff',
  surfaceMuted: '#f8fafb',
  panelAccent: '#fbf8ea',
  panelSoft: '#eef2f5',
  borderSoft: '#ebeef1',
  borderSoftStrong: '#dbe3e9',
} as const;

export function buildVerificationEmailTemplate({
  nombre,
  verifyUrl,
}: VerificationEmailTemplateParams): MailTemplate {
  const safeName = escapeHtml(nombre?.trim() || 'usuario');
  const safeVerifyUrl = escapeHtml(verifyUrl);

  return {
    text: [
      `Hola ${nombre?.trim() || 'usuario'},`,
      '',
      'Gracias por registrarte en ASME.',
      '',
      'Para activar tu cuenta y empezar a usar el campus, verifica tu direccion de correo desde este enlace:',
      verifyUrl,
      '',
      'Si no creaste esta cuenta, podes ignorar este correo.',
    ].join('\n'),
    html: `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Verifica tu correo</title>
  </head>
  <body style="margin:0;padding:0;background-color:${COLORS.background};font-family:Arial,Helvetica,sans-serif;color:${COLORS.text};">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${COLORS.background};margin:0;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background-color:${COLORS.surface};border:1px solid ${COLORS.secondary};border-radius:28px;overflow:hidden;box-shadow:0 20px 48px rgba(121,142,161,0.14);">
            <tr>
              <td style="background:linear-gradient(135deg, ${COLORS.primary} 0%, #dfe7ec 100%);padding:28px 32px 18px 32px;">
                <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:34px;line-height:1.1;color:${COLORS.text};font-weight:600;">
                  Verifica tu correo
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 16px 0;font-size:16px;line-height:1.8;color:${COLORS.text};">
                  Hola ${safeName},
                </p>
                <p style="margin:0 0 16px 0;font-size:16px;line-height:1.8;color:${COLORS.textMuted};">
                  Gracias por registrarte en ASME. Para activar tu cuenta y empezar a usar el campus, necesitas verificar tu direccion de correo.
                </p>
                <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 28px 0;">
                  <tr>
                    <td align="center" bgcolor="${COLORS.secondary}" style="border-radius:18px;border:1px solid #3a3424;box-shadow:0 14px 28px rgba(245,217,139,0.28);">
                      <a href="${safeVerifyUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:16px 26px;font-size:15px;font-weight:700;color:${COLORS.text};text-decoration:none;border-radius:18px;">
                        Verificar mi correo
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 12px 0;font-size:14px;line-height:1.8;color:${COLORS.textMuted};">
                  Si el boton no funciona, copia y pega este enlace en tu navegador:
                </p>
                <p style="margin:0 0 28px 0;font-size:13px;line-height:1.8;word-break:break-all;color:${COLORS.primary};">
                  <a href="${safeVerifyUrl}" target="_blank" rel="noopener noreferrer" style="color:${COLORS.primary};text-decoration:underline;">
                    ${safeVerifyUrl}
                  </a>
                </p>
                <p style="margin:0;font-size:14px;line-height:1.8;color:${COLORS.textMuted};">
                  Si no creaste esta cuenta, podes ignorar este correo.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px;background-color:${COLORS.surfaceMuted};border-top:1px solid ${COLORS.borderSoft};">
                <p style="margin:0 0 6px 0;font-size:13px;font-weight:700;color:${COLORS.text};">ASME</p>
                <p style="margin:0;font-size:12px;line-height:1.7;color:#6b7280;">
                  Este es un mensaje automatico del campus. No respondas a este correo.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  };
}

export function buildPasswordResetEmailTemplate({
  code,
  ttlMinutes,
  resetUrl,
}: PasswordResetEmailTemplateParams): MailTemplate {
  const safeCode = escapeHtml(code);
  const safeResetUrl = escapeHtml(resetUrl);

  return {
    text: [
      'Hola,',
      '',
      'Recibimos una solicitud para restablecer tu contrasena de ASME.',
      '',
      'Tu codigo de verificacion es:',
      code,
      '',
      `Este codigo vence en ${ttlMinutes} minutos.`,
      '',
      `Para continuar, ingresa en: ${resetUrl}`,
      '',
      'Si no solicitaste este cambio, podes ignorar este correo.',
    ].join('\n'),
    html: `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Restablece tu contrasena</title>
  </head>
  <body style="margin:0;padding:0;background-color:${COLORS.background};font-family:Arial,Helvetica,sans-serif;color:${COLORS.text};">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${COLORS.background};margin:0;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background-color:${COLORS.surface};border:1px solid ${COLORS.secondary};border-radius:28px;overflow:hidden;box-shadow:0 20px 48px rgba(121,142,161,0.14);">
            <tr>
              <td style="background:linear-gradient(135deg, ${COLORS.text} 0%, ${COLORS.primary} 100%);padding:28px 32px 18px 32px;">
                <div style="display:inline-block;padding:8px 12px;border-radius:999px;background-color:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.24);font-size:11px;letter-spacing:1.8px;text-transform:uppercase;color:#ffffff;font-weight:700;">
                  Seguridad de cuenta
                </div>
                <h1 style="margin:18px 0 0 0;font-family:Georgia,'Times New Roman',serif;font-size:34px;line-height:1.1;color:#ffffff;font-weight:600;">
                  Restablece tu contrasena
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 16px 0;font-size:16px;line-height:1.8;color:${COLORS.text};">
                  Hola,
                </p>
                <p style="margin:0 0 16px 0;font-size:16px;line-height:1.8;color:${COLORS.textMuted};">
                  Recibimos una solicitud para restablecer tu contrasena de ASME.
                </p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:28px 0 16px 0;">
                  <tr>
                    <td align="center" style="background-color:${COLORS.panelAccent};border:1px solid ${COLORS.secondary};border-radius:24px;padding:26px 20px;">
                      <p style="margin:0 0 10px 0;font-size:12px;letter-spacing:1.6px;text-transform:uppercase;color:${COLORS.textMuted};font-weight:700;">
                        Codigo de verificacion
                      </p>
                      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:34px;line-height:1;font-weight:800;letter-spacing:8px;color:${COLORS.text};">
                        ${safeCode}
                      </p>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 24px 0;font-size:14px;line-height:1.8;color:${COLORS.textMuted};">
                  Este codigo vence en ${ttlMinutes} minutos.
                </p>
                <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 28px 0;">
                  <tr>
                    <td align="center" bgcolor="${COLORS.secondary}" style="border-radius:18px;border:1px solid #3a3424;box-shadow:0 14px 28px rgba(245,217,139,0.28);">
                      <a href="${safeResetUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:16px 26px;font-size:15px;font-weight:700;color:${COLORS.text};text-decoration:none;border-radius:18px;">
                        Ir a restablecer contrasena
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0;font-size:14px;line-height:1.8;color:${COLORS.textMuted};">
                  Si no solicitaste este cambio, podes ignorar este correo.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px;background-color:${COLORS.surfaceMuted};border-top:1px solid ${COLORS.borderSoft};">
                <p style="margin:0 0 6px 0;font-size:13px;font-weight:700;color:${COLORS.text};">ASME</p>
                <p style="margin:0;font-size:12px;line-height:1.7;color:#6b7280;">
                  Este es un mensaje automatico del campus. No respondas a este correo.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
