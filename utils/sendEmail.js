/**
 * Unified Email Sending Helper
 * Centralized email functionality using nodemailer
 * Uses environment variables from utils/env.js
 */

import nodemailer from 'nodemailer';
import { env } from './env.js';

/**
 * Create email transporter
 * Uses centralized environment configuration
 */
function createTransporter() {
    return nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: parseInt(env.SMTP_PORT, 10),
        secure: false, // true for 465, false for other ports
        auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASSWORD
        }
    });
}

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string|string[]} options.to - Recipient email(s)
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 * @param {Array} options.attachments - Optional attachments array
 * @param {string} options.from - Optional sender (defaults to SMTP_USER)
 * @returns {Promise<Object>} Nodemailer result
 */
export async function sendEmail(options) {
    const {
        to,
        subject,
        text,
        html,
        attachments = [],
        from = `"Chill Busan Tours" <${env.SMTP_USER}>`
    } = options;

    // Validate required fields
    if (!to) {
        throw new Error('Email recipient (to) is required');
    }
    if (!subject) {
        throw new Error('Email subject is required');
    }
    if (!text && !html) {
        throw new Error('Email content (text or html) is required');
    }

    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: from,
            to: to,
            subject: subject,
            text: text || undefined,
            html: html || undefined,
            attachments: attachments.length > 0 ? attachments : undefined
        };

        const result = await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${Array.isArray(to) ? to.join(', ') : to}`);
        return result;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}

/**
 * Send email to customer and admin
 * Convenience function for booking confirmations
 * @param {Object} options - Email options
 * @param {string} options.customerEmail - Customer email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 * @param {Array} options.attachments - Optional attachments
 * @param {string} options.adminSubject - Optional admin subject (defaults to subject)
 * @returns {Promise<Object>} Results object with customer and admin results
 */
export async function sendBookingConfirmationEmail(options) {
    const {
        customerEmail,
        subject,
        text,
        html,
        attachments = [],
        adminSubject = null
    } = options;

    if (!customerEmail) {
        throw new Error('Customer email is required');
    }

    const results = {
        customer: null,
        admin: null,
        errors: []
    };

    // Send to customer
    try {
        results.customer = await sendEmail({
            to: customerEmail,
            subject: subject,
            text: text,
            html: html,
            attachments: attachments
        });
    } catch (error) {
        console.error('Error sending email to customer:', error);
        results.errors.push({ recipient: 'customer', error: error.message });
    }

    // Send to admin
    try {
        const adminEmail = env.SUPPORT_EMAIL || 'chilltours.official@gmail.com';
        const adminSubjectText = adminSubject || `Admin Notification: ${subject}`;
        
        results.admin = await sendEmail({
            to: adminEmail,
            subject: adminSubjectText,
            text: text,
            html: html,
            attachments: attachments
        });
    } catch (error) {
        console.error('Error sending email to admin:', error);
        results.errors.push({ recipient: 'admin', error: error.message });
    }

    return results;
}

/**
 * Export transporter creation for advanced use cases
 */
export { createTransporter };

