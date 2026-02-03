// public/assets/js/admin.js
import { db, app } from './config/firebase-config.js';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, query, orderBy, where, getDoc, setDoc, limit } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const ADMIN_EMAIL = 'jmiller@nptel.com';
const ALLOWED_DOMAIN = 'nptel.com';
const APP_ID = '162296779236'; // Using specific ID to match data structure

let currentUser = null;
let isAdmin = false;
let loadedLeads = [];

// DOM Elements
const loginOverlay = document.getElementById('login-overlay');
const adminApp = document.getElementById('admin-app');
const loginBtn = document.getElementById('google-login-btn');
const logoutBtn = document.getElementById('logout-btn');
const loginError = document.getElementById('login-error');

// --- Auth Handling ---

// Enable Persistence
setPersistence(auth, browserLocalPersistence)
    .then(() => {
        // Persistence set
    })
    .catch((error) => {
        console.error("Auth Persistence Error:", error);
    });

if(loginBtn) {
    loginBtn.addEventListener('click', () => {
        signInWithPopup(auth, provider).catch((error) => {
            console.error("Auth Error:", error);
            showLoginError("Login failed. Check console for details.");
        });
    });
}

if(logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => {
            window.location.reload();
        });
    });
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        // Enforce Domain Restriction
        if (user.email && user.email.endsWith(`@${ALLOWED_DOMAIN}`)) {
            checkAccess(user);
        } else {
            console.warn(`Unauthorized login attempt: ${user.email}`);
            signOut(auth).then(() => {
                showLoginError(`Access restricted to @${ALLOWED_DOMAIN} accounts only.`);
            });
        }
    } else {
        if(loginOverlay) loginOverlay.classList.remove('hidden');
        if(adminApp) adminApp.classList.add('hidden');
    }
});

function checkAccess(user) {
    currentUser = user;
    isAdmin = (user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
    
    const userNameEl = document.getElementById('user-name');
    if(userNameEl) userNameEl.textContent = user.displayName || user.email || 'User';
    
    const userAvatarEl = document.getElementById('user-avatar');
    if(userAvatarEl) userAvatarEl.src = user.photoURL || 'assets/images/NPtech_logo.png';
    
    const userRoleEl = document.getElementById('user-role');
    if(userRoleEl) {
        userRoleEl.textContent = isAdmin ? 'Admin' : 'Viewer';
        userRoleEl.className = `badge ${isAdmin ? 'bg-green' : 'bg-gray'}`;
    }
    
    document.querySelectorAll('.user-name-display').forEach(el => el.textContent = user.displayName ? user.displayName.split(' ')[0] : 'User');

    if (isAdmin) {
        document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
    }

    if(loginOverlay) loginOverlay.classList.add('hidden');
    if(adminApp) adminApp.classList.remove('hidden');

    loadDashboard();
}

function showLoginError(msg) {
    if(loginError) {
        loginError.textContent = msg;
        loginError.classList.remove('hidden');
    }
}

// --- Navigation ---
document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
        const tab = btn.dataset.tab;
        const viewEl = document.getElementById(`view-${tab}`);
        if(viewEl) viewEl.classList.add('active');

        // Lazy load data when tab is clicked
        if (tab === 'leads') loadLeads();
        if (tab === 'alerts') loadAlerts(); // NEW
        if (tab === 'promotions') loadPromotions();
        if (tab === 'plans') loadPlans();
        if (tab === 'jobs') loadJobs(); 
        if (tab === 'install') loadInstallSteps(); 
        if (tab === 'neighborhoods') loadNeighborhoods();
        if (tab === 'employees') loadEmployees();
        if (tab === 'testimonials') loadTestimonials();
        if (tab === 'news') loadNews(); 
    });
});

// Event Delegation for Leads Table
const leadsTableBody = document.getElementById('leads-table-body');
if (leadsTableBody) {
    leadsTableBody.addEventListener('click', (e) => {
        const row = e.target.closest('tr');
        if (row && row.dataset.id) {
            const id = row.dataset.id;
            const lead = loadedLeads.find(l => l.id === id);
            if (lead) openViewLeadModal(lead);
        }
    });
}

// --- Data Loading Functions ---

