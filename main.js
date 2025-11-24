// Google Maps functionality removed - not essential for website functionality
// Cache bust: Debug overlay completely removed
// Cache bust: Comment system added

// ============================================
// AUTHENTICATION & SESSION HANDLING
// ============================================

// Global auth state
let currentUser = null;
let authInitialized = false;

/**
 * Initialize authentication and check login state
 */
async function initAuth() {
    if (authInitialized) return currentUser;
    
    try {
        if (typeof window.supabaseAuth !== 'undefined') {
            const { user, error } = await window.supabaseAuth.getCurrentUser();
            if (!error && user) {
                currentUser = user;
                updateAuthUI(user);
            } else {
                currentUser = null;
                updateAuthUI(null);
            }
        }
        authInitialized = true;
        return currentUser;
    } catch (error) {
        console.log('Auth initialization error:', error);
        currentUser = null;
        updateAuthUI(null);
        return null;
    }
}

/**
 * Update UI based on authentication state
 */
function updateAuthUI(user) {
    const authLink = document.getElementById('auth-link');
    const authNavItem = document.getElementById('auth-nav-item');
    
    if (authLink && authNavItem) {
        if (user) {
            authLink.href = 'dashboard.html';
            authLink.textContent = 'Dashboard';
            authLink.innerHTML = '<i class="fas fa-user-circle"></i> Dashboard';
        } else {
            authLink.href = 'login.html';
            authLink.textContent = 'Sign In';
            authLink.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
        }
    }
}

/**
 * Check if user is logged in
 */
async function isLoggedIn() {
    if (!authInitialized) {
        await initAuth();
    }
    return currentUser !== null;
}

/**
 * Get current user discount status
 */
async function getDiscountStatus() {
    if (!currentUser) {
        await initAuth();
    }
    
    if (!currentUser) {
        return { hasDiscount: false, discountExpiry: null };
    }
    
    try {
        const status = await window.supabaseAuth.getUserDiscountStatus(currentUser.id);
        return status;
    } catch (error) {
        console.error('Error getting discount status:', error);
        return { hasDiscount: false, discountExpiry: null };
    }
}

// Listen for auth state changes
if (typeof window !== 'undefined') {
    window.addEventListener('load', async () => {
        await initAuth();
        
        // Listen for auth state changes (Supabase)
        if (typeof window.supabaseAuth !== 'undefined' && window.supabaseAuth.getSupabase) {
            const supabase = window.supabaseAuth.getSupabase();
            if (supabase && supabase.auth) {
                supabase.auth.onAuthStateChange((event, session) => {
                    if (event === 'SIGNED_IN') {
                        currentUser = session?.user || null;
                        updateAuthUI(currentUser);
                    } else if (event === 'SIGNED_OUT') {
                        currentUser = null;
                        updateAuthUI(null);
                    }
                });
            }
        }
    });
}

// Force hide any remaining debug elements
function hideDebugElements() {
    const debugDiv = document.getElementById('mobile-debug');
    if (debugDiv) {
        debugDiv.style.display = 'none';
        debugDiv.remove();
    }
}

// Mobile detection and error handling
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
}

// Enhanced error handling for mobile
function handleError(error, context) {
    console.error(`Error in ${context}:`, error);
    
    // Show user-friendly error message on mobile
    if (isMobile()) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ff4444;
            color: white;
            padding: 20px;
            border-radius: 10px;
            z-index: 10000;
            text-align: center;
            max-width: 90%;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;
        errorDiv.innerHTML = `
            <h3>Something went wrong</h3>
            <p>Please refresh the page or try again later.</p>
            <button onclick="this.parentElement.remove()" style="background: white; color: #ff4444; border: none; padding: 8px 16px; border-radius: 5px; margin-top: 10px;">OK</button>
        `;
        document.body.appendChild(errorDiv);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 10000);
    }
}

// Debug counter
let errorCount = 0;

// Global error handler for mobile
window.addEventListener('error', function(e) {
    errorCount++;
    handleError(e.error, 'global error');
});

// Force hide debug elements on window load too
window.addEventListener('load', function() {
    hideDebugElements();
});

// Comments functionality
class CommentsManager {
    constructor() {
        this.commentsList = document.getElementById('commentsList');
        this.commentForm = document.getElementById('commentForm');
        this.init();
    }

    init() {
        if (this.commentForm) {
            this.commentForm.addEventListener('submit', this.handleSubmit.bind(this));
        }
        this.loadComments();
    }

    async handleSubmit(event) {
        event.preventDefault();
        
        const formData = new FormData(this.commentForm);
        const name = formData.get('name').trim();
        const text = formData.get('text').trim();

        if (!name || !text) {
            this.showMessage('Please fill in all fields', 'error');
            return;
        }

        this.setLoading(true);

        try {
            // Posting comment
            const response = await fetch('/api/comments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, text })
            });

            // Response received
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            // Comment posted successfully

            if (result.success) {
                this.showMessage('Comment posted successfully!', 'success');
                this.commentForm.reset();
                this.loadComments(); // Refresh comments
            } else {
                this.showMessage(result.error || 'Failed to post comment', 'error');
                console.error('Failed to post comment:', result);
            }
        } catch (error) {
            console.error('Error posting comment:', error);
            this.showMessage('Network error. Please try again.', 'error');
        } finally {
            this.setLoading(false);
        }
    }

    async loadComments() {
        try {
            // Loading comments
            const response = await fetch('/api/comments');
            // Comments response received
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            // Comments loaded

            if (result.success) {
                this.displayComments(result.comments);
            } else {
                this.showMessage('Failed to load comments', 'error');
                console.error('Failed to load comments:', result);
            }
        } catch (error) {
            console.error('Error loading comments:', error);
            this.showMessage('Failed to connect to server. Please check your connection.', 'error');
            this.displayComments([]);
        }
    }

    displayComments(comments) {
        if (!this.commentsList) return;

        if (comments.length === 0) {
            this.commentsList.innerHTML = '<div class="no-comments">No comments yet. Be the first to share your experience!</div>';
            return;
        }

        this.commentsList.innerHTML = comments.map(comment => `
            <div class="comment-item">
                <div class="comment-header">
                    <div class="comment-name">${this.escapeHtml(comment.name)}</div>
                    <div class="comment-date">${this.formatDate(comment.created_at)}</div>
                </div>
                <div class="comment-text">${this.escapeHtml(comment.text)}</div>
            </div>
        `).join('');
    }

    setLoading(loading) {
        const submitBtn = this.commentForm?.querySelector('.submit-btn');
        if (!submitBtn) return;

        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');

        if (loading) {
            submitBtn.disabled = true;
            btnText.style.display = 'none';
            btnLoading.style.display = 'inline';
        } else {
            submitBtn.disabled = false;
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
        }
    }

    showMessage(message, type) {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.error-message, .success-message');
        existingMessages.forEach(msg => msg.remove());

        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.className = `${type}-message`;
        messageDiv.textContent = message;

        // Insert after form
        const formContainer = document.querySelector('.comment-form-container');
        if (formContainer) {
            formContainer.insertAdjacentElement('afterend', messageDiv);
        }

        // Auto-remove after 5 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Initialize comments when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // DOM loaded, initializing comments
    
    // Check if comment elements exist
    const commentsSection = document.getElementById('comments');
    const commentsList = document.getElementById('commentsList');
    const commentForm = document.getElementById('commentForm');
    
    // Comment elements found - debug disabled for production
    
    if (commentsSection && commentsList && commentForm) {
        new CommentsManager();
        // CommentsManager initialized successfully
    } else {
        console.error('Comment elements not found! Check HTML structure.');
        // Make sure the comment section HTML is included in the deployed version
    }
});

