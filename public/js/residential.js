// public/assets/js/residential.js
import { db, app } from './config/firebase-config.js';
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { collection, getDocs, query, orderBy, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
    
    // --- 1. Auth & Init ---
    const auth = getAuth(app);
    signInAnonymously(auth).catch(err => console.warn("Auth warning:", err));

    // --- 2. Render Plans ---
    const plansGrid = document.getElementById('plans-grid');
    const loadingEl = document.getElementById('loading-indicator');
    const errorEl = document.getElementById('error-message');

    if(plansGrid) {
        try {
            // Using specific appId path '162296779236' to match Admin saves
            const appId = '162296779236'; 
            const plansRef = collection(db, 'artifacts', appId, 'public', 'data', 'plans');
            console.log(`Fetching plans from: artifacts/${appId}/public/data/plans`);
            
            const snapshot = await getDocs(plansRef);
            
            let plans = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                data.price = Number(data.price); 
                plans.push(data);
            });
            console.log(`Plans loaded: ${plans.length}`);

            // Fallback if DB is empty
            if (plans.length === 0) {
                console.log("Using default NPTech plans.");
                plans = [
                    { 
                        name: "Basic", speed: "250 Mbps", price: 55, 
                        description: "Perfect for browsing, email, and HD streaming on a few devices.",
                        features: ["Unlimited Data", "Free Install*", "No Contracts"], isPopular: false
                    },
                    { 
                        name: "Pro", speed: "500 Mbps", price: 75, 
                        description: "Ideal for families. Stream 4K on multiple devices seamlessly.",
                        features: ["Unlimited Data", "Free Install*", "No Contracts"], isPopular: true 
                    },
                    { 
                        name: "Giga", speed: "1 Gbps", price: 95, 
                        description: "The ultimate experience. Smart homes, heavy gaming, and massive downloads.",
                        features: ["Unlimited Data", "Priority Support", "No Contracts"], isPopular: false
                    }
                ];
            }

            // Sort by price (Low to High)
            plans.sort((a, b) => a.price - b.price);

            if(loadingEl) loadingEl.classList.add('hidden');
            plansGrid.classList.remove('hidden');
            plansGrid.innerHTML = plans.map((plan, index) => generatePlanCard(plan, index)).join('');
            
            // Inject Addons
            injectAddonsSection(plansGrid);

        } catch (error) {
            console.error("Error rendering plans:", error);
            if(loadingEl) loadingEl.classList.add('hidden');
            if(errorEl) errorEl.classList.remove('hidden');
        }
    }

    // --- 3. Load Testimonials ---
    loadTestimonials();

    // --- 4. Load Timeline ---
    loadTimeline();

    // --- 5. Load Promotions ---
    loadPromotions();
});

// --- Helper: Generate Plan Card ---
function generatePlanCard(plan, index) {
    const isPopular = plan.isPopular === true || plan.isPopular === "true";
    const highlightClass = isPopular ? 'popular' : '';
    const badge = isPopular ? '<div class="popular-badge">Best Value</div>' : '';
    const labelId = `bbf-${index}`;
    const features = Array.isArray(plan.features) ? plan.features : ["Local Service", "No Contracts"];
    const featuresHtml = features.map(f => `<div class="highlight-text"><i class="fa-solid fa-check"></i> ${f}</div>`).join('');

    return `
        <div class="pricing-box ${highlightClass}">
            ${badge}
            <div class="pricing-box-inner">
                <h3 class="panel-heading">${plan.name}</h3>
                <div class="price-wrapper"><span class="price">$${plan.price}<small>/mo</small></span></div>
                <div class="speed-display"><div class="speed-val">${plan.speed}</div><div class="speed-label">Download & Upload</div></div>
                <div class="plan-description">${plan.description || "Reliable fiber internet."}</div>
                <div class="core-benefits">${featuresHtml}</div>
                <div class="broadband-label-container">${generateBroadbandLabel(plan, labelId)}</div>
                 <a href="https://fiber-service-query.web.app/query.html" class="sign-up-btn">Sign Up Now</a>
            </div>
        </div>
    `;
}