async function loadDashboard() {
    try {
        const leadsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'leads');
        const leadsSnap = await getDocs(leadsRef);
        const statLeads = document.getElementById('stat-leads');
        if(statLeads) statLeads.textContent = leadsSnap.size;

        const plansRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'plans');
        const plansSnap = await getDocs(plansRef);
        const statPlans = document.getElementById('stat-plans');
        if(statPlans) statPlans.textContent = plansSnap.size;

        const hoodsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'neighborhoods');
        const hoodsSnap = await getDocs(hoodsRef);
        const statHoods = document.getElementById('stat-hoods');
        if(statHoods) statHoods.textContent = hoodsSnap.size;

        const viewsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'analytics_pageviews');
        const viewsSnap = await getDocs(viewsRef);
        const statViews = document.getElementById('stat-views');
        if(statViews) statViews.textContent = viewsSnap.size;

    } catch (err) {
        console.error("Dashboard Load Error:", err);
    }
}

async function loadLeads() {
    const tbody = document.getElementById('leads-table-body');
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Loading...</td></tr>';
    
    const filterEl = document.getElementById('lead-filter');
    const filter = filterEl ? filterEl.value : 'all';
    
    let q = collection(db, 'artifacts', APP_ID, 'public', 'data', 'leads');
    
    if (filter !== 'all') {
        q = query(q, where('type', '==', filter));
    }
    
    try {
        const snapshot = await getDocs(q);
        const leads = [];
        snapshot.forEach(doc => leads.push({ id: doc.id, ...doc.data() }));
        loadedLeads = leads;

        // Sort by date desc
        leads.sort((a, b) => {
            const dateA = a.submittedAt?.toDate ? a.submittedAt.toDate() : new Date(0);
            const dateB = b.submittedAt?.toDate ? b.submittedAt.toDate() : new Date(0);
            return dateB - dateA;
        });

        tbody.innerHTML = '';
        if (leads.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No records found</td></tr>';
            return;
        }

        leads.forEach(lead => {
            const date = lead.submittedAt?.toDate ? lead.submittedAt.toDate().toLocaleDateString() : 'N/A';
            const displayName = lead.name || lead.contactName || lead.businessName || lead.company || 'Unknown';
            const row = `
                <tr class="lead-row" data-id="${lead.id}" style="cursor: pointer;">
                    <td>${date}</td>
                    <td><span class="badge bg-gray">${lead.type || 'General'}</span></td>
                    <td>${displayName}</td>
                    <td>${lead.email || '-'}</td>
                    <td>${lead.status || 'New'}</td>
                    <td><button class="btn-sm btn-outline">View</button></td>
                </tr>
            `;
            tbody.insertAdjacentHTML('beforeend', row);
        });

    } catch (err) {
        console.error("Error loading leads:", err);
        tbody.innerHTML = '<tr><td colspan="6" style="color:red; text-align:center;">Error loading data.</td></tr>';
    }
}

const leadFilterEl = document.getElementById('lead-filter');
if(leadFilterEl) {
    leadFilterEl.addEventListener('change', loadLeads);
}

