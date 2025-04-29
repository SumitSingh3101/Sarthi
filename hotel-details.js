// Get hotel ID from URL
const urlParams = new URLSearchParams(window.location.search);
const hotelId = urlParams.get('id');
let currentHotel = null;

// DOM Elements
const hotelName = document.getElementById('hotel-name');
const hotelRating = document.getElementById('hotel-rating');
const hotelAddress = document.getElementById('hotel-address');
const amenitiesList = document.getElementById('amenities-list');
const roomTypes = document.getElementById('room-types');
const contactNumber = document.getElementById('contact-number');
const websiteLink = document.getElementById('website-link');
const mainImage = document.getElementById('main-image');
const galleryThumbs = document.getElementById('gallery-thumbs');
const bookingForm = document.getElementById('booking-form');
const checkInInput = document.getElementById('check-in');
const checkOutInput = document.getElementById('check-out');
const guestsInput = document.getElementById('guests');
const roomTypeSelect = document.getElementById('room-type');
const priceSummary = document.getElementById('price-summary');

// Chatbot functionality
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-message');
const sendButton = document.getElementById('send-message');
const openChatBtn = document.getElementById('open-chat');
const closeChatBtn = document.getElementById('close-chat');
const chatContainer = document.getElementById('chatbot-container');

// Helper functions
function generateBookingId() {
    return 'BK-' + Date.now().toString(36).toUpperCase() + 
           Math.random().toString(36).substring(2, 5).toUpperCase();
}

function formatCurrency(amount) {
    return '₹' + Math.round(amount).toLocaleString('en-IN');
}

// Set minimum dates for check-in and check-out
function initializeDateInputs() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const formatDate = (date) => date.toISOString().split('T')[0];

    checkInInput.min = formatDate(today);
    checkInInput.value = formatDate(today);
    checkOutInput.min = formatDate(tomorrow);
    checkOutInput.value = formatDate(tomorrow);
}

// Load hotel images
function loadHotelImages(city) {
    if (mainImage) {
        mainImage.src = `https://source.unsplash.com/random/800x600/?hotel,${city}`;
        mainImage.alt = `${currentHotel["Hotel Name"]} Main Image`;
    }

    if (galleryThumbs) {
        galleryThumbs.innerHTML = '';
        for (let i = 0; i < 4; i++) {
            const thumb = document.createElement('img');
            thumb.src = `https://source.unsplash.com/random/150x150/?hotel,${city},${i}`;
            thumb.alt = `${currentHotel["Hotel Name"]} Image ${i + 1}`;
            thumb.addEventListener('click', () => {
                if (mainImage) {
                    mainImage.src = thumb.src.replace('150x150', '800x600');
                }
            });
            galleryThumbs.appendChild(thumb);
        }
    }
}