// --- Helper: Broadband Label ---
function generateBroadbandLabel(plan, labelId) {
    return `<div class="broadband-facts-wrapper" id="${labelId}">
            <div class="expand-trigger" onclick="toggleLabel('${labelId}')"><button class="expand-btn">Broadband Facts <i class="fa-solid fa-chevron-down" style="margin-left:5px"></i></button></div>
            <div class="bbf-header"><h4 class="bbf-title">Broadband Facts</h4><div style="font-size:12px; margin-top:5px; font-weight:bold;">NPTech</div><div style="font-weight:bold;">${plan.name} Plan</div><div style="font-size:14px; margin-top:5px;">Fixed Broadband Consumer Disclosure</div></div>
            <div class="bbf-row strong"><span>Monthly Price</span><strong>$${plan.price}</strong></div>
            <div class="bbf-row"><span>Introductory Rate</span><strong>No</strong></div>
            <div class="bbf-row strong"><span>Contract</span><strong>None</strong></div>
            <div class="bbf-row"><span style="font-weight:bold">Install Fee</span><strong>$0 - $99*</strong></div>
            <div class="bbf-row strong"><span>Data Cap</span><strong>Unlimited</strong></div>
            <div class="bbf-footer"><p><strong>Support:</strong> (574) 831-2176</p><a href="https://fcc.gov/consumer" target="_blank" style="color:var(--npt-black)">fcc.gov/consumer</a></div>
        </div>`;
}

window.toggleLabel = function(id) {
    const el = document.getElementById(id);
    if(el) {
        el.classList.toggle('expanded');
        const btn = el.querySelector('.expand-btn');
        if(el.classList.contains('expanded')) { btn.innerHTML = 'Hide Facts <i class="fa-solid fa-chevron-up" style="margin-left:5px"></i>'; } 
        else { btn.innerHTML = 'Broadband Facts <i class="fa-solid fa-chevron-down" style="margin-left:5px"></i>'; }
    }
};

// --- Helper: Inject Addons HTML ---
function injectAddonsSection(targetElement) {
    if (document.querySelector('.addons-wrapper')) return;

    const addonsHTML = `
    <div class="addons-wrapper fade-in-section is-visible">
        <!-- Card 1: Voice -->
        <div class="addons-card">
            <div class="card-header">
                <i class="fa-solid fa-phone"></i>
                <h2>Crystal Clear Voice</h2>
            </div>
            <div class="card-body">
                <div class="feature-block">
                    <div class="feature-top">
                        <div class="feature-title-group">
                            <h3 class="feature-title">Home Phone</h3>
                        </div>
                        <div class="price-tag">
                            <div class="price-amount">$25</div>
                            <div class="price-period">/mo</div>
                        </div>
                    </div>
                    <p class="feature-desc">Keep your current number. Includes unlimited local calling and voicemail.</p>
                </div>
            </div>
        </div>

        <!-- Card 2: Managed WiFi -->
        <div class="addons-card">
            <div class="card-header">
                <i class="fa-solid fa-wifi"></i>
                <h2>Managed WiFi</h2>
            </div>
            <div class="card-body">
                <div class="feature-block">
                    <div class="feature-top">
                        <div class="feature-title-group">
                            <h3 class="feature-title">Whole Home Mesh</h3>
                             <span class="included-badge">Included</span>
                        </div>
                    </div>
                    <p class="feature-desc">We include premium WiFi 6 routers to ensure every corner of your home is covered.</p>
                </div>
            </div>
        </div>
    </div>
    `;
    targetElement.insertAdjacentHTML('afterend', addonsHTML);
}