// --- ALERTS ---
async function loadAlerts() {
    const container = document.getElementById('alerts-list');
    if(!container) return;
    container.innerHTML = '<p>Loading...</p>';
    
    try {
        const ref = collection(db, 'artifacts', APP_ID, 'public', 'data', 'alerts');
        const snapshot = await getDocs(ref);
        
        container.innerHTML = '';
        snapshot.forEach(doc => {
            const alert = doc.data();
            const card = document.createElement('div');
            card.className = 'admin-card';
            
            // Determine badge color based on alert type
            let badgeClass = 'bg-blue';
            if (alert.type === 'warning') badgeClass = 'bg-yellow';
            if (alert.type === 'danger') badgeClass = 'bg-red';

            const statusBadge = alert.isActive ? '<span class="badge bg-green">Active</span>' : '<span class="badge bg-gray">Inactive</span>';

            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <span class="badge ${badgeClass}">${alert.type || 'Info'}</span>
                    ${statusBadge}
                </div>
                <h3>${alert.title}</h3>
                <p>${alert.message}</p>
                <div class="card-actions">
                    ${isAdmin ? `<button class="btn-sm btn-outline btn-edit" data-id="${doc.id}" data-type="alert">Edit</button>` : ''}
                    ${isAdmin ? `<button class="btn-sm btn-delete" data-id="${doc.id}" data-type="alert">Delete</button>` : ''}
                </div>
            `;
            container.appendChild(card);
            
            if(isAdmin) {
                const editBtn = card.querySelector('.btn-edit');
                if(editBtn) editBtn.addEventListener('click', () => openEditModal('alert', doc.id, alert));
                const delBtn = card.querySelector('.btn-delete');
                if(delBtn) delBtn.addEventListener('click', () => deleteItem('alerts', doc.id, 'alert'));
            }
        });

        if (snapshot.empty) container.innerHTML = '<p>No active alerts.</p>';

    } catch (err) {
        console.error(err);
        container.innerHTML = '<p style="color:red;">Error loading alerts.</p>';
    }
}

// --- PROMOTIONS ---
const promotionsForm = document.getElementById('promotions-form');

async function loadPromotions() {
    try {
        const docRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'site_content', 'promotions');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            const titleEl = document.getElementById('promo-title');
            if(titleEl) titleEl.value = data.title || '';
            const descEl = document.getElementById('promo-description');
            if(descEl) descEl.value = data.description || '';
            const finePrintEl = document.getElementById('promo-finePrint');
            if(finePrintEl) finePrintEl.value = data.finePrint || '';
            
            const itemsEl = document.getElementById('promo-items');
            if (itemsEl && data.items && Array.isArray(data.items)) {
                itemsEl.value = data.items.join('\n');
            }
        }
    } catch (err) {
        console.error("Error loading promotions:", err);
    }
}

if(promotionsForm) {
    promotionsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!isAdmin) {
            alert("You must be an admin to save changes.");
            return;
        }

        const itemsText = document.getElementById('promo-items').value;
        const itemsArray = itemsText.split('\n').map(item => item.trim()).filter(item => item !== '');

        const data = {
            title: document.getElementById('promo-title').value,
            description: document.getElementById('promo-description').value,
            items: itemsArray,
            finePrint: document.getElementById('promo-finePrint').value,
            updatedAt: new Date()
        };

        try {
            const docRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'site_content', 'promotions');
            await setDoc(docRef, data, { merge: true });
            alert("Promotions content updated successfully!");
        } catch (err) {
            console.error(err);
            alert("Error updating promotions content.");
        }
    });
}

// --- PLANS ---
async function loadPlans() {
    const container = document.getElementById('plans-list');
    if(!container) return;
    container.innerHTML = '<p>Loading...</p>';
    
    try {
        const ref = collection(db, 'artifacts', APP_ID, 'public', 'data', 'plans');
        const snapshot = await getDocs(ref);
        
        container.innerHTML = '';
        snapshot.forEach(doc => {
            const plan = doc.data();
            const card = document.createElement('div');
            card.className = 'admin-card';
            card.innerHTML = `
                <h3>${plan.name} <span style="font-size:0.8rem; color:var(--npt-blue);">$${plan.price}</span></h3>
                <p>${plan.speed} - ${plan.description?.substring(0, 50)}...</p>
                <div class="card-actions">
                    ${isAdmin ? `<button class="btn-sm btn-outline btn-edit" data-id="${doc.id}" data-type="plan">Edit</button>` : ''}
                    ${isAdmin ? `<button class="btn-sm btn-delete" data-id="${doc.id}" data-type="plan">Delete</button>` : ''}
                </div>
            `;
            container.appendChild(card);
            
            if(isAdmin) {
                const editBtn = card.querySelector('.btn-edit');
                if(editBtn) editBtn.addEventListener('click', () => openEditModal('plan', doc.id, plan));
                const delBtn = card.querySelector('.btn-delete');
                if(delBtn) delBtn.addEventListener('click', () => deleteItem('plans', doc.id, 'plan'));
            }
        });

        if (snapshot.empty) container.innerHTML = '<p>No plans found. Add one!</p>';

    } catch (err) {
        console.error(err);
        container.innerHTML = '<p style="color:red;">Error loading plans.</p>';
    }
}

// --- JOBS (CAREERS) ---
async function loadJobs() {
    const container = document.getElementById('jobs-list');
    if(!container) return;
    container.innerHTML = '<p>Loading...</p>';
    
    try {
        const ref = collection(db, 'artifacts', APP_ID, 'public', 'data', 'jobs');
        const snapshot = await getDocs(ref);
        
        container.innerHTML = '';
        snapshot.forEach(doc => {
            const job = doc.data();
            const card = document.createElement('div');
            card.className = 'admin-card';
            const statusBadge = job.isActive !== false ? '<span class="badge bg-green">Active</span>' : '<span class="badge bg-gray">Closed</span>';
            
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <h3 style="margin:0;">${job.title}</h3>
                    ${statusBadge}
                </div>
                <p style="font-size:0.9rem; color:#64748b;">${job.location || 'New Paris, IN'} | ${job.type || 'Full Time'}</p>
                <div class="card-actions">
                    ${isAdmin ? `<button class="btn-sm btn-outline btn-edit" data-id="${doc.id}" data-type="job">Edit</button>` : ''}
                    ${isAdmin ? `<button class="btn-sm btn-delete" data-id="${doc.id}" data-type="job">Delete</button>` : ''}
                </div>
            `;
            container.appendChild(card);
            
            if(isAdmin) {
                const editBtn = card.querySelector('.btn-edit');
                if(editBtn) editBtn.addEventListener('click', () => openEditModal('job', doc.id, job));
                const delBtn = card.querySelector('.btn-delete');
                if(delBtn) delBtn.addEventListener('click', () => deleteItem('jobs', doc.id, 'job')); // refreshType 'job' -> calls loadJobs
            }
        });

        if (snapshot.empty) container.innerHTML = '<p>No job postings found. Add one!</p>';

    } catch (err) {
        console.error(err);
        container.innerHTML = '<p style="color:red;">Error loading jobs.</p>';
    }
}

