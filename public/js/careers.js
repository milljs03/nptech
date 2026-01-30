// public/js/careers.js
import { db } from './config/firebase-config.js';
import { collection, getDocs, query, orderBy, where } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
    const jobList = document.getElementById('job-list');
    const loadingEl = document.getElementById('loading-indicator');
    const noJobsEl = document.getElementById('no-jobs-message');

    try {
        // App ID matches your setup
        const appId = '162296779236'; 
        const jobsRef = collection(db, 'artifacts', appId, 'public', 'data', 'jobs');
        
        // Fetch jobs (Assuming we want active ones, handled by logic or simply fetching all)
        // Note: Simple query rule (Rule 2) applied. Sorting in memory if complex query fails.
        const q = query(jobsRef);
        const snapshot = await getDocs(q);
        
        let jobs = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            // Filter for active jobs only if 'isActive' field exists
            if (data.isActive !== false) { 
                jobs.push({ id: doc.id, ...data });
            }
        });

        // Hide loading
        loadingEl.classList.add('hidden');

        if (jobs.length === 0) {
            noJobsEl.classList.remove('hidden');
            return;
        }

        // Render Jobs
        jobList.classList.remove('hidden');
        jobList.innerHTML = jobs.map(job => {
            // Check if link is provided, otherwise default to contact page
            const applyLink = job.indeedUrl || `mailto:hr@nptel.com?subject=Application for ${job.title}`;
            const target = job.indeedUrl ? '_blank' : '_self';
            
            return `
                <div class="job-card fade-in-section">
                    <div class="job-info">
                        <h3>${job.title}</h3>
                        <div class="job-meta">
                            <span><i class="fa-solid fa-location-dot"></i> ${job.location || 'New Paris, IN'}</span>
                            <span><i class="fa-solid fa-clock"></i> ${job.type || 'Full Time'}</span>
                        </div>
                        <p class="job-description">${job.description || 'Join our team and make a difference.'}</p>
                    </div>
                    <a href="${applyLink}" target="${target}" class="btn-apply">Apply Now</a>
                </div>
            `;
        }).join('');

        // Trigger animations for new elements
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                }
            });
        });
        document.querySelectorAll('.job-card').forEach(el => observer.observe(el));

    } catch (error) {
        console.error("Error loading jobs:", error);
        loadingEl.classList.add('hidden');
        noJobsEl.innerHTML = '<p>Unable to load job listings at this time.</p>';
        noJobsEl.classList.remove('hidden');
    }
});