// Load hotel data
async function loadHotelData() {
    try {
        const response = await fetch('indian_city_hotels_5000plus.json');
        if (!response.ok) {
            throw new Error('Failed to fetch hotel data');
        }

        const hotels = await response.json();
        if (!hotels || !Array.isArray(hotels)) {
            throw new Error('Invalid hotel data format');
        }

        currentHotel = hotels[parseInt(hotelId)];
        if (!currentHotel) {
            throw new Error('Hotel not found');
        }

        // Update page content
        document.title = `${currentHotel["Hotel Name"]} - Sarthi`;
        
        if (hotelName) hotelName.textContent = currentHotel["Hotel Name"];
        
        if (hotelRating) {
            hotelRating.innerHTML = `
                <i class="ri-star-fill"></i>
                <span>${currentHotel["Rating"] || '4.5'}</span>
            `;
        }
        
        if (hotelAddress) {
            hotelAddress.innerHTML = `
                <i class="ri-map-pin-line"></i>
                ${currentHotel["Address"]}
            `;
        }

        // Load hotel images
        loadHotelImages(currentHotel["City"]);

        // Load amenities
        if (amenitiesList && currentHotel["Amenities"]) {
            const amenities = currentHotel["Amenities"].split(", ");
            amenitiesList.innerHTML = amenities.map(amenity => `
                <div class="amenity-item">
                    <i class="ri-check-line"></i>
                    <span>${amenity}</span>
                </div>
            `).join('');
        }

        // Load room types with different price points
        if (roomTypeSelect && currentHotel["Price per Night"]) {
            const basePrice = parseInt(currentHotel["Price per Night"]);
            const rooms = [
                { type: "Deluxe Room", price: basePrice },
                { type: "Premium Room", price: Math.round(basePrice * 1.2) },
                { type: "Suite", price: Math.round(basePrice * 1.5) },
                { type: "Executive Suite", price: Math.round(basePrice * 2) }
            ];

            roomTypeSelect.innerHTML = rooms.map(room => `
                <option value="${room.type}" data-price="${room.price}">
                    ${room.type} - ${formatCurrency(room.price)}/night
                </option>
            `).join('');
        }

        // Update contact information
        if (contactNumber && currentHotel["Contact Number"]) {
            contactNumber.innerHTML = `
                <i class="ri-phone-line"></i>
                <a href="tel:${currentHotel["Contact Number"]}">${currentHotel["Contact Number"]}</a>
            `;
        }

        if (websiteLink) {
            if (currentHotel["Website"]) {
                websiteLink.href = currentHotel["Website"];
                websiteLink.style.display = 'inline-block';
            } else {
                websiteLink.style.display = 'none';
            }
        }

        // Initialize price summary
        updatePriceSummary();

    } catch (error) {
        console.error('Error loading hotel data:', error);
        document.querySelector('.hotel-details').innerHTML = `
            <div class="error">
                <h3>Error Loading Hotel Data</h3>
                <p>${error.message}</p>
                <a href="index.html" class="book-btn">Return to Home</a>
            </div>
        `;
    }
}

// Update price summary
function updatePriceSummary() {
    if (!priceSummary || !roomTypeSelect || !checkInInput || !checkOutInput || !guestsInput) return;

    const checkIn = new Date(checkInInput.value);
    const checkOut = new Date(checkOutInput.value);
    const selectedOption = roomTypeSelect.options[roomTypeSelect.selectedIndex];
    const basePrice = selectedOption ? parseFloat(selectedOption.dataset.price) : 500;
    const guests = parseInt(guestsInput.value) || 1;
    
    if (checkIn && checkOut && checkOut > checkIn) {
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        const subtotal = basePrice * nights;
        const guestCharge = guests > 2 ? (guests - 2) * (basePrice * 0.2) * nights : 0;
        const tax = (subtotal + guestCharge) * 0.18;
        const total = subtotal + guestCharge + tax;

        priceSummary.innerHTML = `
            <h3>Price Details</h3>
            <div class="price-breakdown">
                <div class="price-row">
                    <span>Base Price (${nights} nights)</span>
                    <span>${formatCurrency(subtotal)}</span>
                </div>
                ${guestCharge > 0 ? `
                <div class="price-row">
                    <span>Extra Guest Charge</span>
                    <span>${formatCurrency(guestCharge)}</span>
                </div>` : ''}
                <div class="price-row">
                    <span>Tax (18%)</span>
                    <span>${formatCurrency(tax)}</span>
                </div>
                <div class="price-row total">
                    <strong>Total Amount</strong>
                    <strong>${formatCurrency(total)}</strong>
                </div>
            </div>
        `;
    } else {
        priceSummary.innerHTML = '<p class="error">Please select valid dates to see price details.</p>';
    }
}

// Initialize form submission
function setupEventListeners() {
    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) {
        bookingForm.addEventListener('submit', handleBookingSubmission);
    }

    // Initialize date inputs
    initializeDateInputs();

    // Initialize price summary
    updatePriceSummary();
}