// --- INSTALL STEPS ---
async function loadInstallSteps() {
    const container = document.getElementById('install-steps-list');
    if(!container) return;
    container.innerHTML = '<p>Loading...</p>';

    try {
        const ref = collection(db, 'artifacts', APP_ID, 'public', 'data', 'install_steps');
        const q = query(ref, orderBy('stepNumber', 'asc'));
        const snapshot = await getDocs(q);

        container.innerHTML = '';
        snapshot.forEach(doc => {
            const step = doc.data();
            const card = document.createElement('div');
            card.className = 'admin-card';
            card.innerHTML = `
                <div style="display:flex; gap:15px; align-items:center;">
                    <div style="background:var(--npt-blue); color:white; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold;">
                        ${step.stepNumber}
                    </div>
                    <div>
                        <h3 style="margin:0;">${step.title}</h3>
                    </div>
                </div>
                <div style="margin-top:10px; color:#64748b; font-size:0.9rem;">
                    <p>${step.description}</p>
                </div>
                <div class="card-actions">
                    ${isAdmin ? `<button class="btn-sm btn-outline btn-edit">Edit</button>` : ''}
                    ${isAdmin ? `<button class="btn-sm btn-delete">Delete</button>` : ''}
                </div>
            `;
            container.appendChild(card);

            if(isAdmin) {
                const editBtn = card.querySelector('.btn-edit');
                if(editBtn) editBtn.addEventListener('click', () => openEditModal('install_step', doc.id, step));
                const delBtn = card.querySelector('.btn-delete');
                if(delBtn) delBtn.addEventListener('click', () => deleteItem('install_steps', doc.id, 'install'));
            }
        });

        if (snapshot.empty) container.innerHTML = '<p>No steps found. Add your first installation step!</p>';

    } catch (err) {
        console.error(err);
    }
}

// --- NEIGHBORHOODS ---
async function loadNeighborhoods() {
    const container = document.getElementById('hoods-list');
    if(!container) return;
    container.innerHTML = '<p>Loading...</p>';
    
    try {
        const ref = collection(db, 'artifacts', APP_ID, 'public', 'data', 'neighborhoods');
        const snapshot = await getDocs(ref);
        
        container.innerHTML = '';
        snapshot.forEach(doc => {
            const hood = doc.data();
            const card = document.createElement('div');
            card.className = 'admin-card';
            card.innerHTML = `
                <h3>${hood.name}</h3>
                <p>Status: <strong>${hood.status}</strong></p>
                <div class="card-actions">
                    ${isAdmin ? `<button class="btn-sm btn-outline btn-edit">Edit</button>` : ''}
                    ${isAdmin ? `<button class="btn-sm btn-delete">Delete</button>` : ''}
                </div>
            `;
            container.appendChild(card);

             if(isAdmin) {
                const editBtn = card.querySelector('.btn-edit');
                if(editBtn) editBtn.addEventListener('click', () => openEditModal('hood', doc.id, hood));
                const delBtn = card.querySelector('.btn-delete');
                if(delBtn) delBtn.addEventListener('click', () => deleteItem('neighborhoods', doc.id, 'neighborhoods'));
            }
        });
        
         if (snapshot.empty) container.innerHTML = '<p>No neighborhoods found.</p>';

    } catch (err) {
        console.error(err);
    }
}

