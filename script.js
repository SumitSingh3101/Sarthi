// DOM Elements
const searchInput = document.getElementById('search');
const citySelect = document.getElementById('city');
const priceRange = document.getElementById('price-range');
const minPriceDisplay = document.getElementById('min-price');
const maxPriceDisplay = document.getElementById('max-price');
const amenitiesContainer = document.getElementById('amenities');
const hotelsContainer = document.getElementById('hotels');
const chatBtn = document.getElementById('open-chat');
const closeChatBtn = document.getElementById('close-chat');
const chatContainer = document.getElementById('chatbot-container');
const chatMessages = document.getElementById('chat-messages');
const userMessageInput = document.getElementById('user-message');
const sendMessageBtn = document.getElementById('send-message');

// State
let selectedAmenities = [];
let maxPrice = 15000;
let hotelsData = [];

// Chatbot state
let chatState = {
    isFiltering: false,
    currentStep: 0,
    filters: {
        city: '',
        minPrice: 0,
        maxPrice: 15000,
        amenities: []
    }
};

// Chatbot conversation flow
const chatFlow = [
    {
        question: "Hello! I can help you find the perfect hotel. Would you like to start filtering hotels? (yes/no)",
        handler: (response) => {
            if (response.toLowerCase() === 'yes') {
                chatState.isFiltering = true;
                return {
                    nextStep: 1,
                    message: "Great! Let's start with the city. Which city are you looking to stay in?"
                };
            } else {
                return {
                    nextStep: 0,
                    message: "No problem! Let me know if you need help finding a hotel later."
                };
            }
        }
    },
    {
        question: "Which city are you looking to stay in?",
        handler: (response) => {
            const cities = [...new Set(hotelsData.map(hotel => hotel["City"]))];
            const city = cities.find(c => c.toLowerCase() === response.toLowerCase());
            if (city) {
                chatState.filters.city = city;
                citySelect.value = city;
                renderHotels();
                return {
                    nextStep: 2,
                    message: `Great choice! What's your maximum budget per night? (enter a number in ₹)`
                };
            } else {
                return {
                    nextStep: 1,
                    message: `Sorry, I couldn't find that city. Available cities are: ${cities.join(', ')}. Please try again.`
                };
            }
        }
    },
    {
        question: "What's your maximum budget per night?",
        handler: (response) => {
            const price = parseInt(response);
            if (price && price > 0) {
                chatState.filters.maxPrice = price;
                priceRange.value = price;
                maxPrice = price;
                maxPriceDisplay.textContent = `₹${price}`;
                renderHotels();
                return {
                    nextStep: 3,
                    message: "What amenities are you looking for? (e.g., Pool, Wi-Fi, Restaurant)"
                };
            } else {
                return {
                    nextStep: 2,
                    message: "Please enter a valid price (e.g., 5000)"
                };
            }
        }
    },
    {
        question: "What amenities are you looking for?",
        handler: (response) => {
            const requestedAmenities = response.split(',').map(a => a.trim().toLowerCase());
            const availableAmenities = [...new Set(
                hotelsData.flatMap(hotel => 
                    hotel["Amenities"].split(", ").map(a => a.trim().toLowerCase())
                )
            )];
            
            const validAmenities = requestedAmenities.filter(a => 
                availableAmenities.includes(a)
            );

            if (validAmenities.length > 0) {
                // Reset previous selections
                document.querySelectorAll('.amenity-btn').forEach(btn => {
                    btn.classList.remove('active');
                });

                // Select new amenities
                validAmenities.forEach(amenity => {
                    const button = Array.from(document.querySelectorAll('.amenity-btn'))
                        .find(btn => btn.textContent.toLowerCase() === amenity);
                    if (button) {
                        button.classList.add('active');
                        if (!selectedAmenities.includes(button.textContent)) {
                            selectedAmenities.push(button.textContent);
                        }
                    }
                });

                renderHotels();
                return {
                    nextStep: 4,
                    message: `I've found some hotels matching your criteria. Would you like to refine your search further? (yes/no)`
                };
            } else {
                return {
                    nextStep: 3,
                    message: `I couldn't find those amenities. Available amenities are: ${availableAmenities.join(', ')}. Please try again.`
                };
            }
        }
    },
    {
        question: "Would you like to refine your search further?",
        handler: (response) => {
            if (response.toLowerCase() === 'yes') {
                return {
                    nextStep: 1,
                    message: "Let's start over. Which city would you like to stay in?"
                };
            } else {
                chatState.isFiltering = false;
                return {
                    nextStep: 0,
                    message: "Great! You can click on any hotel to view more details and book. Let me know if you need anything else!"
                };
            }
        }
    }
];