// ======================
// Recent Tours / Stories
// ======================
(function initStories() {
    const grid = document.getElementById('storiesGrid');
    if (!grid) return;

    // Modal elements
    const modal = document.createElement('div');
    modal.className = 'story-modal';
    modal.innerHTML = `
        <div class="story-modal-content">
            <div class="story-modal-header">
                <h3 id="storyModalTitle" style="margin:0;color:#2c3e50;">Story</h3>
                <button class="story-modal-close" aria-label="Close">✕</button>
            </div>
            <div class="story-modal-gallery" id="storyModalGallery"></div>
            <div class="story-modal-caption" id="storyModalCaption"></div>
        </div>
    `;
    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('.story-modal-close');
    closeBtn.addEventListener('click', () => modal.classList.remove('open'));
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });

    function openStoryModal(story) {
        document.getElementById('storyModalTitle').textContent = `${formatDate(story.date)} • ${story.tour}`;
        const gal = document.getElementById('storyModalGallery');
        gal.innerHTML = '';
        // Handle videos (like MOV files with .gif extension)
        if (story.videos && story.videos.length > 0) {
            story.videos.forEach(src => {
                const video = document.createElement('video');
                video.src = src;
                video.controls = true;
                video.autoplay = true;
                video.loop = true;
                video.muted = true;
                video.playsInline = true;
                video.style.width = '100%';
                video.style.height = 'auto';
                video.style.borderRadius = '10px';
                gal.appendChild(video);
            });
        }
        
        story.photos.forEach(src => {
            // Check if it's actually a video file (MOV) with wrong extension
            if (src.endsWith('.gif') || src.includes('nightclub1')) {
                // Try as video first
                const video = document.createElement('video');
                video.src = src;
                video.controls = true;
                video.autoplay = true;
                video.loop = true;
                video.muted = true;
                video.playsInline = true;
                video.style.width = '100%';
                video.style.height = 'auto';
                video.style.borderRadius = '10px';
                
                video.onerror = function() {
                    // If video fails, try as image
                    const img = document.createElement('img');
                    img.src = src;
                    img.alt = story.tour;
                    img.loading = 'lazy';
                    img.style.width = '100%';
                    img.style.height = 'auto';
                    img.style.objectFit = 'cover';
                    img.onerror = function() {
                        console.error('Failed to load:', src);
                    };
                    gal.replaceChild(img, video);
                };
                
                gal.appendChild(video);
            } else {
                    const img = document.createElement('img');
                    img.src = src;
                    img.alt = story.tour;
                    img.loading = 'lazy';
                    img.style.width = '100%';
                    img.style.height = 'auto';
                    img.style.objectFit = 'cover';
                    img.decoding = 'async'; // Better performance
                    
                    img.onerror = function() {
                        console.error('Failed to load image:', src);
                    };
                    
                    gal.appendChild(img);
            }
        });
        document.getElementById('storyModalCaption').textContent = story.caption || '';
        modal.classList.add('open');
    }

    function formatDate(iso) {
        try {
            const d = new Date(iso);
            return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
        } catch { return iso; }
    }

    async function loadStories() {
        try {
            // Always fetch from the static JSON file
            const res = await fetch('data/stories.json', { cache: 'no-cache' });
            if (!res.ok) throw new Error('Failed to load stories');
            const stories = await res.json();

            grid.innerHTML = '';
            stories.forEach(story => {
                const card = document.createElement('div');
                card.className = 'story-card';
                const thumb = (story.photos && story.photos[0]) || 'logo.png';
                const isVideo = thumb.includes('nightclub1') || (story.videos && story.videos.length > 0);
                
                if (isVideo && thumb.endsWith('.gif')) {
                    // For video files, use a video element with poster
                    card.innerHTML = `
                        <video class="story-thumb" muted loop playsinline style="width: 100%; height: 220px; object-fit: cover;">
                            <source src="${thumb}" type="video/mp4">
                            <source src="${thumb}" type="video/quicktime">
                        </video>
                        <div class="story-body">
                            <div class="story-meta"><i class="far fa-calendar"></i> ${formatDate(story.date)} • ${story.tour}</div>
                            <h4 class="story-title">${story.caption ? story.caption : story.tour}</h4>
                            <div class="story-actions">
                                <button class="story-button">View Gallery</button>
                            </div>
                        </div>
                    `;
                    // Auto-play the video thumbnail
                    const video = card.querySelector('video');
                    if (video) {
                        video.play().catch(() => {}); // Video autoplay prevented (silent)
                    }
                } else {
                    card.innerHTML = `
                        <img class="story-thumb" src="${thumb}" alt="${story.tour}" loading="lazy" decoding="async" width="400" height="220">
                        <div class="story-body">
                            <div class="story-meta"><i class="far fa-calendar"></i> ${formatDate(story.date)} • ${story.tour}</div>
                            <h4 class="story-title">${story.caption ? story.caption : story.tour}</h4>
                            <div class="story-actions">
                                <button class="story-button">View Gallery</button>
                            </div>
                        </div>
                    `;
                    
                    // Add error handling for thumbnail
                    const thumbImg = card.querySelector('.story-thumb');
                    thumbImg.onerror = function() {
                        console.error('Failed to load thumbnail:', thumb);
                        this.src = 'logo.png'; // Fallback to logo
                    };
                }
                
                card.querySelector('.story-button').addEventListener('click', () => openStoryModal(story));
                grid.appendChild(card);
            });
        } catch (e) {
            console.error('Error loading stories:', e);
            grid.innerHTML = '<div class="no-comments">Stories will appear here soon.</div>';
        }
    }

    loadStories();
})();

// ======================
// Admin Form for Adding Stories
// ======================
(function initAdminForm() {
    const form = document.getElementById('adminStoryForm');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        const date = formData.get('date');
        const tour = formData.get('tour').trim();
        const caption = formData.get('caption').trim();
        const photosText = formData.get('photos').trim();
        
        if (!date || !tour || !caption || !photosText) {
            alert('Please fill in all required fields.');
            return;
        }
        
        // Parse photos from textarea (one per line)
        const photos = photosText.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
        
        if (photos.length === 0) {
            alert('Please enter at least one photo URL.');
            return;
        }
        
        try {
            const submitButton = form.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Adding Story...';
            submitButton.disabled = true;
            
            // Send to Netlify function
            const response = await fetch('/api/stories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ date, tour, caption, photos })
            });

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to add story');
            }
            
            // Show the JSON to the user so they can manually update the file
            const jsonToAdd = JSON.stringify([result.story], null, 2);
            
            // Create a modal to show the JSON
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            `;
            
            modal.innerHTML = `
                <div style="background: white; padding: 30px; border-radius: 10px; max-width: 600px; max-height: 80vh; overflow-y: auto;">
                    <h2 style="margin-top: 0;">✨ Story Created Successfully!</h2>
                    <p>Copy this JSON and manually update <code>data/stories.json</code>:</p>
                    <textarea readonly style="width: 100%; height: 200px; font-family: monospace; padding: 10px; border: 1px solid #ddd; border-radius: 5px; resize: none;" id="jsonOutput">${jsonToAdd}</textarea>
                    <button id="copyBtn" style="background: #4A90E2; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-top: 10px;">📋 Copy JSON</button>
                    <button id="closeBtn" style="background: #666; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-left: 10px;">Close</button>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            document.getElementById('copyBtn').addEventListener('click', () => {
                const textarea = document.getElementById('jsonOutput');
                textarea.select();
                document.execCommand('copy');
                alert('Copied to clipboard!');
            });
            
            const closeModal = () => {
                modal.remove();
                form.reset();
                
                // Hide admin section
                const adminSection = document.getElementById('adminSection');
                const adminToggle = document.getElementById('adminToggle');
                if (adminSection) adminSection.style.display = 'none';
                if (adminToggle) adminToggle.innerHTML = '<i class="fas fa-plus"></i>';
                
                // Reload stories if on stories page
                const storiesGrid = document.getElementById('storiesGrid');
                if (storiesGrid && typeof loadStories === 'function') {
                    loadStories();
                }
            };
            
            document.getElementById('closeBtn').addEventListener('click', closeModal);
            
            // Close when clicking outside
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal();
            });
            
            // New story JSON generated
            
        } catch (error) {
            console.error('Error adding story:', error);
            alert('Error adding story: ' + (error.message || 'Please try again.'));
        } finally {
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.textContent = 'Add Story';
            submitButton.disabled = false;
        }
    });
})();



