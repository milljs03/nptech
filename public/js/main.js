import { app, analytics } from './config/firebase-config.js';

console.log("NPTech App Running");

// --- 0. Fix Favicon 404 ---
const favicon = document.createElement('link');
favicon.rel = 'shortcut icon';
favicon.href = 'assets/images/NPtech_logo.png';
document.head.appendChild(favicon);

// --- 1. Autocomplete Logic ---
function initAutocomplete() {
    console.log("initAutocomplete started..."); 

    const input = document.getElementById('cfn-address-input');
    const redirectMsg = document.getElementById('redirect-message');

    if (!input) return;

    // Force dropdown Z-Index
    const style = document.createElement('style');
    style.innerHTML = `
        .pac-container { 
            z-index: 10005 !important; 
            margin-top: 5px;
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }
    `;
    document.head.appendChild(style);

    const autocomplete = new google.maps.places.Autocomplete(input, {
        types: ['address'],
        componentRestrictions: { country: 'us' },
        fields: ['address_components', 'geometry', 'icon', 'name']
    });

    autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry) {
            window.alert("No details available for input: '" + place.name + "'");
            return;
        }

        if (redirectMsg) {
            redirectMsg.classList.remove('hidden');
            redirectMsg.innerText = `Checking availability for ${place.name}...`;
        }

        setTimeout(() => {
            console.log("Address Selected:", place);
            // window.location.href = `...`;
        }, 1500);
    });
}

// Expose to window
window.initAutocomplete = initAutocomplete;

// --- 2. Dynamic Google Maps Loader ---
function loadGoogleMapsScript() {
    if (document.querySelector('script[src*="maps.googleapis.com"]')) return;

    const script = document.createElement('script');
    script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyBw8z2IL4dN5oldPzRW3a581mkXC7VuXe4&libraries=places&callback=initAutocomplete&loading=async";
    script.async = true;
    script.defer = true;
    script.onerror = () => console.error("Error loading Google Maps API");
    document.head.appendChild(script);
}

loadGoogleMapsScript();

// --- 3. UI Interactions & Animations (CRITICAL FIX) ---
document.addEventListener('DOMContentLoaded', () => {
    
    // A. Mobile Menu
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileBtn && navLinks) {
        mobileBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            mobileBtn.textContent = navLinks.classList.contains('active') ? '✕' : '☰';
        });
    }

    // B. Scroll Animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target); 
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in-section').forEach(section => {
        observer.observe(section);
    });
});