const hotelImages = [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1025&q=80',
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1176&q=80',
    'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1174&q=80',
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
    'https://images.unsplash.com/photo-1561501900-3701fa6a0864?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
    'https://images.unsplash.com/photo-1564501049412-61c2a3083791?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1332&q=80'
];

const defaultHotelImage = 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80';

function getHotelImage(index) {
    return hotelImages[index % hotelImages.length];
}

function handleImageError(img) {
    img.onerror = null; // Prevent infinite loop
    img.src = defaultHotelImage;
}

// Fetch hotel data from JSON file
async function fetchHotelData() {
    try {
        if (!hotelsContainer) {
            throw new Error('Hotels container not found');
        }
        
        hotelsContainer.innerHTML = '<p class="loading">Loading hotel data...</p>';
        const response = await fetch('indian_city_hotels_5000plus.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!Array.isArray(data)) {
            throw new Error('Invalid data format: Expected an array of hotels');
        }
        
        if (data.length === 0) {
            throw new Error('No hotel data found');
        }
        
        // Validate required fields in the first hotel
        const firstHotel = data[0];
        const requiredFields = ['Hotel Name', 'City', 'State', 'Price per Night', 'Amenities'];
        const missingFields = requiredFields.filter(field => !(field in firstHotel));
        
        if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }
        
        hotelsData = data;
        init();
    } catch (error) {
        console.error('Error loading hotel data:', error);
        if (hotelsContainer) {
            hotelsContainer.innerHTML = `
                <div class="error">
                    <h3>Error Loading Data</h3>
                    <p>${error.message}</p>
                    <p>Please check if the JSON file exists and has the correct format.</p>
                </div>
            `;
        }
    }
}

// Initialize the app
function init() {
    if (!hotelsData.length) return;
    
    populateCities();
    populateAmenities();
    renderHotels();
    setupEventListeners();
}

// Populate cities dropdown
function populateCities() {
    if (!citySelect) return;
    
    const cities = [...new Set(hotelsData.map(hotel => hotel["City"]))].sort();
    citySelect.innerHTML = '<option value="">All Cities</option>';
    cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        citySelect.appendChild(option);
    });
}

// Populate amenities
function populateAmenities() {
    if (!amenitiesContainer) return;
    
    const amenities = [...new Set(
        hotelsData.flatMap(hotel => 
            hotel["Amenities"].split(", ").map(a => a.trim())
        )
    )].sort();
    
    amenitiesContainer.innerHTML = '';
    amenities.forEach(amenity => {
        const button = document.createElement('button');
        button.className = 'amenity-btn';
        button.textContent = amenity;
        button.addEventListener('click', () => toggleAmenity(amenity, button));
        amenitiesContainer.appendChild(button);
    });
}

// Toggle amenity selection
function toggleAmenity(amenity, button) {
    const index = selectedAmenities.indexOf(amenity);
    if (index === -1) {
        selectedAmenities.push(amenity);
        button.classList.add('active');
    } else {
        selectedAmenities.splice(index, 1);
        button.classList.remove('active');
    }
    renderHotels();
}

// Filter hotels based on search criteria
function filterHotels() {
    if (!hotelsData.length) return [];
    
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const selectedCity = citySelect ? citySelect.value : '';
    
    return hotelsData.filter(hotel => {
        const matchesSearch = 
            hotel["Hotel Name"].toLowerCase().includes(searchTerm) ||
            hotel["City"].toLowerCase().includes(searchTerm);
        const matchesCity = !selectedCity || hotel["City"] === selectedCity;
        const matchesPrice = hotel["Price per Night"] <= maxPrice;
        const matchesAmenities = 
            selectedAmenities.length === 0 ||
            selectedAmenities.every(amenity => 
                hotel["Amenities"].split(", ").includes(amenity)
            );
        
        return matchesSearch && matchesCity && matchesPrice && matchesAmenities;
    });
}