// --- EMPLOYEES ---
async function loadEmployees() {
    const container = document.getElementById('employees-list');
    if(!container) return;
    container.innerHTML = '<p>Loading...</p>';
    try {
        const ref = collection(db, 'artifacts', APP_ID, 'public', 'data', 'employees');
        const snapshot = await getDocs(ref);
        container.innerHTML = '';
        snapshot.forEach(doc => {
            const emp = doc.data();
            const card = document.createElement('div');
            card.className = 'admin-card';
            card.innerHTML = `
                <h3>${emp.name}</h3>
                <p>${emp.title}</p>
                <div class="card-actions">
                    ${isAdmin ? `<button class="btn-sm btn-outline btn-edit">Edit</button>` : ''}
                    ${isAdmin ? `<button class="btn-sm btn-delete">Delete</button>` : ''}
                </div>
            `;
            container.appendChild(card);
             if(isAdmin) {
                const editBtn = card.querySelector('.btn-edit');
                if(editBtn) editBtn.addEventListener('click', () => openEditModal('employee', doc.id, emp));
                const delBtn = card.querySelector('.btn-delete');
                if(delBtn) delBtn.addEventListener('click', () => deleteItem('employees', doc.id, 'employees'));
            }
        });
    } catch (err) { console.error(err); }
}

// --- TESTIMONIALS ---
async function loadTestimonials() {
    const container = document.getElementById('testimonials-list');
    if(!container) return;
    container.innerHTML = '<p>Loading...</p>';
    try {
        const ref = collection(db, 'artifacts', APP_ID, 'public', 'data', 'testimonials');
        const snapshot = await getDocs(ref);
        container.innerHTML = '';
        snapshot.forEach(doc => {
            const t = doc.data();
            const card = document.createElement('div');
            card.className = 'admin-card';
            card.innerHTML = `
                <h3>${t.author}</h3>
                <p>"${t.quote}"</p>
                <div class="card-actions">
                    ${isAdmin ? `<button class="btn-sm btn-outline btn-edit">Edit</button>` : ''}
                    ${isAdmin ? `<button class="btn-sm btn-delete">Delete</button>` : ''}
                </div>
            `;
            container.appendChild(card);
             if(isAdmin) {
                const editBtn = card.querySelector('.btn-edit');
                if(editBtn) editBtn.addEventListener('click', () => openEditModal('testimonial', doc.id, t));
                const delBtn = card.querySelector('.btn-delete');
                if(delBtn) delBtn.addEventListener('click', () => deleteItem('testimonials', doc.id, 'testimonials'));
            }
        });
    } catch (err) { console.error(err); }
}

// --- NEWS ---
async function loadNews() {
    const container = document.getElementById('news-list');
    if(!container) return;
    container.innerHTML = '<p>Loading...</p>';
    try {
        const ref = collection(db, 'artifacts', APP_ID, 'public', 'data', 'news');
        const q = query(ref, orderBy('date', 'desc'));
        const snapshot = await getDocs(q);
        container.innerHTML = '';
        snapshot.forEach(doc => {
            const item = doc.data();
            const date = item.date ? (item.date.toDate ? item.date.toDate().toLocaleDateString() : new Date(item.date).toLocaleDateString()) : 'No Date';
            const card = document.createElement('div');
            card.className = 'admin-card';
            card.innerHTML = `
                <div style="margin-bottom:10px;"><span style="font-size:0.8rem; color:#64748b; font-weight:bold;">${date}</span></div>
                <h3 style="margin:5px 0;">${item.title}</h3>
                <p style="font-size:0.9rem;">${item.excerpt}</p>
                <div class="card-actions">
                    ${isAdmin ? `<button class="btn-sm btn-outline btn-edit">Edit</button>` : ''}
                    ${isAdmin ? `<button class="btn-sm btn-delete">Delete</button>` : ''}
                </div>
            `;
            container.appendChild(card);
             if(isAdmin) {
                const editBtn = card.querySelector('.btn-edit');
                if(editBtn) editBtn.addEventListener('click', () => openEditModal('news', doc.id, item));
                const delBtn = card.querySelector('.btn-delete');
                if(delBtn) delBtn.addEventListener('click', () => deleteItem('news', doc.id, 'news'));
            }
        });
        if (snapshot.empty) container.innerHTML = '<p>No news found.</p>';
    } catch (err) { console.error(err); }
}

