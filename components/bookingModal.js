/**
 * Booking Modal Component
 * Handles tour booking with add-ons and payment options
 */

// Global state
let currentTour = null;
let addons = {
    services: [],
    products: []
};

// Initialize booking modal
function initBookingModal() {
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('bookingDate').setAttribute('min', today);
    
    // Set default time to 9:00 AM
    document.getElementById('bookingTime').value = '09:00';
    
    // Close modal handlers
    const modal = document.getElementById('bookingModal');
    const closeBtn = document.querySelector('.booking-modal-close');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeBookingModal);
    }
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeBookingModal();
        }
    });
    
    // Payment option change handler
    const paymentOptions = document.querySelectorAll('input[name="paymentOption"]');
    paymentOptions.forEach(option => {
        option.addEventListener('change', updatePriceSummary);
    });
    
    // Form submission
    const form = document.getElementById('bookingForm');
    if (form) {
        form.addEventListener('submit', handleBookingSubmit);
    }
    
    // Load add-ons
    loadAddons();
}

// Open booking modal with tour data
function openBookingModal(tourData) {
    currentTour = tourData;
    
    // Populate hidden fields
    document.getElementById('bookingTourId').value = tourData.id || '';
    document.getElementById('bookingTourName').value = tourData.name || '';
    document.getElementById('bookingTourPrice').value = tourData.price_krw || tourData.price || 0;
    
    // Show modal
    const modal = document.getElementById('bookingModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Update price summary
    updatePriceSummary();
}

// Close booking modal
function closeBookingModal() {
    const modal = document.getElementById('bookingModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    
    // Reset form
    document.getElementById('bookingForm').reset();
    currentTour = null;
    
    // Reset add-ons quantities
    document.querySelectorAll('.addon-quantity input').forEach(input => {
        input.value = 0;
    });
    updatePriceSummary();
}

// Close success modal
function closeBookingSuccessModal() {
    const modal = document.getElementById('bookingSuccessModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Load add-ons from API or use defaults
async function loadAddons() {
    try {
        // Try to fetch from API (if endpoint exists)
        // For now, use default add-ons
        addons.services = [
            { id: 'photo-service', name: 'Professional Photo Service', price_krw: 50000, type: 'service' },
            { id: 'video-editing', name: 'Video Editing (1-2 min recap)', price_krw: 100000, type: 'service' },
            { id: 'lunch', name: 'Korean Lunch', price_krw: 30000, type: 'service' }
        ];
        
        addons.products = [
            { id: 'souvenir', name: 'Tour Souvenir', price_krw: 20000, type: 'product' }
        ];
        
        renderAddons();
    } catch (error) {
        console.error('Error loading add-ons:', error);
        // Use empty add-ons if API fails
        addons.services = [];
        addons.products = [];
    }
}

// Render add-ons in the modal
function renderAddons() {
    const container = document.getElementById('addonsContainer');
    container.innerHTML = '';
    
    const allAddons = [...addons.services, ...addons.products];
    
    if (allAddons.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">No add-ons available at this time.</p>';
        return;
    }
    
    allAddons.forEach(addon => {
        const addonItem = document.createElement('div');
        addonItem.className = 'addon-item';
        addonItem.innerHTML = `
            <div class="addon-item-info">
                <div class="addon-item-name">${addon.name}</div>
                <div class="addon-item-price">₩${addon.price_krw.toLocaleString()}</div>
            </div>
            <div class="addon-item-controls">
                <div class="addon-quantity">
                    <button type="button" onclick="decrementAddon('${addon.id}')">-</button>
                    <input type="number" id="addon-${addon.id}" value="0" min="0" max="10" onchange="updateAddonQuantity('${addon.id}', this.value)" data-price="${addon.price_krw}">
                    <button type="button" onclick="incrementAddon('${addon.id}')">+</button>
                </div>
            </div>
        `;
        container.appendChild(addonItem);
    });
}

// Addon quantity controls
function incrementAddon(addonId) {
    const input = document.getElementById(`addon-${addonId}`);
    const currentValue = parseInt(input.value) || 0;
    if (currentValue < 10) {
        input.value = currentValue + 1;
        updateAddonQuantity(addonId, input.value);
    }
}

function decrementAddon(addonId) {
    const input = document.getElementById(`addon-${addonId}`);
    const currentValue = parseInt(input.value) || 0;
    if (currentValue > 0) {
        input.value = currentValue - 1;
        updateAddonQuantity(addonId, input.value);
    }
}

function updateAddonQuantity(addonId, quantity) {
    updatePriceSummary();
}

// Update price summary
function updatePriceSummary() {
    const tourPrice = parseInt(document.getElementById('bookingTourPrice').value) || 0;
    const guests = parseInt(document.getElementById('bookingGuests').value) || 1;
    
    // Calculate base price (tour price * guests)
    const basePrice = tourPrice * guests;
    
    // Calculate add-ons total
    let addonsTotal = 0;
    document.querySelectorAll('.addon-quantity input').forEach(input => {
        const quantity = parseInt(input.value) || 0;
        const price = parseInt(input.dataset.price) || 0;
        addonsTotal += quantity * price;
    });
    
    // Show/hide addons row
    const addonsRow = document.getElementById('addonsPriceRow');
    if (addonsTotal > 0) {
        addonsRow.style.display = 'flex';
        document.getElementById('addonsPrice').textContent = `₩${addonsTotal.toLocaleString()}`;
    } else {
        addonsRow.style.display = 'none';
    }
    
    // Calculate total
    const subtotal = basePrice + addonsTotal;
    
    // Check payment option
    const paymentOption = document.querySelector('input[name="paymentOption"]:checked').value;
    const discountRow = document.getElementById('discountRow');
    
    let total = subtotal;
    let discount = 0;
    
    if (paymentOption === 'pay_now' && subtotal > 0) {
        discount = Math.round(subtotal * 0.1);
        total = subtotal - discount;
        discountRow.style.display = 'flex';
        document.getElementById('discountAmount').textContent = `-₩${discount.toLocaleString()}`;
    } else {
        discountRow.style.display = 'none';
    }
    
    // Update display
    document.getElementById('basePrice').textContent = `₩${basePrice.toLocaleString()}`;
    document.getElementById('totalPrice').textContent = `₩${total.toLocaleString()}`;
}

// Handle form submission
async function handleBookingSubmit(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('bookingSubmitBtn');
    const submitText = document.getElementById('submitBtnText');
    const submitLoading = document.getElementById('submitBtnLoading');
    
    // Disable button and show loading
    submitBtn.disabled = true;
    submitText.style.display = 'none';
    submitLoading.style.display = 'block';
    
    try {
        // Collect form data - simplified schema
        const customerName = document.getElementById('bookingName').value.trim();
        const customerEmail = document.getElementById('bookingEmail').value.trim();
        const tourType = document.getElementById('bookingTourName').value || 'Tour';
        const tourDate = document.getElementById('bookingDate').value;
        
        // Calculate total price
        const tourPrice = parseFloat(document.getElementById('bookingTourPrice').value) || 0;
        const guests = parseInt(document.getElementById('bookingGuests').value) || 1;
        let totalPrice = tourPrice * guests;
        
        // Add add-ons to price
        document.querySelectorAll('.addon-quantity input').forEach(input => {
            const quantity = parseInt(input.value) || 0;
            if (quantity > 0) {
                const price = parseFloat(input.dataset.price) || 0;
                totalPrice += price * quantity;
            }
        });
        
        // Apply discount if pay_now
        const paymentOption = document.querySelector('input[name="paymentOption"]:checked').value;
        if (paymentOption === 'pay_now') {
            totalPrice = Math.round(totalPrice * 0.9); // 10% discount
        }
        
        // Prepare booking data for new API
        const bookingData = {
            customerName: customerName,
            customerEmail: customerEmail,
            tourType: tourType,
            tourDate: tourDate,
            price: totalPrice
        };
        
        // Call new API endpoint
        const response = await fetch('/api/booking/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bookingData)
        });
        
        const result = await response.json();
        
        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Booking failed');
        }
        
        // Booking created successfully with PENDING status
        const booking = result.booking;
        
        // Handle payment flow
        if (paymentOption === 'pay_now') {
            // TODO: Integrate payment gateway (Stripe/PayPal) here
            // For now, show success and note that payment is pending
            closeBookingModal();
            showBookingSuccess(booking.bookingId, 'Payment pending - you will be redirected to payment page');
        } else {
            // Pay After - show success modal
            closeBookingModal();
            showBookingSuccess(booking.bookingId);
        }
        
    } catch (error) {
        console.error('Booking error:', error);
        alert('Booking failed: ' + error.message);
        
        // Re-enable button
        submitBtn.disabled = false;
        submitText.style.display = 'block';
        submitLoading.style.display = 'none';
    }
}

// Show success modal
function showBookingSuccess(bookingId, message = null) {
    document.getElementById('successBookingId').textContent = bookingId;
    
    // Update message if provided
    if (message) {
        const instructions = document.querySelector('.success-instructions');
        if (instructions) {
            const messageEl = document.createElement('p');
            messageEl.style.color = '#4A90E2';
            messageEl.style.fontWeight = 'bold';
            messageEl.textContent = message;
            instructions.insertBefore(messageEl, instructions.firstChild);
        }
    }
    
    const modal = document.getElementById('bookingSuccessModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Initialize on DOM load (with delay to ensure HTML is loaded)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initBookingModal, 100);
    });
} else {
    setTimeout(initBookingModal, 100);
}

// Export functions for global use
window.openBookingModal = openBookingModal;
window.closeBookingModal = closeBookingModal;
window.closeBookingSuccessModal = closeBookingSuccessModal;
window.incrementAddon = incrementAddon;
window.decrementAddon = decrementAddon;
window.updateAddonQuantity = updateAddonQuantity;

