import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    const mailOptions = {
      from: `"Repok Pickleball Club" <${this.configService.get<string>('SMTP_USER')}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
          <h2>Password Reset Request</h2>
          <p>You requested a password reset for your Repok Pickleball Club account.</p>
          <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
          <div style="margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
          </div>
          <p>If you didn't request this, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="font-size: 12px; color: #666;">Repok Pickleball Club - Premium Court Booking</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.warn(
        `Failed to send password reset email (SMTP might not be configured). Falling back to console trace.`,
      );
      this.logger.log(`[LOCAL DEV OVERRIDE] Password Reset URL: ${resetUrl}`);
    }
  }

  async sendBookingConfirmationEmail(params: {
    email: string;
    customerName: string;
    bookingReference: string;
    courtName: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    totalAmount: string;
    paymentMethod: string;
    bookingId: string;
  }) {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    const bookingUrl = `${frontendUrl}/bookings/${params.bookingId}`;

    const mailOptions = {
      from: `"Repok Pickleball Club" <${this.configService.get<string>('SMTP_USER')}>`,
      to: params.email,
      subject: `Repok Pickleball Booking Confirmed - ${params.bookingReference}`,
      text: `Hi ${params.customerName},\n\nYour booking ${params.bookingReference} for ${params.courtName} on ${params.bookingDate} (${params.startTime} - ${params.endTime}) is confirmed!\n\nTotal Paid: RM ${params.totalAmount} (${params.paymentMethod})\n\nView details: ${bookingUrl}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
          <h2 style="color: #22c55e;">Booking Confirmed</h2>
          <p>Hi <strong>${params.customerName}</strong>,</p>
          <p>Your payment was successful and your court booking is confirmed!</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Reference:</strong> ${params.bookingReference}</p>
            <p style="margin: 5px 0;"><strong>Court:</strong> ${params.courtName}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${params.bookingDate}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${params.startTime} - ${params.endTime}</p>
            <p style="margin: 5px 0;"><strong>Amount Paid:</strong> RM ${params.totalAmount} (${params.paymentMethod})</p>
          </div>

          <div style="margin: 30px 0;">
            <a href="${bookingUrl}" style="background-color: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Booking Details</a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="font-size: 12px; color: #666;">Repok Pickleball Club - Premium Court Booking</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Booking confirmation email sent to ${params.email} for ${params.bookingReference}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown SMTP error';
      this.logger.warn(
        `Failed to send booking confirmation email to ${params.email}: ${message}`,
      );
      throw error; // Rethrow to let caller handle it
    }
  }
}
