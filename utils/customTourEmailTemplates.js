/**
 * Email Templates for Custom Tour Events
 * Reusable email templates for custom tour notifications
 */

import nodemailer from 'nodemailer';

// Email transporter configuration
export const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER || 'chilltours.official@gmail.com',
            pass: process.env.EMAIL_PASS || process.env.EMAIL_APP_PASSWORD
        }
    });
};

// Location name mapping
const locationNames = {
    gamcheon: 'Gamcheon Culture Village',
    gwangalli: 'Gwangalli Beach & Bridge',
    haeundae: 'Haeundae Beach',
    oryukdo: 'Oryukdo Island and Skywalk',
    haedong: 'Haedong Yonggungsa Temple',
    hwamyeong: 'Hwamyeong Eco Park',
    songdo: 'Songdo Beach + Cable Car',
    blueline: 'Blue Line Park (Capsule train)',
    jagalchi: 'Jagalchi Fish Market',
    dadaepo: 'Dadaepo Beach + Sunset'
};

// Addon name mapping
const addonNames = {
    drone: 'Drone Package',
    photographer: 'Professional Photographer',
    pickup: 'Hotel Pickup & Drop-off'
};

// Helper function to format tour data
function formatTourData(tourRequest) {
    const itinerary = tourRequest.itinerary || {};
    const locations = itinerary.locations || [];
    const addons = tourRequest.addons?.items || [];
    
    const locationList = locations.map(loc => locationNames[loc] || loc).join(', ');
    const addonsList = addons.map(addon => addonNames[addon] || addon).join(', ');
    const priceUSD = (tourRequest.totalPrice / 100).toFixed(2);
    
    const tourDate = tourRequest.startTime ? new Date(tourRequest.startTime).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }) : 'TBD';
    
    return {
        locationList,
        addonsList,
        priceUSD,
        tourDate
    };
}

/**
 * 1. Custom Tour Request Received (Admin Notification)
 */