// Render hotels
function renderHotels() {
    if (!hotelsContainer) return;
    
    const filteredHotels = filterHotels();
    hotelsContainer.innerHTML = '';
    
    if (filteredHotels.length === 0) {
        hotelsContainer.innerHTML = '<p class="no-results">No hotels found matching your criteria.</p>';
        return;
    }
    
    filteredHotels.forEach((hotel, index) => {
        const card = document.createElement('div');
        card.className = 'hotel-card';
        
        const imageUrl = getHotelImage(index);
        
        card.innerHTML = `
            <div class="hotel-image-container">
                <img src="${imageUrl}" 
                     alt="${hotel["Hotel Name"]}" 
                     class="hotel-image"
                     loading="lazy"
                     onerror="handleImageError(this)">
            </div>
            <div class="hotel-content">
                <h2 class="hotel-name">${hotel["Hotel Name"]}</h2>
                <div class="hotel-info">
                    <p class="hotel-location">
                        <i class="ri-map-pin-line"></i> ${hotel["City"]}
                    </p>
                    <div class="hotel-rating">
                        <i class="ri-star-fill"></i> ${hotel["Rating"] || '4.5'}
                    </div>
                </div>
                <p class="hotel-price">₹${hotel["Price per Night"].toLocaleString('en-IN')}/night</p>
                <div class="hotel-amenities">
                    ${hotel["Amenities"].split(", ")
                        .slice(0, 3)
                        .map(amenity => `<span class="amenity-tag">${amenity}</span>`)
                        .join('')}
                </div>
                <a href="hotel-details.html?id=${index}" class="book-btn">
                    <span>View Details</span>
                    <i class="ri-arrow-right-line"></i>
                </a>
            </div>
        `;
        
        hotelsContainer.appendChild(card);
    });
}

// Setup event listeners
function setupEventListeners() {
    if (searchInput) {
        searchInput.addEventListener('input', renderHotels);
    }
    
    if (citySelect) {
        citySelect.addEventListener('change', renderHotels);
    }
    
    if (priceRange && maxPriceDisplay) {
        priceRange.addEventListener('input', (e) => {
            maxPrice = parseInt(e.target.value);
            maxPriceDisplay.textContent = `₹${maxPrice}`;
            renderHotels();
        });
    }
    
    // Chat functionality
    if (chatBtn && chatContainer) {
        chatBtn.addEventListener('click', () => {
            chatContainer.style.display = 'flex';
            if (chatMessages.children.length === 0) {
                addBotMessage(chatFlow[0].question);
            }
        });
    }
    
    if (closeChatBtn && chatContainer) {
        closeChatBtn.addEventListener('click', () => {
            chatContainer.style.display = 'none';
        });
    }
    
    if (sendMessageBtn && userMessageInput && chatMessages) {
        const sendMessage = () => {
            const message = userMessageInput.value.trim();
            if (message) {
                addUserMessage(message);
                handleChatbotResponse(message);
                userMessageInput.value = '';
            }
        };

        sendMessageBtn.addEventListener('click', sendMessage);
        userMessageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
}

function addUserMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user';
    messageDiv.textContent = message;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addBotMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot';
    messageDiv.textContent = message;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function handleChatbotResponse(userMessage) {
    const currentFlow = chatFlow[chatState.currentStep];
    const result = currentFlow.handler(userMessage);
    chatState.currentStep = result.nextStep;
    
    setTimeout(() => {
        addBotMessage(result.message);
    }, 500);
}

// Cursor Effects
function initCursorEffects() {
    const cursor = document.createElement('div');
    cursor.className = 'glow-cursor';
    document.body.appendChild(cursor);

    // Create cursor trails
    const trails = [];
    const numTrails = 8;
    
    for (let i = 0; i < numTrails; i++) {
        const trail = document.createElement('div');
        trail.className = 'cursor-trail';
        document.body.appendChild(trail);
        trails.push({
            element: trail,
            x: 0,
            y: 0,
            delay: i * 2
        });
    }

    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;

    // Update cursor position
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    // Animation loop
    function animate() {
        // Smooth cursor movement
        const dx = mouseX - cursorX;
        const dy = mouseY - cursorY;
        cursorX += dx * 0.2;
        cursorY += dy * 0.2;
        
        cursor.style.left = `${cursorX}px`;
        cursor.style.top = `${cursorY}px`;

        // Update trails
        trails.forEach((trail, index) => {
            const delayedX = mouseX - (dx * (trail.delay * 0.1));
            const delayedY = mouseY - (dy * (trail.delay * 0.1));
            
            trail.x += (delayedX - trail.x) * 0.2;
            trail.y += (delayedY - trail.y) * 0.2;
            
            trail.element.style.left = `${trail.x}px`;
            trail.element.style.top = `${trail.y}px`;
            trail.element.style.opacity = 1 - (index / numTrails);
        });

        requestAnimationFrame(animate);
    }

    animate();

    // Hide cursor on mouse leave
    document.addEventListener('mouseleave', () => {
        cursor.style.opacity = '0';
        trails.forEach(trail => {
            trail.element.style.opacity = '0';
        });
    });

    // Show cursor on mouse enter
    document.addEventListener('mouseenter', () => {
        cursor.style.opacity = '1';
        trails.forEach((trail, index) => {
            trail.element.style.opacity = 1 - (index / numTrails);
        });
    });
}

// Initialize cursor effects when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    fetchHotelData();
    initCursorEffects();
}); 