// Mobile loading handler - FIXED VERSION
document.addEventListener('DOMContentLoaded', function() {
    // Force hide any debug elements
    hideDebugElements();
    
    const mobileLoading = document.getElementById('mobile-loading');
    
    if (isMobile() && mobileLoading) {
        // Show loading for mobile devices
        mobileLoading.style.display = 'flex';
        
        // Multiple fallback mechanisms to ensure loading screen disappears
        let loadingHidden = false;
        
        function hideLoading() {
            if (!loadingHidden && mobileLoading) {
                loadingHidden = true;
                mobileLoading.classList.add('hidden');
                // Mobile loading hidden
            }
        }
        
        // Method 1: Hide after page load
        window.addEventListener('load', function() {
            setTimeout(hideLoading, 200);
        });
        
        // Method 2: Hide after DOM is ready (immediate fallback)
        setTimeout(hideLoading, 1000);
        
        // Method 3: Hide after 2 seconds regardless (safety net)
        setTimeout(hideLoading, 2000);
        
        // Method 4: Hide when user interacts
        document.addEventListener('touchstart', hideLoading, { once: true });
        document.addEventListener('click', hideLoading, { once: true });
        
        // Method 5: Force hide after 3 seconds (emergency fallback)
        setTimeout(() => {
            if (mobileLoading) {
                mobileLoading.style.display = 'none';
                mobileLoading.remove();
                // Emergency mobile loading removal
            }
        }, 3000);
        
    } else if (mobileLoading) {
        // Hide loading immediately on desktop
        mobileLoading.style.display = 'none';
    }
});

// Smooth scroll for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerOffset = 80;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Form submission handler with Web3Forms
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
    const submitButton = contactForm.querySelector('button[type="submit"]');
    const buttonText = submitButton.querySelector('.button-text');
    const buttonLoader = submitButton.querySelector('.button-loader');
    const formSuccess = document.getElementById('form-success');
    const formError = document.getElementById('form-error');

    // Set minimum date to today
    const tourDateInput = document.getElementById('tour_date');
    if (tourDateInput) {
        const today = new Date().toISOString().split('T')[0];
        tourDateInput.min = today;
    }

    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Reset messages
        formSuccess.style.display = 'none';
        formError.style.display = 'none';

        // Show loading state
        buttonText.style.display = 'none';
        buttonLoader.style.display = 'flex';
        submitButton.disabled = true;

        try {
            const formData = new FormData(this);
            
            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                // Show success message
                formSuccess.style.display = 'flex';
                this.reset();
                
                // Scroll to success message
                formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Hide success message after 5 seconds
                setTimeout(() => {
                    formSuccess.style.display = 'none';
                }, 5000);
            } else {
                throw new Error(data.message || 'Form submission failed');
            }
        } catch (error) {
            console.error('Form submission error:', error);
            
            // Show error message
            formError.style.display = 'flex';
            formError.querySelector('span').textContent = error.message || 'There was a problem submitting your form. Please try again or contact us directly.';
            
            // Scroll to error message
            formError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Hide error message after 5 seconds
            setTimeout(() => {
                formError.style.display = 'none';
            }, 5000);
        } finally {
            // Reset button state
            buttonLoader.style.display = 'none';
            buttonText.style.display = 'block';
            submitButton.disabled = false;
        }
    });
}

// Tour card hover effects
document.querySelectorAll('.tour-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-10px)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
    });
});

// Map initialization removed

// Carousel Functionality
document.addEventListener('DOMContentLoaded', function() {
    const carousel = document.querySelector('.carousel');
    const slides = document.querySelectorAll('.carousel-slide');
    const prevButton = document.querySelector('.carousel-button.prev');
    const nextButton = document.querySelector('.carousel-button.next');
    const dotsContainer = document.querySelector('.carousel-dots');
    
    if (!carousel || !slides.length) return;

    let currentSlide = 0;
    const totalSlides = slides.length;

    // Create dots
    slides.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        if (index === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goToSlide(index));
        dotsContainer.appendChild(dot);
    });

    const dots = document.querySelectorAll('.dot');

    // Function to update slide position with smooth transition
    function updateSlidePosition() {
        carousel.style.transform = `translateX(-${currentSlide * 100}%)`;
        // Update dots
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlide);
        });
    }

    // Function to go to specific slide
    function goToSlide(index) {
        currentSlide = index;
        updateSlidePosition();
        resetAutoPlay();
    }

    // Next slide function with boundary check
    function nextSlide() {
        currentSlide = (currentSlide + 1) % totalSlides;
        updateSlidePosition();
        resetAutoPlay();
    }

    // Previous slide function with boundary check
    function prevSlide() {
        currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
        updateSlidePosition();
        resetAutoPlay();
    }

    // Reset auto-play timer
    function resetAutoPlay() {
        clearInterval(slideInterval);
        slideInterval = setInterval(nextSlide, 5000);
    }

    // Event listeners
    prevButton.addEventListener('click', prevSlide);
    nextButton.addEventListener('click', nextSlide);

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') prevSlide();
        if (e.key === 'ArrowRight') nextSlide();
    });

    // Auto-advance slides every 5 seconds
    let slideInterval = setInterval(nextSlide, 5000);

    // Pause auto-advance on hover
    carousel.addEventListener('mouseenter', () => {
        clearInterval(slideInterval);
    });

    // Resume auto-advance when mouse leaves
    carousel.addEventListener('mouseleave', () => {
        slideInterval = setInterval(nextSlide, 5000);
    });

    // Touch support for mobile devices
    let touchStartX = 0;
    let touchEndX = 0;
    let isDragging = false;

    carousel.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
        isDragging = true;
        clearInterval(slideInterval);
    }, { passive: true });

    carousel.addEventListener('touchmove', e => {
        if (!isDragging) return;
        e.preventDefault();
        const currentX = e.changedTouches[0].screenX;
        const diff = touchStartX - currentX;
        const offset = (diff / carousel.offsetWidth) * 100;
        carousel.style.transform = `translateX(-${currentSlide * 100 + offset}%)`;
    });

    carousel.addEventListener('touchend', e => {
        if (!isDragging) return;
        isDragging = false;
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
        resetAutoPlay();
    });

    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                nextSlide();
            } else {
                prevSlide();
            }
        } else {
            // Return to current slide if swipe wasn't strong enough
            updateSlidePosition();
        }
    }

    // Initial setup
    updateSlidePosition();
});