// --- EDIT MODAL LOGIC ---
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const modalFields = document.getElementById('modal-fields');

function openEditModal(type, id, data = null) {
    if (!isAdmin) return;
    if(!editModal) return;
    
    document.getElementById('edit-id').value = id || '';
    document.getElementById('edit-type').value = type;
    document.getElementById('modal-title').textContent = id ? `Edit ${type}` : `Add ${type}`;
    
    modalFields.innerHTML = ''; 

    if (type === 'plan') {
        modalFields.innerHTML = `
            <div><label class="form-label">Plan Name</label><input type="text" name="name" class="form-control" value="${data?.name || ''}" required></div>
            <div><label class="form-label">Price</label><input type="number" name="price" class="form-control" value="${data?.price || ''}" required></div>
            <div><label class="form-label">Speed</label><input type="text" name="speed" class="form-control" value="${data?.speed || ''}" required></div>
            <div><label class="form-label">Description</label><textarea name="description" class="form-control" rows="3">${data?.description || ''}</textarea></div>
            <div style="margin-top:10px;"><input type="checkbox" name="isPopular" ${data?.isPopular ? 'checked' : ''}> <label class="form-label" style="display:inline;">Best Value (Highlight)</label></div>
        `;
    } else if (type === 'job') {
        modalFields.innerHTML = `
            <div><label class="form-label">Job Title</label><input type="text" name="title" class="form-control" value="${data?.title || ''}" required></div>
            <div><label class="form-label">Location</label><input type="text" name="location" class="form-control" value="${data?.location || 'New Paris, IN'}" required></div>
            <div><label class="form-label">Type</label>
                <select name="type" class="form-control">
                    <option value="Full Time" ${data?.type === 'Full Time' ? 'selected' : ''}>Full Time</option>
                    <option value="Part Time" ${data?.type === 'Part Time' ? 'selected' : ''}>Part Time</option>
                    <option value="Contract" ${data?.type === 'Contract' ? 'selected' : ''}>Contract</option>
                </select>
            </div>
            <div><label class="form-label">Short Description</label><textarea name="description" class="form-control" rows="3" required>${data?.description || ''}</textarea></div>
            <div><label class="form-label">Indeed URL (Optional)</label><input type="url" name="indeedUrl" class="form-control" value="${data?.indeedUrl || ''}" placeholder="https://indeed.com/..."></div>
            <div style="margin-top:10px;"><input type="checkbox" name="isActive" ${data?.isActive !== false ? 'checked' : ''}> <label class="form-label" style="display:inline;">Active Posting</label></div>
        `;
    } else if (type === 'alert') {
        // NEW Alert Fields
        modalFields.innerHTML = `
            <div><label class="form-label">Alert Title</label><input type="text" name="title" class="form-control" value="${data?.title || ''}" required placeholder="e.g. Service Outage"></div>
            <div><label class="form-label">Message</label><textarea name="message" class="form-control" rows="3" required placeholder="Details about the alert...">${data?.message || ''}</textarea></div>
            <div><label class="form-label">Type</label>
                <select name="type" class="form-control">
                    <option value="info" ${data?.type === 'info' ? 'selected' : ''}>Info (Blue)</option>
                    <option value="warning" ${data?.type === 'warning' ? 'selected' : ''}>Warning (Amber)</option>
                    <option value="danger" ${data?.type === 'danger' ? 'selected' : ''}>Outage/Danger (Red)</option>
                </select>
            </div>
            <div style="margin-top:10px;"><input type="checkbox" name="isActive" ${data?.isActive ? 'checked' : ''}> <label class="form-label" style="display:inline;">Active (Visible on Site)</label></div>
        `;
    } else if (type === 'hood') {
         modalFields.innerHTML = `
            <div><label class="form-label">Neighborhood Name</label><input type="text" name="name" class="form-control" value="${data?.name || ''}" required></div>
            <div><label class="form-label">Status</label>
                <select name="status" class="form-control">
                    <option value="Live Now" ${data?.status === 'Live Now' ? 'selected' : ''}>Live Now</option>
                    <option value="Construction Phase" ${data?.status === 'Construction Phase' ? 'selected' : ''}>Construction Phase</option>
                    <option value="Pre-Order" ${data?.status === 'Pre-Order' ? 'selected' : ''}>Pre-Order</option>
                    <option value="Planned" ${data?.status === 'Planned' ? 'selected' : ''}>Planned</option>
                </select>
            </div>
        `;
    } else if (type === 'testimonial') {
        modalFields.innerHTML = `
            <div><label class="form-label">Author</label><input type="text" name="author" class="form-control" value="${data?.author || ''}" required></div>
            <div><label class="form-label">Location</label><input type="text" name="location" class="form-control" value="${data?.location || ''}" required></div>
            <div><label class="form-label">Quote</label><textarea name="quote" class="form-control" rows="3" required>${data?.quote || ''}</textarea></div>
        `;
    } else if (type === 'install_step') {
        modalFields.innerHTML = `
            <div><label class="form-label">Step #</label><input type="number" name="stepNumber" class="form-control" value="${data?.stepNumber || ''}" required></div>
            <div><label class="form-label">Title</label><input type="text" name="title" class="form-control" value="${data?.title || ''}" required></div>
            <div><label class="form-label">Description</label><textarea name="description" class="form-control" rows="3" required>${data?.description || ''}</textarea></div>
        `;
    } else if (type === 'employee') {
        modalFields.innerHTML = `
            <div><label class="form-label">Name</label><input type="text" name="name" class="form-control" value="${data?.name || ''}" required></div>
            <div><label class="form-label">Title</label><input type="text" name="title" class="form-control" value="${data?.title || ''}" required></div>
            <div><label class="form-label">Years</label><input type="number" name="years" class="form-control" value="${data?.years || ''}" required></div>
            <div><label class="form-label">Fact</label><textarea name="fact" class="form-control" rows="2">${data?.fact || ''}</textarea></div>
        `;
    } else if (type === 'news') {
        const today = new Date().toISOString().split('T')[0];
        let postDate = today;
        if(data?.date) {
             const d = data.date.toDate ? data.date.toDate() : new Date(data.date);
             postDate = d.toISOString().split('T')[0];
        }
        modalFields.innerHTML = `
            <div><label class="form-label">Title</label><input type="text" name="title" class="form-control" value="${data?.title || ''}" required></div>
            <div><label class="form-label">Date</label><input type="date" name="date" class="form-control" value="${postDate}" required></div>
            <div><label class="form-label">Excerpt</label><textarea name="excerpt" class="form-control" rows="3" required>${data?.excerpt || ''}</textarea></div>
            <div><label class="form-label">Link URL</label><input type="text" name="linkUrl" class="form-control" value="${data?.linkUrl || ''}" required></div>
            <div><label class="form-label">Link Text</label><input type="text" name="linkText" class="form-control" value="${data?.linkText || 'Read More'}" required></div>
        `;
    }

    editModal.style.display = 'flex';
}

