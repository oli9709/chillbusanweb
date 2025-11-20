/**
 * PDF Generator for Booking Confirmations
 * Generates a professional PDF confirmation document for bookings
 */

const PDFDocument = require('pdfkit');

/**
 * Generate a booking confirmation PDF
 * @param {Object} bookingData - Booking information
 * @param {string} bookingData.bookingId - Unique booking ID
 * @param {string} bookingData.customerName - Customer's full name
 * @param {string} bookingData.customerEmail - Customer's email
 * @param {string} bookingData.phone - Customer's phone
 * @param {string} bookingData.tourName - Name of the tour
 * @param {string} bookingData.tourDate - Tour date (YYYY-MM-DD)
 * @param {number} bookingData.numberOfGuests - Number of guests
 * @param {Array<string>} bookingData.addons - List of add-ons
 * @param {number} bookingData.totalPrice - Total price in USD
 * @param {string} bookingData.meetingLocation - Meeting point
 * @returns {Promise<{buffer: Buffer, fileName: string}>} PDF buffer and file name
 */
async function generateBookingPDF(bookingData) {
    return new Promise((resolve, reject) => {
        try {
            // Create PDF document (A4 size)
            const doc = new PDFDocument({
                size: 'A4',
                margins: {
                    top: 50,
                    bottom: 50,
                    left: 50,
                    right: 50
                }
            });

            // Collect PDF data
            const chunks = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => {
                const buffer = Buffer.concat(chunks);
                const fileName = `ChillBusanTour-${bookingData.bookingId}.pdf`;
                resolve({ buffer, fileName });
            });
            doc.on('error', reject);

            // ==================== PDF CONTENT ====================
            
            // Title
            doc.fontSize(24)
               .font('Helvetica-Bold')
               .fillColor('#2c3e50')
               .text('Chill Busan Tours', 50, 50, { align: 'center' });
            
            doc.fontSize(18)
               .font('Helvetica')
               .fillColor('#7f8c8d')
               .text('Booking Confirmation', 50, 80, { align: 'center' });
            
            // Horizontal line
            doc.moveTo(50, 110)
               .lineTo(545, 110)
               .strokeColor('#bdc3c7')
               .lineWidth(1)
               .stroke();
            
            let yPosition = 140;
            
            // Booking ID
            doc.fontSize(12)
               .font('Helvetica-Bold')
               .fillColor('#34495e')
               .text('Booking ID:', 50, yPosition);
            
            doc.font('Helvetica')
               .fillColor('#2c3e50')
               .text(bookingData.bookingId, 150, yPosition);
            
            yPosition += 30;
            
            // Customer Information
            doc.fontSize(14)
               .font('Helvetica-Bold')
               .fillColor('#2c3e50')
               .text('Customer Information', 50, yPosition);
            
            yPosition += 25;
            
            doc.fontSize(11)
               .font('Helvetica')
               .fillColor('#34495e')
               .text(`Name: ${bookingData.customerName}`, 50, yPosition);
            
            yPosition += 20;
            
            doc.text(`Email: ${bookingData.customerEmail}`, 50, yPosition);
            
            yPosition += 20;
            
            if (bookingData.phone) {
                doc.text(`Phone: ${bookingData.phone}`, 50, yPosition);
                yPosition += 20;
            }
            
            yPosition += 10;
            
            // Horizontal divider
            doc.moveTo(50, yPosition)
               .lineTo(545, yPosition)
               .strokeColor('#ecf0f1')
               .lineWidth(0.5)
               .stroke();
            
            yPosition += 20;
            
            // Tour Details
            doc.fontSize(14)
               .font('Helvetica-Bold')
               .fillColor('#2c3e50')
               .text('Tour Details', 50, yPosition);
            
            yPosition += 25;
            
            doc.fontSize(11)
               .font('Helvetica')
               .fillColor('#34495e')
               .text(`Tour: ${bookingData.tourName}`, 50, yPosition);
            
            yPosition += 20;
            
            doc.text(`Date: ${formatDate(bookingData.tourDate)}`, 50, yPosition);
            
            yPosition += 20;
            
            doc.text(`Number of Guests: ${bookingData.numberOfGuests}`, 50, yPosition);
            
            yPosition += 20;
            
            // Add-ons
            if (bookingData.addons && bookingData.addons.length > 0) {
                doc.fontSize(12)
                   .font('Helvetica-Bold')
                   .fillColor('#2c3e50')
                   .text('Add-ons:', 50, yPosition);
                
                yPosition += 20;
                
                bookingData.addons.forEach((addon) => {
                    doc.fontSize(10)
                       .font('Helvetica')
                       .fillColor('#34495e')
                       .text(`• ${addon}`, 70, yPosition);
                    yPosition += 18;
                });
                
                yPosition += 10;
            }
            
            // Horizontal divider
            doc.moveTo(50, yPosition)
               .lineTo(545, yPosition)
               .strokeColor('#ecf0f1')
               .lineWidth(0.5)
               .stroke();
            
            yPosition += 20;
            
            // Total Price
            doc.fontSize(12)
               .font('Helvetica-Bold')
               .fillColor('#2c3e50')
               .text('Total Price:', 50, yPosition);
            
            doc.fontSize(14)
               .font('Helvetica-Bold')
               .fillColor('#27ae60')
               .text(`$${bookingData.totalPrice.toFixed(2)} USD`, 200, yPosition);
            
            yPosition += 30;
            
            // Horizontal divider
            doc.moveTo(50, yPosition)
               .lineTo(545, yPosition)
               .strokeColor('#ecf0f1')
               .lineWidth(0.5)
               .stroke();
            
            yPosition += 20;
            
            // Meeting Point
            doc.fontSize(12)
               .font('Helvetica-Bold')
               .fillColor('#2c3e50')
               .text('Meeting Point:', 50, yPosition);
            
            yPosition += 20;
            
            doc.fontSize(11)
               .font('Helvetica')
               .fillColor('#34495e')
               .text(bookingData.meetingLocation || 'Haeundae Beach', 50, yPosition, {
                   width: 495,
                   align: 'left'
               });
            
            yPosition += 40;
            
            // Emergency Contact
            doc.fontSize(12)
               .font('Helvetica-Bold')
               .fillColor('#2c3e50')
               .text('Emergency Contact:', 50, yPosition);
            
            yPosition += 20;
            
            doc.fontSize(11)
               .font('Helvetica')
               .fillColor('#34495e')
               .text('+82 010-3973-2052', 50, yPosition);
            
            yPosition += 40;
            
            // Cancellation Policy
            doc.fontSize(12)
               .font('Helvetica-Bold')
               .fillColor('#2c3e50')
               .text('Cancellation Policy:', 50, yPosition);
            
            yPosition += 20;
            
            const policyText = [
                '• Free cancellation up to 24 hours before tour',
                '• 50% refund for cancellation less than 24 hours',
                '• No refund for no-show'
            ];
            
            policyText.forEach((line) => {
                doc.fontSize(10)
                   .font('Helvetica')
                   .fillColor('#34495e')
                   .text(line, 70, yPosition);
                yPosition += 18;
            });
            
            yPosition += 30;
            
            // Footer
            doc.moveTo(50, yPosition)
               .lineTo(545, yPosition)
               .strokeColor('#bdc3c7')
               .lineWidth(1)
               .stroke();
            
            yPosition += 20;
            
            doc.fontSize(10)
               .font('Helvetica-Oblique')
               .fillColor('#7f8c8d')
               .text('This tour summary displays all prices in USD for easier understanding.', 50, yPosition, {
                   align: 'center'
               });
            
            yPosition += 20;
            
            doc.fontSize(11)
               .font('Helvetica-Bold')
               .fillColor('#2c3e50')
               .text('Thank you for choosing Chill Busan Tours!', 50, yPosition, {
                   align: 'center'
               });
            
            // Finalize PDF
            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Format date from YYYY-MM-DD to readable format
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        return dateString;
    }
}

module.exports = { generateBookingPDF };