// Intersection Observer for section animations
document.addEventListener('DOMContentLoaded', function() {
    const sections = document.querySelectorAll('.section');
    
    const sectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, {
        threshold: 0.15 // Trigger when 15% of the section is visible
    });

    sections.forEach(section => {
        sectionObserver.observe(section);
    });

    // Smooth scroll handling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Intersection Observer for animations
    const animatedElements = document.querySelectorAll('.animate-fadeInUp, .animate-fadeIn');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1
    });

    animatedElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'all 0.8s ease-out';
        observer.observe(element);
    });

    // Interactive star ratings
    const testimonialCards = document.querySelectorAll('.testimonial-card');
    
    testimonialCards.forEach(card => {
        const starsContainer = card.querySelector('.stars');
        if (starsContainer) {
            const rating = parseInt(starsContainer.textContent.match(/\d/)[0]) || 5;
            starsContainer.textContent = '';
            
            for (let i = 1; i <= 5; i++) {
                const star = document.createElement('span');
                star.className = 'star';
                star.innerHTML = i <= rating ? '★' : '☆';
                star.addEventListener('mouseover', () => {
                    for (let j = 0; j < 5; j++) {
                        starsContainer.children[j].innerHTML = j < i ? '★' : '☆';
                    }
                });
                star.addEventListener('mouseout', () => {
                    for (let j = 0; j < 5; j++) {
                        starsContainer.children[j].innerHTML = j < rating ? '★' : '☆';
                    }
                });
                starsContainer.appendChild(star);
            }
        }
    });

    // Parallax effect for sections with parallax-section class
    const parallaxSections = document.querySelectorAll('.parallax-section');
    
    window.addEventListener('scroll', () => {
        parallaxSections.forEach(section => {
            const distance = window.pageYOffset;
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            
            if (distance > sectionTop - window.innerHeight && 
                distance < sectionTop + sectionHeight) {
                const speed = 0.5;
                const yPos = (distance - sectionTop) * speed;
                section.style.backgroundPositionY = `${yPos}px`;
            }
        });
    });
});



// Dark Mode Functionality
document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('themeToggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Check for saved theme preference or system preference
    const currentTheme = localStorage.getItem('theme') || 
                        (prefersDarkScheme.matches ? 'dark' : 'light');
    
    // Apply saved theme on load
    if (currentTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        themeToggle.querySelector('i').classList.replace('fa-moon', 'fa-sun');
    }

    // Theme toggle click handler
    themeToggle.addEventListener('click', function() {
        const icon = this.querySelector('i');
        if (document.body.getAttribute('data-theme') === 'dark') {
            document.body.removeAttribute('data-theme');
            icon.classList.replace('fa-sun', 'fa-moon');
            localStorage.setItem('theme', 'light');
        } else {
            document.body.setAttribute('data-theme', 'dark');
            icon.classList.replace('fa-moon', 'fa-sun');
            localStorage.setItem('theme', 'dark');
        }
    });

    // Listen for system theme changes
    prefersDarkScheme.addEventListener('change', function(e) {
        if (!localStorage.getItem('theme')) {
            if (e.matches) {
                document.body.setAttribute('data-theme', 'dark');
                themeToggle.querySelector('i').classList.replace('fa-moon', 'fa-sun');
            } else {
                document.body.removeAttribute('data-theme');
                themeToggle.querySelector('i').classList.replace('fa-sun', 'fa-moon');
            }
        }
    });
});

// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const mainNav = document.querySelector('.main-nav');

    if (mobileMenuToggle && navLinks) {
        mobileMenuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            navLinks.classList.toggle('active');
            mobileMenuToggle.setAttribute('aria-expanded', 
                mobileMenuToggle.getAttribute('aria-expanded') === 'true' ? 'false' : 'true'
            );
            
            // Toggle menu icon
            const menuIcon = mobileMenuToggle.querySelector('i');
            if (menuIcon) {
                menuIcon.classList.toggle('fa-bars');
                menuIcon.classList.toggle('fa-times');
            }
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', function(event) {
            const isClickInside = mainNav.contains(event.target);
            
            if (!isClickInside && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                mobileMenuToggle.setAttribute('aria-expanded', 'false');
                
                // Reset menu icon
                const menuIcon = mobileMenuToggle.querySelector('i');
                if (menuIcon) {
                    menuIcon.classList.add('fa-bars');
                    menuIcon.classList.remove('fa-times');
                }
            }
        });

        // Close mobile menu when clicking on a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                mobileMenuToggle.setAttribute('aria-expanded', 'false');
                
                // Reset menu icon
                const menuIcon = mobileMenuToggle.querySelector('i');
                if (menuIcon) {
                    menuIcon.classList.add('fa-bars');
                    menuIcon.classList.remove('fa-times');
                }
            });
        });
    }
});