document.querySelectorAll('.close-modal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if(editModal) editModal.style.display = 'none';
    });
});

if(editForm) {
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!isAdmin) return;

        const id = document.getElementById('edit-id').value;
        const type = document.getElementById('edit-type').value;
        const formData = new FormData(editForm);
        const data = Object.fromEntries(formData.entries());
        
        if (data.price) data.price = Number(data.price);
        if (data.stepNumber) data.stepNumber = Number(data.stepNumber);
        if (data.date) data.date = new Date(data.date);

        if (type === 'plan') {
            const popCheck = editForm.querySelector('[name="isPopular"]');
            data.isPopular = !!(popCheck && popCheck.checked);
        }
        if (type === 'job') {
            const activeCheck = editForm.querySelector('[name="isActive"]');
            data.isActive = !!(activeCheck && activeCheck.checked);
        }
        if (type === 'alert') {
            const activeCheck = editForm.querySelector('[name="isActive"]');
            data.isActive = !!(activeCheck && activeCheck.checked);
        }

        let collectionName;
        if (type === 'plan') collectionName = 'plans';
        else if (type === 'job') collectionName = 'jobs'; 
        else if (type === 'alert') collectionName = 'alerts'; // NEW
        else if (type === 'hood') collectionName = 'neighborhoods';
        else if (type === 'testimonial') collectionName = 'testimonials';
        else if (type === 'employee') collectionName = 'employees';
        else if (type === 'install_step') collectionName = 'install_steps';
        else if (type === 'news') collectionName = 'news';

        const collRef = collection(db, 'artifacts', APP_ID, 'public', 'data', collectionName);

        try {
            if (id) {
                await updateDoc(doc(collRef, id), data);
            } else {
                await addDoc(collRef, data);
            }
            
            editModal.style.display = 'none';
            
            // Refresh appropriate list
            if (type === 'plan') loadPlans();
            if (type === 'job') loadJobs(); 
            if (type === 'alert') loadAlerts(); // NEW
            if (type === 'hood') loadNeighborhoods();
            if (type === 'testimonial') loadTestimonials();
            if (type === 'employee') loadEmployees();
            if (type === 'install_step') loadInstallSteps();
            if (type === 'news') loadNews();
            
        } catch (err) {
            console.error("Save failed", err);
            alert("Error saving data.");
        }
    });
}

