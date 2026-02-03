import { db, app } from './config/firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const APP_ID = '162296779236';

console.log("About JS Loaded");

async function loadCommunityGallery() {
    const galleryGrid = document.getElementById('community-gallery-grid');
    if (!galleryGrid) return;

    try {
        const ref = collection(db, 'artifacts', APP_ID, 'public', 'data', 'community_photos');
        const snapshot = await getDocs(ref);

        if (snapshot.empty) {
            // Fallback content if no photos exist in DB yet
            galleryGrid.innerHTML = `
                <div class="gallery-item">
                    <img src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="Community Event">
                    <div class="gallery-overlay">County Fair Sponsorship</div>
                </div>
                <div class="gallery-item">
                     <img src="https://images.unsplash.com/photo-1531545514256-b1400bc00f31?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80" alt="Fiber Installation">
                    <div class="gallery-overlay">Fiber Expansion</div>
                </div>
            `;
            return;
        }

        galleryGrid.innerHTML = '';
        const photos = [];
        snapshot.forEach(doc => {
            photos.push({ id: doc.id, ...doc.data() });
        });

        // Optional: sort by a timestamp if you add one, otherwise random or DB order
        
        photos.forEach(photo => {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            item.innerHTML = `
                <img src="${photo.imageUrl}" alt="${photo.title || 'Community Photo'}">
                <div class="gallery-overlay">${photo.title}</div>
            `;
            galleryGrid.appendChild(item);
        });

    } catch (err) {
        console.error("Error loading gallery:", err);
        galleryGrid.innerHTML = '<p style="text-align:center; width:100%; grid-column:span 4;">Unable to load photos.</p>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadCommunityGallery();
});