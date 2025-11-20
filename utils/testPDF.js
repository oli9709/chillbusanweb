/**
 * Test script for PDF generation
 * Run with: node utils/testPDF.js
 */

const { generateTourPDF } = require('./generateTourPDF');

async function testPDFGeneration() {
    console.log('Testing PDF generation...\n');

    // Test data matching the requested format
    const testBooking = {
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        tourName: 'Night Tour',
        tourDate: '2025-01-01',
        startTime: '18:00',
        locations: [
            'Haeundae Beach',
            'Gwangalli',
            'Gamcheon Village'
        ],
        optionalActivities: [
            'Snacks at Gwangalli'
        ],
        totalPrice: 150.00, // Converted to USD (150000 KRW ≈ $150 USD)
        numberOfGuests: 2,
        meetingLocation: 'Haeundae Station Exit 5',
        bookingId: 'TEST-001'
    };

    try {
        console.log('Generating PDF with test data...');
        console.log('Booking ID:', testBooking.bookingId);
        
        const result = await generateTourPDF(testBooking);
        
        console.log('\n✅ PDF generated successfully!');
        console.log('File saved to:', result.filePath);
        console.log('File name:', result.fileName);
        console.log('Buffer size:', (result.buffer.length / 1024).toFixed(2), 'KB');
        
        return result;
    } catch (error) {
        console.error('\n❌ Error generating PDF:', error);
        throw error;
    }
}

// Run test if called directly
if (require.main === module) {
    testPDFGeneration()
        .then(() => {
            console.log('\n✅ Test completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Test failed:', error);
            process.exit(1);
        });
}

module.exports = { testPDFGeneration };