// --- Helper: Timeline ---
function loadTimeline() {
    const steps = [
        { num: 1, title: 'Check Availability', desc: 'Use our search tool or call us to see if your home is in our fiber zone.' },
        { num: 2, title: 'Select Your Plan', desc: 'Choose the speed that fits your lifestyle. No contracts, ever.' },
        { num: 3, title: 'Professional Install', desc: 'Our local technicians bring the fiber directly into your home.' }
    ];

    const bubbles = document.getElementById('timeline-bubbles');
    if(!bubbles) return;

    // Render Bubbles
    bubbles.innerHTML = steps.map((s, i) => `
        <div class="timeline-step-bubble ${i === 0 ? 'active' : ''}" data-index="${i}">${s.num}</div>
    `).join('');

    // Default Step 1
    updateTimelineView(0, steps);

    // Click Logic
    document.querySelectorAll('.timeline-step-bubble').forEach((b, i) => {
        b.addEventListener('click', () => updateTimelineView(i, steps));
    });
}

function updateTimelineView(index, steps) {
    const title = document.getElementById('step-title');
    const desc = document.getElementById('step-desc');
    const badge = document.getElementById('step-badge');
    const img = document.getElementById('step-image');

    if(title) title.innerText = steps[index].title;
    if(desc) desc.innerText = steps[index].desc;
    if(badge) badge.innerText = `Step ${steps[index].num}`;
    
    // Placeholder image logic
    if(img) img.src = 'assets/images/NPTWW1.JPG'; 

    document.querySelectorAll('.timeline-step-bubble').forEach((b, i) => {
        if(i === index) b.classList.add('active');
        else b.classList.remove('active');
    });
}

// --- Helper: Load Promotions ---
async function loadPromotions() {
    const section = document.getElementById('promotions-section');
    if (!section) return;

    try {
        const appId = '162296779236';
        const promoRef = doc(db, 'artifacts', appId, 'public', 'data', 'site_content', 'promotions');
        const snapshot = await getDoc(promoRef);

        if (snapshot.exists()) {
            const data = snapshot.data();
            
            // Only show if there is a title or description
            if (data.title || data.description) {
                document.getElementById('promo-title').textContent = data.title || 'Special Offers';
                document.getElementById('promo-desc').textContent = data.description || '';
                document.getElementById('promo-fine-print').textContent = data.finePrint || '';

                const listEl = document.getElementById('promo-items');
                if (listEl && Array.isArray(data.items)) {
                    listEl.innerHTML = data.items.map(item => `<li><i class="fa-solid fa-check-circle"></i> ${item}</li>`).join('');
                }

                section.classList.remove('hidden');
            }
        }
    } catch (error) {
        console.error("Error loading promotions:", error);
    }
}

// --- Helper: Load Testimonials ---
async function loadTestimonials() {
    const tGrid = document.getElementById('testimonials-grid');
    if (!tGrid) return;

    try {
        const appId = '162296779236';
        const ref = collection(db, 'artifacts', appId, 'public', 'data', 'testimonials');
        const snapshot = await getDocs(ref);

        if (snapshot.empty) {
            // Fallback to defaults if DB is empty
            tGrid.innerHTML = `
                <div class="testimonial-card">
                    <div class="quote-icon"><i class="fa-solid fa-quote-left"></i></div>
                    <p class="quote-text">"Since switching to NPTech, my work-from-home connection has been flawless. The local support team is actually helpful, unlike the big cable companies."</p>
                    <div class="quote-author"><strong>Sarah J.</strong><span>New Paris, IN</span></div>
                </div>
                <div class="testimonial-card">
                    <div class="quote-icon"><i class="fa-solid fa-quote-left"></i></div>
                    <p class="quote-text">"We have gamers and streamers in the house. The 1 Gig plan handles it all without a glitch. Highly recommend."</p>
                    <div class="quote-author"><strong>Mike T.</strong><span>New Paris, IN</span></div>
                </div>
            `;
            return;
        }

        tGrid.innerHTML = '';
        snapshot.forEach(doc => {
            const t = doc.data();
            tGrid.innerHTML += `
                <div class="testimonial-card">
                    <div class="quote-icon"><i class="fa-solid fa-quote-left"></i></div>
                    <p class="quote-text">"${t.quote}"</p>
                    <div class="quote-author"><strong>${t.author}</strong><span>${t.location || ''}</span></div>
                </div>
            `;
        });
    } catch (error) {
        console.error("Error loading testimonials:", error);
    }
}