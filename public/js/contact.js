// public/js/contact.js
import { db, app } from './config/firebase-config.js';
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    const pageLoadTime = Date.now(); // Track when the page loaded

    // Helper: Sanitize Input to prevent XSS
    const sanitize = (str) => {
        if (typeof str !== 'string') return str;
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;').trim();
    };

    // 1. Animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('is-visible');
        });
    });
    document.querySelectorAll('.fade-in-section').forEach(el => observer.observe(el));

    // 2. Auth Init (Required for Firestore write access)
    const auth = getAuth(app);
    signInAnonymously(auth).catch(err => console.error("Auth Error:", err));

    // 3. Topic Selection Logic
    const topicButtons = document.querySelectorAll('.topic-card');
    const formSection = document.getElementById('form-section');
    const topicInput = document.getElementById('topic-input');
    const formTitle = document.getElementById('form-title');
    const dynamicFields = document.querySelectorAll('.dynamic-field');

    if (topicButtons.length > 0) {
        topicButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const topic = btn.dataset.topic;
                
                // Show Form Section
                if (formSection) {
                    formSection.classList.remove('hidden');
                    // Small timeout to allow display:block to apply before scrolling
                    setTimeout(() => {
                        formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 10);
                }
                
                // Set Hidden Input Value
                if (topicInput) topicInput.value = topic;
                
                // Update Title
                if (formTitle) {
                    const titleText = btn.querySelector('.topic-title').textContent;
                    formTitle.textContent = `Submit Request: ${titleText}`;
                }

                // Reset & Show relevant fields
                dynamicFields.forEach(field => field.classList.add('hidden'));
                
                if (topic === 'billing') document.getElementById('field-billing')?.classList.remove('hidden');
                if (topic === 'availability') document.getElementById('field-address')?.classList.remove('hidden');
                if (topic === 'service') document.getElementById('field-service-type')?.classList.remove('hidden');
                if (topic === 'outage') document.getElementById('field-address')?.classList.remove('hidden');
            });
        });
    }

    // 4. Form Submit Logic
    const form = document.getElementById('support-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // --- SPAM PROTECTION ---
            const honeypot = document.getElementById('website-check');
            const isTooFast = (Date.now() - pageLoadTime) < 2000; // Block if submitted in < 2 seconds

            if ((honeypot && honeypot.value) || isTooFast) {
                console.warn("Spam detected. Submission blocked.");
                // Fake success to discourage retries
                showSuccessState();
                return; 
            }
            // -----------------------

            const btn = document.getElementById('submit-btn');
            const originalText = btn.textContent;
            btn.disabled = true;
            btn.textContent = "Submitting...";

            // Collect Data
            const formData = {
                type: 'support_ticket', // This maps to the Admin 'Leads' table
                topic: topicInput ? sanitize(topicInput.value) : 'general',
                name: sanitize(document.getElementById('name').value),
                email: sanitize(document.getElementById('email').value),
                phone: sanitize(document.getElementById('phone').value),
                message: sanitize(document.getElementById('message').value),
                submittedAt: new Date(),
                status: 'new'
            };

            // Add dynamic fields if they are visible (not hidden)
            const accNum = document.getElementById('account-number');
            if(accNum && !accNum.closest('.hidden')) formData.accountNumber = sanitize(accNum.value);

            const addr = document.getElementById('address');
            if(addr && !addr.closest('.hidden')) formData.address = sanitize(addr.value);

            const issue = document.getElementById('issue-type');
            if(issue && !issue.closest('.hidden')) formData.issueType = sanitize(issue.value);

            try {
                // Ensure auth before write
                if (!auth.currentUser) {
                    await signInAnonymously(auth);
                }

                // Using the specific App ID path consistent with Admin JS
                const appId = '162296779236'; 
                await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'leads'), formData);
                
                showSuccessState();

            } catch (err) {
                console.error("Support Submit Error:", err);
                alert("Error submitting ticket. Please try again or call us directly.");
                btn.disabled = false;
                btn.textContent = originalText;
            }
        });
    }

    function showSuccessState() {
        const container = document.querySelector('.form-container');
        const successMsg = document.getElementById('success-message');
        
        if (container) container.style.display = 'none';
        if (successMsg) {
            successMsg.classList.remove('hidden');
            successMsg.style.display = 'block';
        }
    }
});