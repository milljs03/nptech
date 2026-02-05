// public/js/header.js

export function loadHeader() {
    // Prevent duplicate injection
    if (document.querySelector('nav.navbar')) return;

    const headerHTML = `
    <nav class="navbar">
        <a href="index.html" class="logo-container">
            <img src="assets/images/NPtech_logo.png" alt="NPTech" class="logo-img">
        </a>
        <ul class="nav-links">
            <li><a href="index.html">Home</a></li>
            <li><a href="residential.html">Residential</a></li>
            <li><a href="index.html#divisions">Divisions</a></li>
            <li><a href="about.html">About Us</a></li>
            <li><a href="blog.html">News</a></li>
            <li><a href="careers.html">Careers</a></li>
            <li><a href="contact.html">Contact</a></li>
            
            <!-- Bill Pay Dropdown -->
            <li class="dropdown-container">
                <a href="#" class="dropdown-toggle btn-nav-highlight">Pay Bill</a>
                <ul class="dropdown-menu">
                    <li><a href="https://nptel.smarthub.coop/Login.html" target="_blank"><i class="fa-solid fa-lock" style="margin-right:8px;"></i> Login</a></li>
                    <li><a href="https://nptel.smarthub.coop/PayNow.html" target="_blank"><i class="fa-solid fa-bolt" style="margin-right:8px;"></i> Quick Pay</a></li>
                </ul>
            </li>
        </ul>
        <div class="mobile-menu-btn">☰</div>
    </nav>
    `;

    // Inject header at the start of the body
    document.body.insertAdjacentHTML('afterbegin', headerHTML);

    // --- Active Link Logic ---
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-links a');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath) {
            link.classList.add('active');
        }
    });

    // --- Mobile Menu Logic ---
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navList = document.querySelector('.nav-links');

    if (mobileBtn && navList) {
        mobileBtn.addEventListener('click', () => {
            navList.classList.toggle('active');
            mobileBtn.textContent = navList.classList.contains('active') ? '✕' : '☰';
        });
    }
}