async function deleteItem(collectionName, id, refreshType) {
    if (!isAdmin) return;
    if (!confirm("Are you sure you want to delete this item?")) return;
    
    try {
        await deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', collectionName, id));
        if (refreshType === 'plan') loadPlans();
        if (refreshType === 'job') loadJobs();
        if (refreshType === 'alert') loadAlerts();
        if (refreshType === 'neighborhoods') loadNeighborhoods();
        if (refreshType === 'testimonials') loadTestimonials();
        if (refreshType === 'employees') loadEmployees();
        if (refreshType === 'install') loadInstallSteps();
        if (refreshType === 'news') loadNews();
    } catch (err) {
        console.error("Delete failed", err);
        alert("Error deleting item.");
    }
}

// Add Button Listeners
const addPlanBtn = document.getElementById('add-plan-btn');
if(addPlanBtn) addPlanBtn.addEventListener('click', () => openEditModal('plan'));

const addJobBtn = document.getElementById('add-job-btn'); 
if(addJobBtn) addJobBtn.addEventListener('click', () => openEditModal('job'));

const addAlertBtn = document.getElementById('add-alert-btn'); // NEW
if(addAlertBtn) addAlertBtn.addEventListener('click', () => openEditModal('alert'));

const addHoodBtn = document.getElementById('add-hood-btn');
if(addHoodBtn) addHoodBtn.addEventListener('click', () => openEditModal('hood'));

const addStepBtn = document.getElementById('add-step-btn');
if(addStepBtn) addStepBtn.addEventListener('click', () => openEditModal('install_step'));

const addTestBtn = document.getElementById('add-testimonial-btn');
if(addTestBtn) addTestBtn.addEventListener('click', () => openEditModal('testimonial'));

const addEmpBtn = document.getElementById('add-employee-btn');
if(addEmpBtn) addEmpBtn.addEventListener('click', () => openEditModal('employee'));

const addNewsBtn = document.getElementById('add-news-btn');
if(addNewsBtn) addNewsBtn.addEventListener('click', () => openEditModal('news'));

// --- VIEW LEAD MODAL ---
const viewLeadModal = document.getElementById('view-lead-modal');

function openViewLeadModal(lead) {
    const content = document.getElementById('view-lead-content');
    if (!viewLeadModal || !content) return;

    let html = '<div class="detail-grid">';
    
    const priority = ['type', 'status', 'submittedAt', 'name', 'businessName', 'company', 'contactName', 'email', 'phone', 'address', 'message', 'details'];
    
    const formatVal = (key, val) => {
        if (key === 'submittedAt' && val && val.toDate) return val.toDate().toLocaleString();
        if (typeof val === 'object') return JSON.stringify(val);
        return val;
    };

    priority.forEach(key => {
        if (lead[key]) {
            const isLongText = ['message', 'details'].includes(key);
            html += `
                <div class="detail-item ${isLongText ? 'full-width' : ''}">
                    <label>${key}</label>
                    <p>${formatVal(key, lead[key])}</p>
                </div>
            `;
        }
    });

    html += '</div>';
    content.innerHTML = html;
    viewLeadModal.style.display = 'flex';
}

document.querySelectorAll('.view-lead-close').forEach(btn => {
    btn.addEventListener('click', () => {
        if(viewLeadModal) viewLeadModal.style.display = 'none';
    });
});