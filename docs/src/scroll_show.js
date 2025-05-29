const sections = document.querySelectorAll('.content-section'); // Or a more specific selector
sections.forEach(section => section.classList.add('before-animate'));

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in-view');
            // observer.unobserve(entry.target); // Optional: stop observing once animated
        }
    });
}, { threshold: 0.1 }); // Adjust threshold as needed

sections.forEach(section => observer.observe(section));