export function getCustomTourRequestReceivedEmail(tourRequest, userEmail = null, userName = 'Guest') {
    const { locationList, addonsList, priceUSD, tourDate } = formatTourData(tourRequest);
    const tourId = tourRequest.id.substring(0, 8);
    
    const subject = `New Custom Tour Request - ${tourId}...`;
    
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #4A90E2, #65C7D0); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
                .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4A90E2; }
                .info-row { margin: 10px 0; }
                .label { font-weight: 600; color: #2c3e50; }
                .value { color: #666; }
                .button { display: inline-block; padding: 12px 24px; background: #4A90E2; color: white; text-decoration: none; border-radius: 8px; margin-top: 15px; }
                .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 0.9rem; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">🎯 New Custom Tour Request</h1>
                </div>
                <div class="content">
                    <p>A new custom tour request has been submitted and requires your review.</p>
                    
                    <div class="info-box">
                        <div class="info-row">
                            <span class="label">Tour ID:</span>
                            <span class="value">${tourRequest.id}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">User:</span>
                            <span class="value">${userName} ${userEmail ? `(${userEmail})` : '(Guest)'}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Date & Time:</span>
                            <span class="value">${tourDate}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Duration:</span>
                            <span class="value">${tourRequest.durationHours} hours</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Travelers:</span>
                            <span class="value">${tourRequest.travelers}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Locations:</span>
                            <span class="value">${locationList || 'Not specified'}</span>
                        </div>
                        ${addonsList ? `
                        <div class="info-row">
                            <span class="label">Add-ons:</span>
                            <span class="value">${addonsList}</span>
                        </div>
                        ` : ''}
                        <div class="info-row">
                            <span class="label">Total Price:</span>
                            <span class="value">$${priceUSD} USD</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Status:</span>
                            <span class="value">${tourRequest.status || 'pending'}</span>
                        </div>
                    </div>
                    
                    <a href="${process.env.BASE_URL || 'https://chillbusantours.com'}/admin?tab=custom-tours" class="button">Review in Admin Panel</a>
                    
                    <div class="footer">
                        <p>This is an automated notification from Chill Busan Tours.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;
    
    const text = `
New Custom Tour Request

Tour ID: ${tourRequest.id}
User: ${userName} ${userEmail ? `(${userEmail})` : '(Guest)'}
Date & Time: ${tourDate}
Duration: ${tourRequest.durationHours} hours
Travelers: ${tourRequest.travelers}
Locations: ${locationList || 'Not specified'}
${addonsList ? `Add-ons: ${addonsList}\n` : ''}Total Price: $${priceUSD} USD
Status: ${tourRequest.status || 'pending'}

Review in Admin Panel: ${process.env.BASE_URL || 'https://chillbusantours.com'}/admin?tab=custom-tours
    `;
    
    return { subject, html, text };
}

/**
 * 2. Custom Tour Approved (Customer Notification)
 */
export function getCustomTourApprovedEmail(tourRequest, userEmail, userName) {
    const { locationList, addonsList, priceUSD, tourDate } = formatTourData(tourRequest);
    const tourId = tourRequest.id.substring(0, 8);
    
    const subject = `🎉 Your Custom Tour Request Has Been Approved!`;
    
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center; }
                .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745; }
                .info-row { margin: 10px 0; }
                .label { font-weight: 600; color: #2c3e50; }
                .value { color: #666; }
                .button { display: inline-block; padding: 12px 24px; background: #4A90E2; color: white; text-decoration: none; border-radius: 8px; margin-top: 15px; }
                .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 0.9rem; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">🎉 Your Custom Tour Has Been Approved!</h1>
                </div>
                <div class="content">
                    <p>Dear ${userName || userEmail.split('@')[0]},</p>
                    <p>Great news! Your custom tour request has been approved by our team.</p>
                    
                    <div class="info-box">
                        <h3 style="margin-top: 0; color: #28a745;">Tour Details</h3>
                        <div class="info-row">
                            <span class="label">Tour ID:</span>
                            <span class="value">${tourId}...</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Date & Time:</span>
                            <span class="value">${tourDate}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Duration:</span>
                            <span class="value">${tourRequest.durationHours} hours</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Travelers:</span>
                            <span class="value">${tourRequest.travelers}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Locations:</span>
                            <span class="value">${locationList || 'TBD'}</span>
                        </div>
                        ${addonsList ? `
                        <div class="info-row">
                            <span class="label">Add-ons:</span>
                            <span class="value">${addonsList}</span>
                        </div>
                        ` : ''}
                        <div class="info-row">
                            <span class="label">Total Price:</span>
                            <span class="value">$${priceUSD} USD</span>
                        </div>
                    </div>
                    
                    <p><strong>Next Steps:</strong></p>
                    <p>You can now proceed to payment by visiting your dashboard:</p>
                    <a href="${process.env.BASE_URL || 'https://chillbusantours.com'}/dashboard?tab=custom" class="button">View in Dashboard</a>
                    
                    <p>If you have any questions, please don't hesitate to contact us at +82 010-3973-2052</p>
                    
                    <div class="footer">
                        <p>Best regards,<br><strong>Chill Busan Tours Team</strong></p>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;
    
    const text = `
Your Custom Tour Has Been Approved!

Dear ${userName || userEmail.split('@')[0]},

Great news! Your custom tour request has been approved by our team.

Tour Details:
- Tour ID: ${tourId}...
- Date & Time: ${tourDate}
- Duration: ${tourRequest.durationHours} hours
- Travelers: ${tourRequest.travelers}
- Locations: ${locationList || 'TBD'}
${addonsList ? `- Add-ons: ${addonsList}\n` : ''}- Total Price: $${priceUSD} USD

Next Steps:
You can now proceed to payment by visiting your dashboard:
${process.env.BASE_URL || 'https://chillbusantours.com'}/dashboard?tab=custom

If you have any questions, please contact us at +82 010-3973-2052

Best regards,
Chill Busan Tours Team
    `;
    
    return { subject, html, text };
}

/**
 * 3. Custom Tour Rejected (Customer Notification)
 */
export function getCustomTourRejectedEmail(tourRequest, userEmail, userName, reason = null) {
    const { locationList, priceUSD, tourDate } = formatTourData(tourRequest);
    const tourId = tourRequest.id.substring(0, 8);
    
    const subject = `Update on Your Custom Tour Request`;
    
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #dc3545, #c82333); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center; }
                .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545; }
                .reason-box { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }
                .button { display: inline-block; padding: 12px 24px; background: #4A90E2; color: white; text-decoration: none; border-radius: 8px; margin-top: 15px; }
                .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 0.9rem; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">Custom Tour Request Update</h1>
                </div>
                <div class="content">
                    <p>Dear ${userName || userEmail.split('@')[0]},</p>
                    <p>We regret to inform you that your custom tour request (ID: ${tourId}...) has been declined at this time.</p>
                    
                    ${reason ? `
                    <div class="reason-box">
                        <strong>Reason:</strong>
                        <p>${reason}</p>
                    </div>
                    ` : ''}
                    
                    <div class="info-box">
                        <p><strong>Tour ID:</strong> ${tourId}...</p>
                        <p><strong>Requested Date:</strong> ${tourDate}</p>
                        <p><strong>Locations:</strong> ${locationList || 'TBD'}</p>
                        <p><strong>Total Price:</strong> $${priceUSD} USD</p>
                    </div>
                    
                    <p>We appreciate your interest in Chill Busan Tours and encourage you to:</p>
                    <ul>
                        <li>Browse our pre-designed tour packages</li>
                        <li>Submit a new custom tour request with different dates or locations</li>
                        <li>Contact us directly if you have questions</li>
                    </ul>
                    
                    <a href="${process.env.BASE_URL || 'https://chillbusantours.com'}" class="button">View Our Tours</a>
                    
                    <p>If you have any questions, please don't hesitate to reach out to us at +82 010-3973-2052</p>
                    
                    <div class="footer">
                        <p>Best regards,<br><strong>Chill Busan Tours Team</strong></p>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;
    
    const text = `
Update on Your Custom Tour Request

Dear ${userName || userEmail.split('@')[0]},

We regret to inform you that your custom tour request (ID: ${tourId}...) has been declined at this time.

${reason ? `Reason: ${reason}\n\n` : ''}Tour Details:
- Tour ID: ${tourId}...
- Requested Date: ${tourDate}
- Locations: ${locationList || 'TBD'}
- Total Price: $${priceUSD} USD

We appreciate your interest in Chill Busan Tours and encourage you to:
- Browse our pre-designed tour packages
- Submit a new custom tour request with different dates or locations
- Contact us directly if you have questions

View Our Tours: ${process.env.BASE_URL || 'https://chillbusantours.com'}

If you have any questions, please contact us at +82 010-3973-2052

Best regards,
Chill Busan Tours Team
    `;
    
    return { subject, html, text };
}

/**
 * 4. Payment Received (Customer Confirmation)
 */
export function getCustomTourPaymentReceivedEmail(tourRequest, userEmail, userName, paymentIntentId) {
    const { locationList, addonsList, priceUSD, tourDate } = formatTourData(tourRequest);
    const tourId = tourRequest.id.substring(0, 8);
    
    const subject = `Payment Confirmed - Custom Tour ${tourId}...`;
    
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center; }
                .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745; }
                .info-row { margin: 10px 0; }
                .label { font-weight: 600; color: #2c3e50; }
                .value { color: #666; }
                .button { display: inline-block; padding: 12px 24px; background: #4A90E2; color: white; text-decoration: none; border-radius: 8px; margin-top: 15px; }
                .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 0.9rem; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">✅ Payment Confirmed!</h1>
                </div>
                <div class="content">
                    <p>Dear ${userName || userEmail.split('@')[0]},</p>
                    <p>Your payment for your custom tour has been successfully processed.</p>
                    
                    <div class="info-box">
                        <h3 style="margin-top: 0; color: #28a745;">Custom Tour Details</h3>
                        <div class="info-row">
                            <span class="label">Tour ID:</span>
                            <span class="value">${tourId}...</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Status:</span>
                            <span class="value" style="color: #28a745; font-weight: 600;">Paid</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Date & Time:</span>
                            <span class="value">${tourDate}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Duration:</span>
                            <span class="value">${tourRequest.durationHours} hours</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Travelers:</span>
                            <span class="value">${tourRequest.travelers}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Locations:</span>
                            <span class="value">${locationList || 'TBD'}</span>
                        </div>
                        ${addonsList ? `
                        <div class="info-row">
                            <span class="label">Add-ons:</span>
                            <span class="value">${addonsList}</span>
                        </div>
                        ` : ''}
                        <div class="info-row">
                            <span class="label">Total Amount:</span>
                            <span class="value" style="font-weight: 600; color: #28a745;">$${priceUSD} USD</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Payment ID:</span>
                            <span class="value" style="font-size: 0.9rem;">${paymentIntentId}</span>
                        </div>
                    </div>
                    
                    <p>Your custom tour is now confirmed. We look forward to providing you with an amazing experience!</p>
                    <p>You can view your tour details in your dashboard:</p>
                    <a href="${process.env.BASE_URL || 'https://chillbusantours.com'}/dashboard?tab=custom" class="button">View in Dashboard</a>
                    
                    <p>If you have any questions, please contact us at +82 010-3973-2052</p>
                    
                    <div class="footer">
                        <p>Best regards,<br><strong>Chill Busan Tours Team</strong></p>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;
    
    const text = `
Payment Confirmed!

Dear ${userName || userEmail.split('@')[0]},

Your payment for your custom tour has been successfully processed.

Custom Tour Details:
- Tour ID: ${tourId}...
- Status: Paid
- Date & Time: ${tourDate}
- Duration: ${tourRequest.durationHours} hours
- Travelers: ${tourRequest.travelers}
- Locations: ${locationList || 'TBD'}
${addonsList ? `- Add-ons: ${addonsList}\n` : ''}- Total Amount: $${priceUSD} USD
- Payment ID: ${paymentIntentId}

Your custom tour is now confirmed. We look forward to providing you with an amazing experience!

View in Dashboard: ${process.env.BASE_URL || 'https://chillbusantours.com'}/dashboard?tab=custom

If you have any questions, please contact us at +82 010-3973-2052

Best regards,
Chill Busan Tours Team
    `;
    
    return { subject, html, text };
}

/**
 * 5. Custom Tour Cancelled (Customer Notification)
 */
export function getCustomTourCancelledEmail(tourRequest, userEmail, userName, reason = null) {
    const { locationList, priceUSD, tourDate } = formatTourData(tourRequest);
    const tourId = tourRequest.id.substring(0, 8);
    
    const subject = `Custom Tour Cancelled - ${tourId}...`;
    
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #6c757d, #5a6268); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center; }
                .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6c757d; }
                .reason-box { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }
                .button { display: inline-block; padding: 12px 24px; background: #4A90E2; color: white; text-decoration: none; border-radius: 8px; margin-top: 15px; }
                .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 0.9rem; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">Custom Tour Cancelled</h1>
                </div>
                <div class="content">
                    <p>Dear ${userName || userEmail.split('@')[0]},</p>
                    <p>We wanted to inform you that your custom tour (ID: ${tourId}...) has been cancelled.</p>
                    
                    ${reason ? `
                    <div class="reason-box">
                        <strong>Reason:</strong>
                        <p>${reason}</p>
                    </div>
                    ` : ''}
                    
                    <div class="info-box">
                        <p><strong>Tour ID:</strong> ${tourId}...</p>
                        <p><strong>Date & Time:</strong> ${tourDate}</p>
                        <p><strong>Locations:</strong> ${locationList || 'TBD'}</p>
                        <p><strong>Total Price:</strong> $${priceUSD} USD</p>
                    </div>
                    
                    <p>If you have already made a payment, a refund will be processed within 5-10 business days.</p>
                    
                    <p>We're sorry for any inconvenience. If you'd like to book a different tour, please visit our website:</p>
                    <a href="${process.env.BASE_URL || 'https://chillbusantours.com'}" class="button">View Our Tours</a>
                    
                    <p>If you have any questions or concerns, please contact us at +82 010-3973-2052</p>
                    
                    <div class="footer">
                        <p>Best regards,<br><strong>Chill Busan Tours Team</strong></p>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;
    
    const text = `
Custom Tour Cancelled

Dear ${userName || userEmail.split('@')[0]},

We wanted to inform you that your custom tour (ID: ${tourId}...) has been cancelled.

${reason ? `Reason: ${reason}\n\n` : ''}Tour Details:
- Tour ID: ${tourId}...
- Date & Time: ${tourDate}
- Locations: ${locationList || 'TBD'}
- Total Price: $${priceUSD} USD

If you have already made a payment, a refund will be processed within 5-10 business days.

We're sorry for any inconvenience. If you'd like to book a different tour, please visit our website:
${process.env.BASE_URL || 'https://chillbusantours.com'}

If you have any questions or concerns, please contact us at +82 010-3973-2052

Best regards,
Chill Busan Tours Team
    `;
    
    return { subject, html, text };
}

/**
 * Send email using transporter
 */
export async function sendCustomTourEmail(to, template, tourRequest, userEmail = null, userName = null, additionalData = {}) {
    try {
        const transporter = createTransporter();
        let emailContent;
        
        switch (template) {
            case 'request_received':
                emailContent = getCustomTourRequestReceivedEmail(tourRequest, userEmail, userName);
                break;
            case 'approved':
                emailContent = getCustomTourApprovedEmail(tourRequest, userEmail, userName);
                break;
            case 'rejected':
                emailContent = getCustomTourRejectedEmail(tourRequest, userEmail, userName, additionalData.reason);
                break;
            case 'payment_received':
                emailContent = getCustomTourPaymentReceivedEmail(tourRequest, userEmail, userName, additionalData.paymentIntentId);
                break;
            case 'cancelled':
                emailContent = getCustomTourCancelledEmail(tourRequest, userEmail, userName, additionalData.reason);
                break;
            default:
                throw new Error(`Unknown email template: ${template}`);
        }
        
        await transporter.sendMail({
            from: `"Chill Busan Tours" <${process.env.EMAIL_USER || 'chilltours.official@gmail.com'}>`,
            to: to,
            subject: emailContent.subject,
            text: emailContent.text,
            html: emailContent.html
        });
        
        console.log(`Custom tour email sent: ${template} to ${to}`);
        return true;
    } catch (error) {
        console.error(`Error sending custom tour email (${template}):`, error);
        throw error;
    }
}