// Update active navigation link based on scroll position
document.addEventListener('DOMContentLoaded', function() {
    // Get all sections and navigation links
    const sections = document.querySelectorAll('section[id], header[id]');
    const navLinks = document.querySelectorAll('.nav-links a');

    // Function to update active navigation link
    function updateActiveNavLink() {
        let currentSectionId = '';
        const scrollPosition = window.scrollY + 100; // Offset for the navigation bar

        // Find the current section
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSectionId = section.getAttribute('id');
            }
        });

        // Update navigation links
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSectionId}`) {
                link.classList.add('active');
            }
        });
    }

    // Add scroll event listener
    window.addEventListener('scroll', updateActiveNavLink);
    
    // Call once on load
    updateActiveNavLink();
});

// FAQ Functionality
document.addEventListener('DOMContentLoaded', function() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            // Close other open items
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                }
            });

            // Toggle current item
            item.classList.toggle('active');
        });
    });
});

// Custom Tour Builder Functionality
document.addEventListener('DOMContentLoaded', function() {
    const locationOptions = document.querySelectorAll('input[name="locations"]');
    const lunchOptions = document.querySelectorAll('input[name="lunch"]');
    const serviceOptions = document.querySelectorAll('input[name="services"]');
    const eveningOptions = document.querySelectorAll('input[name="evening"]');
    const generateSummaryBtn = document.getElementById('generate-summary');
    const contactCustomBtn = document.getElementById('contact-custom');
    const tourSummaryContent = document.getElementById('tour-summary-content');
    const costBreakdownContent = document.getElementById('cost-breakdown-content');
    const totalCostElement = document.getElementById('total-cost');
    const LOCATION_PRICE = 50;
    const EVENING_PRICE = 15;
    const USD_NOTE_TEXT = 'This tour summary displays all prices in USD for easier understanding.';

    function formatUSD(amount) {
        return `$${Number(amount).toFixed(0)}`;
    }

    // Location options change handler
    locationOptions.forEach(option => {
        option.addEventListener('change', updateTourSummary);
    });

    // Lunch options change handler
    lunchOptions.forEach(option => {
        option.addEventListener('change', updateTourSummary);
    });

    // Service options change handler
    serviceOptions.forEach(option => {
        option.addEventListener('change', updateTourSummary);
    });

    // Evening options change handler
    eveningOptions.forEach(option => {
        option.addEventListener('change', updateTourSummary);
    });

    // Generate summary button
    if (generateSummaryBtn) {
        generateSummaryBtn.addEventListener('click', generateDetailedSummary);
    }

    // Contact custom tour button
    if (contactCustomBtn) {
        contactCustomBtn.addEventListener('click', contactAboutCustomTour);
    }

    function updateTourSummary() {
        const selectedLocations = Array.from(locationOptions)
            .filter(option => option.checked)
            .map(option => option.value);

        const selectedLunch = Array.from(lunchOptions)
            .filter(option => option.checked)
            .map(option => option.value)[0];

        const selectedServices = Array.from(serviceOptions)
            .filter(option => option.checked)
            .map(option => option.value);

        const selectedEvening = Array.from(eveningOptions)
            .filter(option => option.checked)
            .map(option => option.value)[0];

        if (selectedLocations.length === 0) {
            tourSummaryContent.innerHTML = '<p>Select your locations above to see your personalized tour summary.</p>';
            costBreakdownContent.innerHTML = '<p>Select locations to see cost breakdown.</p>';
            totalCostElement.textContent = '$0.00';
            return;
        }

        // Check location limit
        if (selectedLocations.length < 4) {
            tourSummaryContent.innerHTML = '<p>Please select at least 4 locations for your tour.</p>';
            return;
        }

        if (selectedLocations.length > 5) {
            tourSummaryContent.innerHTML = '<p>Please select maximum 5 locations for your tour.</p>';
            return;
        }

        let summary = '<div class="summary-details">';
        summary += '<h4>🎯 Your Custom Tour</h4>';
        summary += '<ul>';

        // Add selected locations
        const locationNames = {
            'gamcheon': '🏘️ Gamcheon Culture Village',
            'gwangalli': '🌉 Gwangalli Beach & Bridge',
            'haeundae': '🏖️ Haeundae Beach',
            'oryukdo': '🏝️ Oryukdo Island and Skywalk',
            'haedong': '🛕 Haedong Yonggungsa Temple',
            'hwamyeong': '🌲 Hwamyeong Eco Park (Mountain night view)',
            'songdo': '🚠 Songdo Beach + Cable Car (Premium)',
            'blueline': '🚂 Blue Line Park (Capsule train) (Premium)',
            'jagalchi': '🐟 Jagalchi Fish Market',
            'dadaepo': '🌅 Dadaepo Beach + Sunset'
        };

        selectedLocations.forEach(location => {
            summary += `<li>${locationNames[location] || location}</li>`;
        });

        summary += '</ul>';

        // Add lunch selection
        if (selectedLunch) {
            const lunchNames = {
                'geumsubokguk': '🍜 Geumsubokguk (금수복국)',
                'obok': '🍜 Obok Restaurant (오복미역)',
                'ashley': '🍽️ Ashley Queens Buffet',
                'haeundae-market': '🍜 Haeundae Traditional Market Food Alley',
                'baekhwa': '🍜 Baekhwa-jumak (백화주막)',
                'haeundae-bbq': '🍖 Haeundae BBQ'
            };
            summary += `<p><strong>Lunch:</strong> ${lunchNames[selectedLunch] || selectedLunch}</p>`;
        }

        // Add services
        if (selectedServices.length > 0) {
            summary += '<p><strong>Extra Services:</strong></p><ul>';
            const serviceNames = {
                'hanbok': '👘 Hanbok rental',
                'fireworks': '🎆 Mini fireworks set',
                'souvenir': '🎁 Chill Busan souvenir gift',
                'postcard': '📮 Postcard from Busan',
                'instagram': '📸 Instagram reel/video help',
                'picnic': '🧺 Sunset picnic setup',
                'video-editing': '🎬 Full video editing of the tour (1–2 min recap)'
            };
            selectedServices.forEach(service => {
                summary += `<li>${serviceNames[service] || service}</li>`;
            });
            summary += '</ul>';
        }

        // Add evening option
        if (selectedEvening) {
            const eveningNames = {
                'fingers-chat': `🍸 Fingers & Chat ($${EVENING_PRICE})`,
                'sky-lounge': `🏢 Sky Lounge @ LCT Tower (SIGNIEL Hotel) ($${EVENING_PRICE})`,
                'waveon': `☕ Waveon Coffee Rooftop ($${EVENING_PRICE})`,
                'bay101': `🍸 The Bay 101 Lounge Bar ($${EVENING_PRICE})`,
                'maison': `🍸 Maison de la Cité ($${EVENING_PRICE})`,
                'cielo': `🍝 Cielo Italian restaurant ($${EVENING_PRICE})`
            };
            summary += `<p><strong>Evening Option:</strong> ${eveningNames[selectedEvening] || selectedEvening}</p>`;
        }

        summary += `<p class="usd-note">${USD_NOTE_TEXT}</p>`;
        summary += '</div>';

        tourSummaryContent.innerHTML = summary;

        // Update cost breakdown
        updateCostBreakdown(selectedLocations, selectedServices);
    }

    function updateCostBreakdown(selectedLocations, selectedServices) {
        let totalCost = 0;
        let breakdown = '<ul>';

        // Calculate location costs
        const locationCost = selectedLocations.length * LOCATION_PRICE;
        totalCost += locationCost;
        breakdown += `<li><strong>Locations (${selectedLocations.length}):</strong> ${formatUSD(locationCost)}</li>`;

        // Calculate service costs
        const servicePrices = {
            'hanbok': 19,
            'fireworks': 15,
            'souvenir': 15,
            'postcard': 5,
            'instagram': 10,
            'picnic': 30,
            'video-editing': 50
        };

        let serviceCost = 0;
        selectedServices.forEach(service => {
            const price = servicePrices[service] || 0;
            serviceCost += price;
            breakdown += `<li><strong>${getServiceName(service)}:</strong> ${formatUSD(price)}</li>`;
        });

        if (serviceCost > 0) {
            totalCost += serviceCost;
            breakdown += `<li><strong>Total Services:</strong> ${formatUSD(serviceCost)}</li>`;
        }

        breakdown += '</ul>';
        breakdown += '<p><em>Note: Lunch and evening options are self-covered by customers and priced in USD.</em></p>';

        costBreakdownContent.innerHTML = breakdown;
        totalCostElement.textContent = formatUSD(totalCost);
    }

    function getServiceName(service) {
        const serviceNames = {
            'hanbok': 'Hanbok rental',
            'fireworks': 'Mini fireworks set',
            'souvenir': 'Chill Busan souvenir gift',
            'postcard': 'Postcard from Busan',
            'instagram': 'Instagram reel/video help',
            'picnic': 'Sunset picnic setup',
            'video-editing': 'Full video editing of the tour'
        };
        return serviceNames[service] || service;
    }

    function generateDetailedSummary() {
        const selectedLocations = Array.from(locationOptions)
            .filter(option => option.checked)
            .map(option => option.value);

        if (selectedLocations.length < 4) {
            alert('Please select at least 4 locations to generate a detailed summary.');
            return;
        }

        if (selectedLocations.length > 5) {
            alert('Please select maximum 5 locations for your tour.');
            return;
        }

        const selectedLunch = Array.from(lunchOptions)
            .filter(option => option.checked)
            .map(option => option.value)[0];

        const selectedServices = Array.from(serviceOptions)
            .filter(option => option.checked)
            .map(option => option.value);

        const selectedEvening = Array.from(eveningOptions)
            .filter(option => option.checked)
            .map(option => option.value)[0];

        let detailedSummary = '<div class="detailed-summary">';
        detailedSummary += '<h4>🌟 Your Personalized Busan Experience</h4>';
        
        // Generate suggested itinerary based on locations
        detailedSummary += '<h5>📋 Your Itinerary:</h5>';
        detailedSummary += '<ul>';

        const locationDescriptions = {
            'gamcheon': '🏘️ Gamcheon Culture Village - Explore the colorful artistic district with murals and cafes',
            'gwangalli': '🌉 Gwangalli Beach & Bridge - Famous bridge with stunning night views',
            'haeundae': '🏖️ Haeundae Beach - Busan\'s most famous beach with luxury hotels',
            'oryukdo': '🏝️ Oryukdo Island and Skywalk - Glass skywalk over the ocean',
            'haedong': '🛕 Haedong Yonggungsa Temple - Beautiful seaside temple',
            'hwamyeong': '🌲 Hwamyeong Eco Park - Mountain park with night city views',
            'songdo': '🚠 Songdo Beach + Cable Car - Premium beach with cable car experience',
            'blueline': '🚂 Blue Line Park - Premium capsule train along the coast',
            'jagalchi': '🐟 Jagalchi Fish Market - Famous fish market with fresh seafood',
            'dadaepo': '🌅 Dadaepo Beach + Sunset - Perfect spot for sunset views'
        };

        selectedLocations.forEach(location => {
            detailedSummary += `<li>${locationDescriptions[location] || location}</li>`;
        });

        detailedSummary += '</ul>';

        // Add tour details
        detailedSummary += '<h5>📊 Tour Details:</h5>';
        detailedSummary += `<p><strong>Duration:</strong> ${selectedLocations.length} hours (1 hour per location)</p>`;
        detailedSummary += `<p><strong>Transportation:</strong> Private car with English-speaking guide</p>`;
        detailedSummary += `<p><strong>Included:</strong> Hotel pickup/drop-off, entrance fees, water & snacks</p>`;

        if (selectedLunch) {
            detailedSummary += `<h5>🍽️ Lunch Option:</h5>`;
            detailedSummary += `<p>${getLunchDescription(selectedLunch)}</p>`;
        }

        if (selectedServices.length > 0) {
            detailedSummary += `<h5>🎁 Extra Services:</h5>`;
            detailedSummary += '<ul>';
            selectedServices.forEach(service => {
                detailedSummary += `<li>${getServiceDescription(service)}</li>`;
            });
            detailedSummary += '</ul>';
        }

        if (selectedEvening) {
            detailedSummary += `<h5>🌙 Evening Option:</h5>`;
            detailedSummary += `<p>${getEveningDescription(selectedEvening)}</p>`;
        }

        detailedSummary += '<p class="summary-note">💡 <strong>Note:</strong> This is your personalized itinerary. Your guide will optimize the route for the best experience.</p>';
        detailedSummary += `<p class="usd-note">${USD_NOTE_TEXT}</p>`;
        detailedSummary += '</div>';

        tourSummaryContent.innerHTML = detailedSummary;

        // Scroll to summary
        tourSummaryContent.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function getLunchDescription(lunch) {
        const lunchDescriptions = {
            'geumsubokguk': 'Geumsubokguk (금수복국) - Traditional Korean restaurant',
            'obok': 'Obok Restaurant (오복미역) - Local Korean cuisine',
            'ashley': 'Ashley Queens Buffet - International buffet with Korean options',
            'haeundae-market': 'Haeundae Traditional Market Food Alley - Local street food experience',
            'baekhwa': 'Baekhwa-jumak (백화주막) - Traditional Korean dining',
            'haeundae-bbq': 'Haeundae BBQ - Korean barbecue experience'
        };
        return lunchDescriptions[lunch] || lunch;
    }

    function getServiceDescription(service) {
        const serviceDescriptions = {
            'hanbok': '👘 Hanbok rental - Traditional Korean clothing for photos',
            'fireworks': '🎆 Mini fireworks set - Beachside fireworks display',
            'souvenir': '🎁 Chill Busan souvenir gift - Special memento from your tour',
            'postcard': '📮 Postcard from Busan - Handwritten postcard sent to your home',
            'instagram': '📸 Instagram reel/video help - Professional social media content',
            'picnic': '🧺 Sunset picnic setup - Romantic beachside picnic',
            'video-editing': '🎬 Full video editing of the tour - 1-2 minute recap video',
            'sunset-sips': '🍹 Sunset Sips - Local beer or cocktail with beachside view'
        };
        return serviceDescriptions[service] || service;
    }

    function getEveningDescription(evening) {
        const eveningDescriptions = {
            'fingers-chat': '🍸 Fingers & Chat - Local bar with a cozy atmosphere',
            'sky-lounge': '🏢 Sky Lounge @ LCT Tower (SIGNIEL Hotel) - Rooftop bar with stunning views',
            'waveon': '☕ Waveon Coffee Rooftop - Coffee shop with a beautiful rooftop view',
            'bay101': '🍸 The Bay 101 Lounge Bar - Popular rooftop bar with a great view',
            'maison': '🍸 Maison de la Cité - French restaurant with a rooftop view',
            'cielo': '🍝 Cielo Italian restaurant - Italian restaurant with a rooftop view'
        };
        return eveningDescriptions[evening] || evening;
    }

    async function contactAboutCustomTour() {
        const selectedLocations = Array.from(locationOptions)
            .filter(option => option.checked)
            .map(option => option.value);

        if (selectedLocations.length < 4) {
            alert('Please select at least 4 locations before contacting us.');
            return;
        }

        if (selectedLocations.length > 5) {
            alert('Please select maximum 5 locations for your tour.');
            return;
        }

        const selectedLunch = Array.from(lunchOptions)
            .filter(option => option.checked)
            .map(option => option.value)[0];

        const selectedServices = Array.from(serviceOptions)
            .filter(option => option.checked)
            .map(option => option.value);

        const selectedEvening = Array.from(eveningOptions)
            .filter(option => option.checked)
            .map(option => option.value)[0];

        // Calculate total cost
        const locationCost = selectedLocations.length * LOCATION_PRICE;
        const servicePrices = {
            'hanbok': 19, 'fireworks': 15, 'souvenir': 15, 'postcard': 5,
            'instagram': 10, 'picnic': 30, 'video-editing': 50
        };
        const serviceCost = selectedServices.reduce((total, service) => total + (servicePrices[service] || 0), 0);
        const totalCost = locationCost + serviceCost;

        // Collect customer information
        const customerName = prompt('Please enter your name:');
        if (!customerName) {
            alert('Name is required to complete booking.');
            return;
        }

        const customerEmail = prompt('Please enter your email:');
        if (!customerEmail || !customerEmail.includes('@')) {
            alert('Valid email is required to complete booking.');
            return;
        }

        const tourDate = prompt('Please enter your preferred tour date (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
        if (!tourDate) {
            alert('Tour date is required.');
            return;
        }

        const startTime = prompt('Please enter your preferred start time (HH:MM):', '09:00');
        if (!startTime) {
            alert('Start time is required.');
            return;
        }

        const numberOfGuests = parseInt(prompt('Number of guests:', '1')) || 1;

        const customerPhone = prompt('Please enter your phone number (optional):', '');
        
        // Check if user is authenticated and has discount available
        let userId = null;
        let hasDiscount = false;
        let discountAmount = 0;
        let finalTotal = totalCost;

        try {
            // Use the global auth state if available, otherwise check directly
            if (currentUser) {
                userId = currentUser.id;
                const discountStatus = await getDiscountStatus();
                if (discountStatus.hasDiscount) {
                    hasDiscount = true;
                    discountAmount = totalCost * 0.1; // 10% discount
                    finalTotal = totalCost - discountAmount;
                }
            } else if (typeof window.supabaseAuth !== 'undefined') {
                const { user } = await window.supabaseAuth.getCurrentUser();
                if (user) {
                    userId = user.id;
                    currentUser = user; // Update global state
                    const discountStatus = await window.supabaseAuth.getUserDiscountStatus(user.id);
                    if (discountStatus.hasDiscount) {
                        hasDiscount = true;
                        discountAmount = totalCost * 0.1; // 10% discount
                        finalTotal = totalCost - discountAmount;
                    }
                }
            }
        } catch (error) {
            console.log('Could not check discount status:', error);
        }
        
        // Build confirmation message with discount info
        let confirmationMessage = `Confirm Booking?\n\nName: ${customerName}\nEmail: ${customerEmail}\n${customerPhone ? `Phone: ${customerPhone}\n` : ''}Tour Date: ${tourDate}\nStart Time: ${startTime}\nGuests: ${numberOfGuests}\n`;
        
        if (hasDiscount) {
            confirmationMessage += `\n🎉 Welcome Discount Applied: -10% (${formatUSD(discountAmount)})\nOriginal: ${formatUSD(totalCost)}\n`;
        }
        
        confirmationMessage += `Total Cost: ${formatUSD(finalTotal)}\n\nClick OK to confirm and receive your PDF confirmation.`;
        
        if (!confirm(confirmationMessage)) {
            return;
        }

        // Prepare booking data for createBooking API
        // Ensure all values are properly formatted
        const addons = [
            ...(selectedLunch ? [`Lunch: ${getLocationName(selectedLunch)}`] : []),
            ...selectedServices.map(s => getServiceName(s)),
            ...(selectedEvening ? [`Evening: ${getLocationName(selectedEvening)}`] : [])
        ];

        // Normalize date to YYYY-MM-DD format (remove any time data)
        const normalizedDate = tourDate.trim().slice(0, 10);

        const bookingData = {
            name: customerName.trim(),
            email: customerEmail.trim(),
            phone: (customerPhone || '').trim(),
            tour: 'Custom Tour',
            date: normalizedDate,
            people: Number(numberOfGuests), // Ensure it's a number
            addons: addons, // Array will be converted to string in API
            totalPrice: Number(finalTotal), // Final total after discount
            userId: userId, // User ID if authenticated
            applyDiscount: hasDiscount // Whether to apply discount
        };

        // Show loading message
        const loadingMsg = document.createElement('div');
        loadingMsg.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); z-index: 10000; text-align: center; min-width: 250px;';
        loadingMsg.innerHTML = '<div style="margin-bottom: 15px;"><i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #4A90E2;"></i></div><p style="margin: 0; font-weight: 600;">Processing your booking...</p><p style="margin: 5px 0 0 0; font-size: 0.9rem; color: #666;">Please wait...</p>';
        document.body.appendChild(loadingMsg);

        // Send booking to createBooking API
        try {
            if (typeof createBooking !== 'undefined') {
                const result = await createBooking(bookingData);
                
                // Remove loading message
                if (loadingMsg.parentNode) {
                    document.body.removeChild(loadingMsg);
                }

                // Show success message
                const successMsg = document.createElement('div');
                successMsg.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); z-index: 10000; text-align: center; min-width: 300px; max-width: 400px;';
                successMsg.innerHTML = `
                    <div style="margin-bottom: 15px; color: #27ae60; font-size: 3rem;">✓</div>
                    <h3 style="margin: 0 0 10px 0; color: #2c3e50;">Booking Confirmed!</h3>
                    <p style="margin: 5px 0; color: #34495e;"><strong>Booking ID:</strong> ${result.bookingId}</p>
                    <p style="margin: 10px 0; color: #34495e; font-size: 0.9rem;">A confirmation email with PDF has been sent to:</p>
                    <p style="margin: 5px 0; color: #4A90E2; font-weight: 600;">${customerEmail}</p>
                    <p style="margin: 15px 0 0 0; color: #7f8c8d; font-size: 0.85rem;">Please check your inbox.</p>
                    <button onclick="this.parentElement.remove()" style="margin-top: 20px; padding: 10px 20px; background: #4A90E2; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: 600;">Close</button>
                `;
                document.body.appendChild(successMsg);
                
                // Auto-remove success message after 10 seconds
                setTimeout(() => {
                    if (successMsg.parentNode) {
                        document.body.removeChild(successMsg);
                    }
                }, 10000);
                
                // Show success animation
                showSuccessAnimation();
            } else {
                throw new Error('Booking API not loaded. Please refresh the page and try again.');
            }
        } catch (error) {
            console.error('Error creating booking:', error);
            
            // Remove loading message
            if (loadingMsg.parentNode) {
                document.body.removeChild(loadingMsg);
            }
            
            // Show error message (DO NOT open email client)
            const errorMsg = document.createElement('div');
            errorMsg.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); z-index: 10000; text-align: center; min-width: 300px; max-width: 400px;';
            errorMsg.innerHTML = `
                <div style="margin-bottom: 15px; color: #e74c3c; font-size: 3rem;">✗</div>
                <h3 style="margin: 0 0 10px 0; color: #2c3e50;">Booking Failed</h3>
                <p style="margin: 10px 0; color: #34495e;">${error.message || 'Failed to create booking. Please try again.'}</p>
                <p style="margin: 15px 0 0 0; color: #7f8c8d; font-size: 0.85rem;">If the problem persists, please contact us directly.</p>
                <button onclick="this.parentElement.remove()" style="margin-top: 20px; padding: 10px 20px; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: 600;">Close</button>
            `;
            document.body.appendChild(errorMsg);
            
            // Auto-remove error message after 10 seconds
            setTimeout(() => {
                if (errorMsg.parentNode) {
                    document.body.removeChild(errorMsg);
                }
            }, 10000);
        }
    }

    function showSuccessAnimation() {
        // Create animation container
        const animationContainer = document.createElement('div');
        animationContainer.className = 'success-animation-container';
        animationContainer.innerHTML = `
            <div class="success-animation">
                <div class="plane">
                    <i class="fas fa-paper-plane"></i>
                </div>
                <div class="message">
                    <h3>🎉 Tour Inquiry Sent!</h3>
                    <p>Your custom tour request has been sent successfully!</p>
                    <p>We'll get back to you soon to discuss your perfect Busan adventure.</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(animationContainer);

        // Remove animation after 4 seconds
        setTimeout(() => {
            if (animationContainer.parentNode) {
                animationContainer.parentNode.removeChild(animationContainer);
            }
        }, 4000);
    }

    function getLocationName(location) {
        const locationNames = {
            'gamcheon': 'Gamcheon Culture Village',
            'gwangalli': 'Gwangalli Beach & Bridge',
            'haeundae': 'Haeundae Beach',
            'oryukdo': 'Oryukdo Island and Skywalk',
            'haedong': 'Haedong Yonggungsa Temple',
            'hwamyeong': 'Hwamyeong Eco Park',
            'songdo': 'Songdo Beach + Cable Car',
            'blueline': 'Blue Line Park (Capsule train)',
            'jagalchi': 'Jagalchi Fish Market',
            'dadaepo': 'Dadaepo Beach + Sunset'
        };
        return locationNames[location] || location;
    }

    // Initialize tour summary
    updateTourSummary();
}); 

