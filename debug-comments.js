// Debug script for comment system issues
// Add this to your browser console to test

console.log('=== COMMENT SYSTEM DEBUG ===');

// Test 1: Check if we're on the right domain
console.log('Current URL:', window.location.href);
console.log('Is localhost:', window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// Test 2: Check if elements exist
const elements = {
    commentsSection: document.getElementById('comments'),
    commentsList: document.getElementById('commentsList'),
    commentForm: document.getElementById('commentForm')
};
console.log('Elements found:', elements);

// Test 3: Test function endpoint
async function testEndpoint() {
    const endpoint = '/.netlify/functions/comments';
    console.log('Testing endpoint:', endpoint);
    
    try {
        const response = await fetch(endpoint);
        console.log('Response status:', response.status);
        console.log('Response headers:', [...response.headers.entries()]);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Function is working!', data);
        } else {
            console.log('❌ Function error:', response.status, response.statusText);
        }
    } catch (error) {
        console.log('❌ Network error:', error.message);
        console.log('This usually means:');
        console.log('1. You are running locally (functions only work on deployed site)');
        console.log('2. Functions are not deployed');
        console.log('3. Functions have an error');
    }
}

// Test 4: Check environment
console.log('Environment check:');
console.log('- User Agent:', navigator.userAgent);
console.log('- Protocol:', window.location.protocol);
console.log('- Host:', window.location.host);

// Run the endpoint test
testEndpoint();

console.log('=== END DEBUG ===');
