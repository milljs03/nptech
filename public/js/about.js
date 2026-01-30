// public/assets/js/about.js

function startAboutAnimation() {
    // Select the counter element
    const counterElement = document.getElementById('year-counter');
    const targetYear = 125;
    const duration = 2000; // Animation duration in milliseconds

    if (!counterElement) return;

    // We specifically do NOT reset to 0 immediately here to prevent flickering 
    // if the observer hasn't triggered yet. We rely on the animation to overwrite it.

    // Animation Logic
    const animateCounter = () => {
        // Only set to 0 right before animation starts
        counterElement.innerText = '0'; 
        
        let startTime = null;

        const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            
            // Easing function for smooth stop (easeOutExpo)
            const easeOut = 1 - Math.pow(2, -10 * progress);
            
            const currentCount = Math.floor(easeOut * targetYear);
            counterElement.innerText = currentCount;

            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                counterElement.innerText = targetYear; // Ensure it ends exactly on 125
            }
        };

        window.requestAnimationFrame(step);
    };

    // Use Intersection Observer to start animation when element is in view
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter();
                    observer.unobserve(entry.target); // Run only once
                }
            });
        }, { threshold: 0.1 }); // Trigger as soon as 10% is visible

        observer.observe(counterElement);
    } else {
        // Fallback for browsers without IntersectionObserver
        animateCounter();
    }
}

// Ensure DOM is ready before running
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startAboutAnimation);
} else {
    // If the script loads after DOMContentLoaded (common in previews), run immediately
    startAboutAnimation();
}