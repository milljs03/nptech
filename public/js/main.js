import { app, analytics, db } from './config/firebase-config.js';
import { loadHeader } from './header.js';
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

console.log("NPTech App Running");

// --- 0. Fix Favicon 404 ---
const favicon = document.createElement('link');
favicon.rel = 'shortcut icon';
favicon.href = 'assets/images/favicon.png';
document.head.appendChild(favicon);

// --- 0.1 Load Header ---
loadHeader();

let isRedirecting = false;

// --- 0.2 Check for Global Alerts (NEW) ---
async function checkGlobalAlerts() {
    // Only fetch if not already in session storage (basic caching)
    // We remove this check if you want real-time updates on refresh, keeping it for performance
    // For "Outages", removing cache is safer to ensure users see the latest status.
    
    try {
        const appId = '162296779236'; 
        const alertsRef = collection(db, 'artifacts', appId, 'public', 'data', 'alerts');
        const q = query(alertsRef, where('isActive', '==', true));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            snapshot.forEach(doc => {
                createAlertBanner(doc.data());
            });
        }
    } catch (err) {
        console.warn("Error fetching alerts:", err);
    }
}

function createAlertBanner(alert) {
    // Prevent duplicates
    if (document.querySelector(`.global-alert-banner[data-title="${alert.title}"]`)) return;

    const banner = document.createElement('div');
    const typeClass = `alert-${alert.type || 'info'}`;
    
    banner.className = `global-alert-banner ${typeClass}`;
    banner.dataset.title = alert.title; // marker to prevent dupes
    
    // Icon based on type
    let icon = '<i class="fa-solid fa-circle-info"></i>';
    if (alert.type === 'warning') icon = '<i class="fa-solid fa-triangle-exclamation"></i>';
    if (alert.type === 'danger') icon = '<i class="fa-solid fa-circle-exclamation"></i>';

    banner.innerHTML = `
        <span>${icon} <strong>${alert.title}:</strong> ${alert.message}</span>
        <button class="alert-close" onclick="this.parentElement.remove()"><i class="fa-solid fa-xmark"></i></button>
    `;

    // Insert at the very top of body
    document.body.insertAdjacentElement('afterbegin', banner);
}

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
    
    // Check for alerts immediately on DOM ready
    checkGlobalAlerts();

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