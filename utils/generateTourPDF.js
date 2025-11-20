/**
 * PDF Generator for Chill Busan Tours Booking Confirmations
 * Generates a professional PDF confirmation document
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate a booking confirmation PDF
 * @param {Object} bookingDetails - Booking information
 * @param {string} bookingDetails.customerName - Customer's full name
 * @param {string} bookingDetails.customerEmail - Customer's email
 * @param {string} bookingDetails.tourName - Name of the tour
 * @param {string} bookingDetails.tourDate - Tour date (YYYY-MM-DD)
 * @param {string} bookingDetails.startTime - Start time (HH:MM)
 * @param {Array<string>} bookingDetails.locations - List of locations/itinerary
 * @param {Array<string>} bookingDetails.optionalActivities - Optional add-ons
 * @param {number} bookingDetails.totalPrice - Total price in USD
 * @param {number} bookingDetails.numberOfGuests - Number of guests
 * @param {string} bookingDetails.meetingLocation - Meeting point
 * @param {string} bookingDetails.bookingId - Unique booking ID
 * @returns {Promise<{buffer: Buffer, filePath: string}>} PDF buffer and file path
 */
async function generateTourPDF(bookingDetails) {
    return new Promise((resolve, reject) => {
        try {
            // Create temp_pdfs directory if it doesn't exist
            const tempDir = path.join(__dirname, '..', 'temp_pdfs');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            // Create PDF document (A4 size: 595.28 x 841.89 points)
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
                const fileName = `ChillBusanTour-${bookingDetails.bookingId}.pdf`;
                const filePath = path.join(tempDir, fileName);
                
                // Save file
                fs.writeFileSync(filePath, buffer);
                
                resolve({ buffer, filePath, fileName });
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
               .text(bookingDetails.bookingId, 150, yPosition);
            
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
               .text(`Name: ${bookingDetails.customerName}`, 50, yPosition);
            
            yPosition += 20;
            
            doc.text(`Email: ${bookingDetails.customerEmail}`, 50, yPosition);
            
            yPosition += 30;
            
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
               .text(`Tour: ${bookingDetails.tourName}`, 50, yPosition);
            
            yPosition += 20;
            
            doc.text(`Date: ${formatDate(bookingDetails.tourDate)}`, 50, yPosition);
            
            yPosition += 20;
            
            doc.text(`Start Time: ${bookingDetails.startTime}`, 50, yPosition);
            
            yPosition += 20;
            
            doc.text(`Number of Guests: ${bookingDetails.numberOfGuests}`, 50, yPosition);
            
            yPosition += 30;
            
            // Locations/Itinerary
            if (bookingDetails.locations && bookingDetails.locations.length > 0) {
                doc.fontSize(12)
                   .font('Helvetica-Bold')
                   .fillColor('#2c3e50')
                   .text('Itinerary:', 50, yPosition);
                
                yPosition += 20;
                
                bookingDetails.locations.forEach((location, index) => {
                    doc.fontSize(10)
                       .font('Helvetica')
                       .fillColor('#34495e')
                       .text(`${index + 1}. ${location}`, 70, yPosition);
                    yPosition += 18;
                });
                
                yPosition += 10;
            }
            
            // Optional Activities
            if (bookingDetails.optionalActivities && bookingDetails.optionalActivities.length > 0) {
                doc.fontSize(12)
                   .font('Helvetica-Bold')
                   .fillColor('#2c3e50')
                   .text('Optional Add-ons:', 50, yPosition);
                
                yPosition += 20;
                
                bookingDetails.optionalActivities.forEach((activity) => {
                    doc.fontSize(10)
                       .font('Helvetica')
                       .fillColor('#34495e')
                       .text(`• ${activity}`, 70, yPosition);
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
               .text(`$${bookingDetails.totalPrice.toFixed(2)} USD`, 200, yPosition);
            
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
               .text(bookingDetails.meetingLocation || 'Haeundae Beach', 50, yPosition, {
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
            
            doc.fontSize(11)
               .font('Helvetica-Oblique')
               .fillColor('#7f8c8d')
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

module.exports = { generateTourPDF };