// Print receipt function
function printReceipt() {
    const receipt = document.querySelector('.receipt');
    if (!receipt) {
        alert('Receipt not found');
        return;
    }

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Booking Receipt - ${currentHotel["Hotel Name"]}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    color: #333;
                }
                .receipt {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                }
                .receipt-header {
                    text-align: center;
                    margin-bottom: 20px;
                    border-bottom: 2px solid #1a73e8;
                    padding-bottom: 20px;
                }
                .receipt-header h2 {
                    color: #1a73e8;
                    margin: 0;
                }
                .receipt-id {
                    font-weight: bold;
                    margin: 10px 0;
                }
                .receipt-date {
                    color: #666;
                }
                .receipt-hotel-info {
                    margin: 20px 0;
                }
                .receipt-hotel-info h3 {
                    margin: 0 0 10px 0;
                    color: #1a73e8;
                }
                .receipt-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }
                .receipt-table td {
                    padding: 8px;
                    border-bottom: 1px solid #ddd;
                }
                .receipt-table tr:last-child td {
                    border-bottom: none;
                }
                .total-row {
                    font-weight: bold;
                    background-color: #f5f5f5;
                }
                .receipt-footer {
                    margin-top: 30px;
                    text-align: center;
                    border-top: 1px solid #ddd;
                    padding-top: 20px;
                }
                .receipt-terms {
                    font-size: 12px;
                    color: #666;
                    margin: 10px 0;
                }
                .receipt-contact {
                    margin-top: 20px;
                    font-size: 14px;
                }
                @media print {
                    body {
                        margin: 0;
                        padding: 0;
                    }
                    .receipt {
                        border: none;
                        padding: 0;
                    }
                    .no-print {
                        display: none;
                    }
                }
            </style>
        </head>
        <body>
            ${receipt.outerHTML}
            <div class="no-print" style="text-align: center; margin-top: 20px;">
                <button onclick="window.print()" style="padding: 10px 20px; background: #1a73e8; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Print Receipt
                </button>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// Handle booking submission