// Video Background Controls
function initVideoBackground() {
    const videoContainers = document.querySelectorAll('.video-container');
    let currentVideoIndex = 0;

    function switchVideo(index) {
        // Remove active class from current video
        videoContainers[currentVideoIndex].classList.remove('active');

        // Update current index
        currentVideoIndex = index;

        // Add active class to new video
        videoContainers[currentVideoIndex].classList.add('active');
    }

    function nextVideo() {
        let nextIndex = (currentVideoIndex + 1) % videoContainers.length;
        switchVideo(nextIndex);
    }

    // Auto-play functionality
    setInterval(nextVideo, 8000); // Switch every 8 seconds
}

// Initialize video background when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initVideoBackground();
    
    // Add mobile scroll indicator for custom tour section
    if (isMobile()) {
        addMobileScrollIndicator();
        ensureCustomTourVisible();
        
        // Emergency: Create custom tour section if it doesn't exist
        setTimeout(() => {
            createEmergencyCustomTourSection();
        }, 2000);
    }
});

// Mobile scroll indicator for custom tour section
function addMobileScrollIndicator() {
    const customTourSection = document.getElementById('custom-tour');
    if (!customTourSection) return;
    
    // Create scroll indicator
    const indicator = document.createElement('div');
    indicator.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #4A90E2;
        color: white;
        padding: 15px 20px;
        border-radius: 50px;
        font-size: 14px;
        font-weight: bold;
        z-index: 1000;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 8px;
    `;
    indicator.innerHTML = '🎨 Custom Tour';
    
    // Add click handler to scroll to custom tour
    indicator.addEventListener('click', () => {
        customTourSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    });
    
    // Add hover effect
    indicator.addEventListener('mouseenter', () => {
        indicator.style.transform = 'scale(1.05)';
        indicator.style.background = '#65C7D0';
    });
    
    indicator.addEventListener('mouseleave', () => {
        indicator.style.transform = 'scale(1)';
        indicator.style.background = '#4A90E2';
    });
    
    // Add to page
    document.body.appendChild(indicator);
    
    // Hide indicator when user reaches custom tour section
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                indicator.style.display = 'none';
            } else {
                indicator.style.display = 'flex';
            }
        });
    }, { threshold: 0.5 });
    
    observer.observe(customTourSection);
}

// Ensure custom tour section is visible on mobile
function ensureCustomTourVisible() {
    const customTourSection = document.getElementById('custom-tour');
    // Custom tour section found
    if (!customTourSection) {
        // ERROR: Custom tour section not found
        // Try to find it by class name
        const customTourByClass = document.querySelector('.custom-tour');
        // Custom tour by class found
        return;
    }
    
    // Force visibility
    customTourSection.style.display = 'block';
    customTourSection.style.visibility = 'visible';
    customTourSection.style.opacity = '1';
    customTourSection.style.minHeight = '90vh';
    customTourSection.style.padding = '60px 15px';
    customTourSection.style.background = 'linear-gradient(135deg, #4A90E2 0%, #65C7D0 100%)';
    
    // Ensure all child elements are visible
    const children = customTourSection.querySelectorAll('*');
    children.forEach(child => {
        child.style.display = 'block';
        child.style.visibility = 'visible';
        child.style.opacity = '1';
    });
    
    // Make sure the title and intro are visible
    const title = customTourSection.querySelector('h2');
    if (title) {
        title.style.color = 'white';
        title.style.textShadow = '2px 2px 4px rgba(0,0,0,0.3)';
        title.style.fontSize = '2.5rem';
    }
    
    const intro = customTourSection.querySelector('.section-intro');
    if (intro) {
        intro.style.color = 'white';
        intro.style.textShadow = '1px 1px 2px rgba(0,0,0,0.3)';
        intro.style.fontSize = '1.3rem';
    }
    
    // Make sure the tour builder is visible
    const tourBuilder = customTourSection.querySelector('.tour-builder');
    if (tourBuilder) {
        tourBuilder.style.background = 'white';
        tourBuilder.style.borderRadius = '20px';
        tourBuilder.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
        tourBuilder.style.padding = '25px';
    }
    
    // Custom tour section visibility enforced for mobile
}

// Emergency function to create custom tour section if it doesn't exist
function createEmergencyCustomTourSection() {
    const existingSection = document.getElementById('custom-tour');
    if (existingSection) {
        // Custom tour section already exists
        return;
    }
    
    // Creating emergency custom tour section
    
    // Find a good place to insert the section (after tours section)
    const toursSection = document.getElementById('tours');
    if (!toursSection) {
        // Tours section not found, inserting at end of body
        insertCustomTourAtEnd();
        return;
    }
    
    // Create the custom tour section
    const customTourSection = document.createElement('section');
    customTourSection.id = 'custom-tour';
    customTourSection.className = 'custom-tour section';
    customTourSection.innerHTML = `
        <h2>🎨 Build Your Perfect Tour</h2>
        <p class="section-intro">Create your own personalized Busan experience! Choose up to 5 locations and customize your tour with lunch and extra services.</p>
        
        <div class="custom-tour-container">
            <div class="tour-builder">
                <div class="builder-step">
                    <h3>Step 1: Choose Your Locations (4-5 locations, $50 each)</h3>
                    <div class="location-options">
                        <label class="location-option">
                            <input type="checkbox" name="locations" value="gamcheon" data-price="50">
                            <span class="option-content">
                                <i class="fas fa-mountain"></i>
                                <span>Gamcheon Culture Village</span>
                                <span class="price">$50</span>
                            </span>
                        </label>
                        <label class="location-option">
                            <input type="checkbox" name="locations" value="gwangalli" data-price="50">
                            <span class="option-content">
                                <i class="fas fa-bridge"></i>
                                <span>Gwangalli Beach & Bridge</span>
                                <span class="price">$50</span>
                            </span>
                        </label>
                        <label class="location-option">
                            <input type="checkbox" name="locations" value="haeundae" data-price="50">
                            <span class="option-content">
                                <i class="fas fa-umbrella-beach"></i>
                                <span>Haeundae Beach</span>
                                <span class="price">$50</span>
                            </span>
                        </label>
                    </div>
                </div>
                
                <div class="tour-summary">
                    <h3>Your Custom Tour Summary</h3>
                    <div id="tour-summary-content">
                        <p>Select your locations above to see your personalized tour summary.</p>
                    </div>
                    <div class="cost-calculator">
                        <div class="total-cost">
                            <h4>💳 Total Cost</h4>
                            <div id="total-cost">$0.00</div>
                            <p class="usd-note">All prices are listed in USD for international travelers.</p>
                        </div>
                    </div>
                    <div class="summary-actions">
                        <button class="contact-button" onclick="alert('Contact us at theofficialali05@gmail.com to book your custom tour!')">Contact Us About This Tour</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Insert after tours section
    toursSection.parentNode.insertBefore(customTourSection, toursSection.nextSibling);
    
    // Apply mobile styles
    if (isMobile()) {
        customTourSection.style.cssText = `
            padding: 60px 15px !important;
            min-height: 90vh !important;
            background: linear-gradient(135deg, #4A90E2 0%, #65C7D0 100%) !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
        `;
        
        const title = customTourSection.querySelector('h2');
        if (title) {
            title.style.cssText = `
                font-size: 2.5rem !important;
                color: white !important;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3) !important;
                text-align: center !important;
            `;
        }
        
        const intro = customTourSection.querySelector('.section-intro');
        if (intro) {
            intro.style.cssText = `
                color: white !important;
                font-size: 1.3rem !important;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.3) !important;
                text-align: center !important;
            `;
        }
        
        const tourBuilder = customTourSection.querySelector('.tour-builder');
        if (tourBuilder) {
            tourBuilder.style.cssText = `
                background: white !important;
                border-radius: 20px !important;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2) !important;
                padding: 25px !important;
                margin: 20px auto !important;
                max-width: 90% !important;
            `;
        }
    }
    
    // Emergency custom tour section created successfully
}

function insertCustomTourAtEnd() {
    const customTourSection = document.createElement('section');
    customTourSection.id = 'custom-tour';
    customTourSection.className = 'custom-tour section';
    customTourSection.innerHTML = `
        <h2>🎨 Build Your Perfect Tour</h2>
        <p class="section-intro">Create your own personalized Busan experience!</p>
        <div style="text-align: center; padding: 40px;">
            <p style="font-size: 1.2rem; color: white; margin-bottom: 30px;">Contact us to create your custom tour!</p>
            <a href="mailto:theofficialali05@gmail.com" style="background: white; color: #4A90E2; padding: 15px 30px; border-radius: 25px; text-decoration: none; font-weight: bold; display: inline-block;">Email Us</a>
        </div>
    `;
    
    if (isMobile()) {
        customTourSection.style.cssText = `
            padding: 60px 15px !important;
            min-height: 90vh !important;
            background: linear-gradient(135deg, #4A90E2 0%, #65C7D0 100%) !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
        `;
    }
    
    document.body.appendChild(customTourSection);
} 