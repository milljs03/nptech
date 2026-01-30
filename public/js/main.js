import { app, analytics } from './config/firebase-config.js';
import { loadHeader } from './header.js';

console.log("NPTech App Running");

// --- 0. Fix Favicon 404 ---
const favicon = document.createElement('link');
favicon.rel = 'shortcut icon';
favicon.href = 'assets/images/NPtech_logo.png';
document.head.appendChild(favicon);

// --- 0.1 Load Header ---
loadHeader();

let isRedirecting = false;

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
        fields: ['address_components', 'geometry', 'icon', 'name', 'formatted_address']
    });

    autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry) {
            window.alert("No details available for input: '" + place.name + "'");
            return;
        }

        const address = place.formatted_address || place.name;
        redirectToApp(address);
    });
}

function redirectToApp(address) {
    if (isRedirecting) return;
    
    const input = document.getElementById('cfn-address-input');
    const msg = document.getElementById('redirect-message');

    if(address && address.length > 5) {
        isRedirecting = true;
        
        // Visual Feedback
        if(input) {
            input.style.borderColor = "#22c55e";
            input.style.backgroundColor = "#f0fdf4";
        }
        if(msg) {
            msg.classList.remove('hidden');
            msg.innerText = "Checking availability...";
        }
        
        // Redirect Logic
        const targetUrl = 'https://fiber-service-query.web.app/query.html?auto=true&address=' + encodeURIComponent(address);
        
        setTimeout(() => {
            window.location.href = targetUrl;
        }, 800);
    }
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