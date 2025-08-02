/**
 * Servicio de Email
 * Funciones:
 * - sendVerificationEmail: Email de confirmación de cuenta
 * - sendPasswordResetEmail: Email de recuperación de contraseña
 * - sendWelcomeEmail: Email de bienvenida post-registro
 * - sendSecurityAlert: Notificaciones de seguridad
 * - sendAccountLockNotification: Notificación de bloqueo
 */

const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Inicializar configuración de email
   */
  async initializeTransporter() {
    try {
      // Configuración para diferentes proveedores
      const emailConfig = this.getEmailConfig();
      
      this.transporter = nodemailer.createTransport(emailConfig);
      
      // Verificar conexión
      await this.transporter.verify();
      logger.info('Servicio de email inicializado correctamente');
    } catch (error) {
      logger.error('Error inicializando servicio de email:', error);
      // En desarrollo, usar transporter de prueba
      if (process.env.NODE_ENV === 'development') {
        this.transporter = await this.createTestTransporter();
      }
    }
  }

  /**
   * Obtener configuración de email según variables de entorno
   */
  getEmailConfig() {
    const provider = process.env.EMAIL_PROVIDER || 'smtp';

    switch (provider) {
      case 'gmail':
        return {
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        };
      
      case 'outlook':
        return {
          service: 'hotmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        };
      
      case 'sendgrid':
        return {
          host: 'smtp.sendgrid.net',
          port: 587,
          secure: false,
          auth: {
            user: 'apikey',
            pass: process.env.SENDGRID_API_KEY
          }
        };
      
      default: // SMTP genérico
        return {
          host: process.env.EMAIL_HOST,
          port: process.env.EMAIL_PORT || 587,
          secure: process.env.EMAIL_SECURE === 'true',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        };
    }
  }

  /**
   * Crear transporter de prueba para desarrollo
   */
  async createTestTransporter() {
    try {
      const testAccount = await nodemailer.createTestAccount();
      
      return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    } catch (error) {
      logger.error('Error creando transporter de prueba:', error);
      return null;
    }
  }

  /**
   * Enviar email de verificación de cuenta
   */
  async sendVerificationEmail(email, verificationToken) {
    try {
      if (!this.transporter) {
        throw new Error('Servicio de email no disponible');
      }

      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
      
      const mailOptions = {
        from: `"${process.env.APP_NAME || 'Gestión Comercial'}" <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: 'Verifica tu cuenta - Gestión Comercial',
        html: this.getVerificationEmailTemplate(verificationUrl)
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info('Email de verificación enviado', { 
        email, 
        messageId: result.messageId 
      });

      // Log URL de prueba si es Ethereal
      if (process.env.NODE_ENV === 'development') {
        logger.info('URL de vista previa:', nodemailer.getTestMessageUrl(result));
      }

      return result;
    } catch (error) {
      logger.error('Error enviando email de verificación:', error);
      throw error;
    }
  }

  /**
   * Enviar email de recuperación de contraseña
   */
  async sendPasswordResetEmail(email, resetToken) {
    try {
      if (!this.transporter) {
        throw new Error('Servicio de email no disponible');
      }

      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: `"${process.env.APP_NAME || 'Gestión Comercial'}" <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: 'Recuperación de contraseña - Gestión Comercial',
        html: this.getPasswordResetEmailTemplate(resetUrl)
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info('Email de recuperación enviado', { 
        email, 
        messageId: result.messageId 
      });

      return result;
    } catch (error) {
      logger.error('Error enviando email de recuperación:', error);
      throw error;
    }
  }

  /**
   * Enviar email de bienvenida
   */
  async sendWelcomeEmail(email, nombre) {
    try {
      if (!this.transporter) {
        throw new Error('Servicio de email no disponible');
      }

      const mailOptions = {
        from: `"${process.env.APP_NAME || 'Gestión Comercial'}" <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: '¡Bienvenido a Gestión Comercial!',
        html: this.getWelcomeEmailTemplate(nombre)
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info('Email de bienvenida enviado', { 
        email, 
        messageId: result.messageId 
      });

      return result;
    } catch (error) {
      logger.error('Error enviando email de bienvenida:', error);
      throw error;
    }
  }

  /**
   * Enviar alerta de seguridad
   */
  async sendSecurityAlert(email, alertMessage) {
    try {
      if (!this.transporter) {
        throw new Error('Servicio de email no disponible');
      }

      const mailOptions = {
        from: `"${process.env.APP_NAME || 'Gestión Comercial'}" <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: 'Alerta de Seguridad - Gestión Comercial',
        html: this.getSecurityAlertTemplate(alertMessage)
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info('Alerta de seguridad enviada', { 
        email, 
        messageId: result.messageId 
      });

      return result;
    } catch (error) {
      logger.error('Error enviando alerta de seguridad:', error);
      throw error;
    }
  }

  /**
   * Enviar notificación de bloqueo de cuenta
   */
  async sendAccountLockNotification(email, reason) {
    try {
      if (!this.transporter) {
        throw new Error('Servicio de email no disponible');
      }

      const mailOptions = {
        from: `"${process.env.APP_NAME || 'Gestión Comercial'}" <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: 'Cuenta Bloqueada - Gestión Comercial',
        html: this.getAccountLockTemplate(reason)
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info('Notificación de bloqueo enviada', { 
        email, 
        messageId: result.messageId 
      });

      return result;
    } catch (error) {
      logger.error('Error enviando notificación de bloqueo:', error);
      throw error;
    }
  }

  /**
   * Template para email de verificación
   */
  getVerificationEmailTemplate(verificationUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verificar cuenta</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Verificar tu cuenta</h1>
          </div>
          <div class="content">
            <h2>¡Bienvenido a Gestión Comercial!</h2>
            <p>Gracias por registrarte. Para completar tu registro y activar tu cuenta, por favor verifica tu dirección de email haciendo clic en el botón de abajo:</p>
            <p style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verificar Email</a>
            </p>
            <p>Si no puedes hacer clic en el botón, copia y pega la siguiente URL en tu navegador:</p>
            <p style="word-break: break-all;">${verificationUrl}</p>
            <p><strong>Este enlace expirará en 24 horas.</strong></p>
            <p>Si no creaste esta cuenta, puedes ignorar este email.</p>
          </div>
          <div class="footer">
            <p>© 2025 Gestión Comercial. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Template para email de recuperación de contraseña
   */
  getPasswordResetEmailTemplate(resetUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Recuperar contraseña</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #dc3545; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Recuperar contraseña</h1>
          </div>
          <div class="content">
            <h2>Solicitud de recuperación de contraseña</h2>
            <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta. Si fuiste tú quien hizo esta solicitud, haz clic en el botón de abajo para crear una nueva contraseña:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
            </p>
            <p>Si no puedes hacer clic en el botón, copia y pega la siguiente URL en tu navegador:</p>
            <p style="word-break: break-all;">${resetUrl}</p>
            <p><strong>Este enlace expirará en 1 hora por seguridad.</strong></p>
            <p>Si no solicitaste restablecer tu contraseña, ignora este email. Tu contraseña actual seguirá siendo válida.</p>
          </div>
          <div class="footer">
            <p>© 2025 Gestión Comercial. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Template para email de bienvenida
   */
  getWelcomeEmailTemplate(nombre) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Bienvenido</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #28a745; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>¡Bienvenido a Gestión Comercial!</h1>
          </div>
          <div class="content">
            <h2>Hola ${nombre},</h2>
            <p>Tu cuenta ha sido verificada exitosamente. Ya puedes comenzar a usar nuestra plataforma de gestión comercial.</p>
            <p>Con Gestión Comercial podrás:</p>
            <ul>
              <li>Gestionar tu inventario de productos</li>
              <li>Registrar y seguir tus ventas</li>
              <li>Administrar proveedores</li>
              <li>Generar reportes de negocio</li>
              <li>Recibir recomendaciones personalizadas</li>
            </ul>
            <p style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Ir al Dashboard</a>
            </p>
            <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.</p>
          </div>
          <div class="footer">
            <p>© 2025 Gestión Comercial. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Template para alertas de seguridad
   */
  getSecurityAlertTemplate(alertMessage) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Alerta de Seguridad</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ffc107; color: #212529; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .alert { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Alerta de Seguridad</h1>
          </div>
          <div class="content">
            <div class="alert">
              <strong>Actividad en tu cuenta:</strong> ${alertMessage}
            </div>
            <p>Fecha y hora: ${new Date().toLocaleString('es-ES')}</p>
            <p>Si esta actividad no fue realizada por ti, te recomendamos:</p>
            <ul>
              <li>Cambiar tu contraseña inmediatamente</li>
              <li>Revisar la actividad reciente en tu cuenta</li>
              <li>Contactar a nuestro equipo de soporte</li>
            </ul>
            <p>Si fuiste tú quien realizó esta acción, puedes ignorar este mensaje.</p>
          </div>
          <div class="footer">
            <p>© 2025 Gestión Comercial. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Template para notificación de bloqueo de cuenta
   */
  getAccountLockTemplate(reason) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Cuenta Bloqueada</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .alert { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Cuenta Bloqueada</h1>
          </div>
          <div class="content">
            <div class="alert">
              <strong>Razón del bloqueo:</strong> ${reason}
            </div>
            <p>Fecha y hora: ${new Date().toLocaleString('es-ES')}</p>
            <p>Tu cuenta ha sido temporalmente bloqueada. Esto puede deberse a:</p>
            <ul>
              <li>Múltiples intentos de login fallidos</li>
              <li>Actividad sospechosa detectada</li>
              <li>Acción administrativa</li>
            </ul>
            <p>Para reactivar tu cuenta, por favor contacta a nuestro equipo de soporte.</p>
            <p><strong>Email de soporte:</strong> soporte@gestioncomercial.com</p>
          </div>
          <div class="footer">
            <p>© 2025 Gestión Comercial. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new EmailService();