function handleBookingSubmission(e) {
    e.preventDefault();
    
    try {
        if (!currentHotel) {
            throw new Error('Hotel data not loaded');
        }

        // Get form values
        const form = e.target;
        const formData = new FormData(form);

        const checkIn = formData.get('check-in');
        const checkOut = formData.get('check-out');
        const guests = formData.get('guests');
        const roomType = formData.get('room-type');
        const specialRequests = formData.get('special-requests') || '';

        console.log('Form Data:', { checkIn, checkOut, guests, roomType, specialRequests });

        // Validate form values
        if (!checkIn || !checkOut || !guests || !roomType) {
            throw new Error('Please fill in all required fields');
        }

        // Get room price
        const roomTypeSelect = form.querySelector('#room-type');
        const selectedOption = roomTypeSelect.options[roomTypeSelect.selectedIndex];
        if (!selectedOption) {
            throw new Error('Please select a room type');
        }

        const roomPrice = parseFloat(selectedOption.dataset.price);
        if (isNaN(roomPrice)) {
            throw new Error('Invalid room price');
        }

        // Calculate prices
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
        const subtotal = roomPrice * nights;
        const guestCharge = parseInt(guests) > 2 ? (parseInt(guests) - 2) * (roomPrice * 0.2) * nights : 0;
        const tax = (subtotal + guestCharge) * 0.18;
        const total = subtotal + guestCharge + tax;

        // Format dates
        const formattedCheckIn = checkInDate.toLocaleDateString('en-IN', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        const formattedCheckOut = checkOutDate.toLocaleDateString('en-IN', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        // Generate booking ID
        const bookingId = 'BK-' + Date.now().toString(36).toUpperCase() + 
                         Math.random().toString(36).substring(2, 5).toUpperCase();

        // Create booking details object
        const bookingDetails = {
            bookingId,
            hotelName: currentHotel["Hotel Name"],
            hotelAddress: currentHotel["Address"],
            checkIn: formattedCheckIn,
            checkOut: formattedCheckOut,
            nights,
            guests: parseInt(guests),
            roomType,
            specialRequests,
            prices: {
                subtotal,
                guestCharge,
                tax,
                total
            }
        };

        console.log('Booking Details:', bookingDetails);

        // Generate receipt HTML
        const receiptHtml = `
            <div class="receipt">
                <div class="receipt-header">
                    <h2>SARTHI HOTELS</h2>
                    <p>Official Booking Receipt</p>
                    <div class="receipt-id">Booking ID: ${bookingDetails.bookingId}</div>
                    <div class="receipt-date">Date: ${new Date().toLocaleDateString('en-IN', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}</div>
                </div>
                
                <div class="receipt-hotel-info">
                    <h3>${bookingDetails.hotelName}</h3>
                    <p>${bookingDetails.hotelAddress}</p>
                </div>

                <div class="receipt-booking-details">
                    <h3>Booking Details</h3>
                    <table class="receipt-table">
                        <tr>
                            <td>Check-in:</td>
                            <td>${bookingDetails.checkIn}</td>
                        </tr>
                        <tr>
                            <td>Check-out:</td>
                            <td>${bookingDetails.checkOut}</td>
                        </tr>
                        <tr>
                            <td>Duration:</td>
                            <td>${bookingDetails.nights} Night(s)</td>
                        </tr>
                        <tr>
                            <td>Guests:</td>
                            <td>${bookingDetails.guests} Person(s)</td>
                        </tr>
                        <tr>
                            <td>Room Type:</td>
                            <td>${bookingDetails.roomType}</td>
                        </tr>
                    </table>
                </div>

                <div class="receipt-price-details">
                    <h3>Price Breakdown</h3>
                    <table class="receipt-table">
                        <tr>
                            <td>Base Price (${bookingDetails.nights} nights)</td>
                            <td>${formatCurrency(bookingDetails.prices.subtotal)}</td>
                        </tr>
                        ${bookingDetails.prices.guestCharge > 0 ? `
                        <tr>
                            <td>Extra Guest Charge</td>
                            <td>${formatCurrency(bookingDetails.prices.guestCharge)}</td>
                        </tr>
                        ` : ''}
                        <tr>
                            <td>Tax (18% GST)</td>
                            <td>${formatCurrency(bookingDetails.prices.tax)}</td>
                        </tr>
                        <tr class="total-row">
                            <td><strong>Total Amount</strong></td>
                            <td><strong>${formatCurrency(bookingDetails.prices.total)}</strong></td>
                        </tr>
                    </table>
                </div>

                ${bookingDetails.specialRequests ? `
                <div class="receipt-special-requests">
                    <h3>Special Requests</h3>
                    <p>${bookingDetails.specialRequests}</p>
                </div>
                ` : ''}

                <div class="receipt-footer">
                    <p>Thank you for choosing Sarthi Hotels!</p>
                    <p class="receipt-terms">This is a computer-generated receipt and does not require a physical signature.</p>
                    <div class="receipt-contact">
                        <p>For any queries, please contact:</p>
                        <p>Email: support@sarthihotels.com</p>
                        <p>Phone: ${currentHotel["Contact Number"] || 'N/A'}</p>
                    </div>
                </div>
            </div>
        `;

        // Update page content with receipt
        const hotelDetailsElement = document.querySelector('.hotel-details');
        if (!hotelDetailsElement) {
            throw new Error('Hotel details container not found');
        }

        // Clear the existing content
        hotelDetailsElement.innerHTML = '';

        // Create and append the booking confirmation
        const confirmationDiv = document.createElement('div');
        confirmationDiv.className = 'booking-confirmation';
        confirmationDiv.innerHTML = `
            <h2 class="confirmation-title">Booking Confirmed!</h2>
            <p class="confirmation-subtitle">Your booking has been successfully confirmed.</p>
            ${receiptHtml}
            <div class="confirmation-actions">
                <a href="index.html" class="book-btn">Return to Home</a>
                <button onclick="printReceipt()" class="book-btn secondary">Print Receipt</button>
            </div>
        `;

        hotelDetailsElement.appendChild(confirmationDiv);

        // Scroll to top of the page
        window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
        console.error('Error processing booking:', error);
        alert(error.message || 'There was an error processing your booking. Please try again.');
    }
}

// Initialize chatbot
function initializeChatbot() {
    if (openChatBtn) {
        openChatBtn.onclick = function() {
            if (chatContainer) {
                chatContainer.style.display = 'flex';
                setTimeout(() => {
                    chatContainer.classList.add('active');
                }, 10);
                // Add welcome message if chat is empty
                if (chatMessages && chatMessages.children.length === 0) {
                    addBotMessage("Hello! I can help you find the perfect room. You can ask me about:\n1. Room types and prices\n2. Available amenities\n3. Hotel location and facilities");
                }
            }
        };
    }

    if (closeChatBtn) {
        closeChatBtn.onclick = function() {
            if (chatContainer) {
                chatContainer.classList.remove('active');
                setTimeout(() => {
                    chatContainer.style.display = 'none';
                }, 300);
            }
        };
    }

    if (sendButton && userInput) {
        sendButton.onclick = handleUserMessage;
        userInput.onkeypress = function(e) {
            if (e.key === 'Enter') {
                handleUserMessage();
            }
        };
    }

    // Make sure chat is initially hidden
    if (chatContainer) {
        chatContainer.style.display = 'none';
    }
}

// Add bot message to chat
function addBotMessage(message) {
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';
    messageDiv.innerHTML = `<p>${message}</p>`;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Add user message to chat
function addUserMessage(message) {
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message';
    messageDiv.innerHTML = `<p>${message}</p>`;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Handle user message
function handleUserMessage() {
    if (!userInput || !userInput.value.trim()) return;

    const userMessage = userInput.value.trim();
    addUserMessage(userMessage);
    userInput.value = '';

    // Process user message
    const lowerMessage = userMessage.toLowerCase();

    // Handle room types and prices
    if (lowerMessage.includes('room') || lowerMessage.includes('price') || lowerMessage === '1') {
        showRoomInformation();
    }
    // Handle amenities
    else if (lowerMessage.includes('amenity') || lowerMessage.includes('amenities') || lowerMessage === '2') {
        showAmenities();
    }
    // Handle location and facilities
    else if (lowerMessage.includes('location') || lowerMessage.includes('facility') || lowerMessage === '3') {
        showLocationAndFacilities();
    }
    else {
        addBotMessage("I can help you with:\n1. Room types and prices\n2. Available amenities\n3. Hotel location and facilities\n\nPlease choose one of these options or ask a specific question.");
    }
}

// Show room information
function showRoomInformation() {
    if (!currentHotel || !roomTypeSelect) return;
    
    let roomInfo = "Available room types:\n";
    Array.from(roomTypeSelect.options).forEach(option => {
        roomInfo += `- ${option.text}\n`;
    });
    addBotMessage(roomInfo);
}

// Show amenities
function showAmenities() {
    if (!currentHotel || !currentHotel["Amenities"]) {
        addBotMessage("I'm sorry, I couldn't find the amenities information.");
        return;
    }

    const amenities = currentHotel["Amenities"].split(", ");
    let amenitiesMessage = "This hotel offers the following amenities:\n";
    amenities.forEach(amenity => {
        amenitiesMessage += `• ${amenity}\n`;
    });
    addBotMessage(amenitiesMessage);
}

// Show location and facilities
function showLocationAndFacilities() {
    if (!currentHotel) {
        addBotMessage("I'm sorry, I couldn't find the hotel information.");
        return;
    }

    const locationInfo = `The hotel is located at:\n${currentHotel["Address"]}\n${currentHotel["City"]}, ${currentHotel["State"]}`;
    addBotMessage(locationInfo);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (!hotelId) {
        document.querySelector('.hotel-details').innerHTML = `
            <div class="error">
                <h3>Error</h3>
                <p>No hotel ID provided</p>
                <a href="index.html" class="book-btn">Return to Home</a>
            </div>
        `;
        return;
    }

    initializeDateInputs();
    setupEventListeners();
    initializeChatbot();
});

// Load hotel data immediately
loadHotelData(); 