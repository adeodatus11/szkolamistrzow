document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Menu Toggle
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const mainNav = document.querySelector('.main-nav');

    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', () => {
            mainNav.classList.toggle('active');
            const isActive = mainNav.classList.contains('active');
            menuToggle.setAttribute('aria-expanded', isActive);
        });
    }

    // 2. Smooth Scroll behavior
    const updateHeaderOffset = () => {
        const header = document.querySelector('.main-header');
        return header ? header.offsetHeight : 80;
    };

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                // Close mobile menu if open
                if (mainNav && mainNav.classList.contains('active')) {
                    mainNav.classList.remove('active');
                }
                
                window.scrollTo({
                    top: targetElement.offsetTop - updateHeaderOffset(),
                    behavior: 'smooth'
                });
            }
        });
    });

    // 3. Counter Animation
    const counters = document.querySelectorAll('.stat-number');
    const animationDuration = 2000; // ms
    const framesPerSecond = 60;
    const totalFrames = Math.round(animationDuration / (1000 / framesPerSecond));

    const easeOutQuad = t => t * (2 - t);

    const animateCounters = () => {
        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-target'), 10);
            let frame = 0;

            const counterInterval = setInterval(() => {
                frame++;
                const progress = easeOutQuad(frame / totalFrames);
                const currentCount = Math.round(target * progress);

                if (parseInt(counter.innerText, 10) !== currentCount) {
                    counter.innerText = currentCount;
                }

                if (frame === totalFrames) {
                    clearInterval(counterInterval);
                    counter.innerText = target;
                }
            }, 1000 / framesPerSecond);
        });
    }

    // Intersection Observer for the stats section to trigger counting
    let animationTriggered = false;
    const statsContainer = document.getElementById('stats-section');
    
    if (statsContainer && window.IntersectionObserver) {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !animationTriggered) {
                animateCounters();
                animationTriggered = true; // Run only once
                observer.unobserve(statsContainer);
            }
        }, { threshold: 0.1 });
        
        observer.observe(statsContainer);
    } else {
        // Fallback if IntersectionObserver is not supported
        if (!animationTriggered && counters.length > 0) {
            animateCounters();
            animationTriggered = true;
        }
    }

    // 4. FAQ Accordion Behavior
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const isActive = question.classList.contains('active');
            
            // Close all items
            faqQuestions.forEach(q => {
                q.classList.remove('active');
                const p = q.nextElementSibling;
                if(p) p.style.maxHeight = null;
            });

            // If it wasn't active, open it
            if (!isActive) {
                question.classList.add('active');
                const answer = question.nextElementSibling;
                if(answer) {
                    answer.style.maxHeight = answer.scrollHeight + "px";
                }
            }
        });
    });
    // 5. Timeline Horizontal Scroll
    const scrollContainer = document.getElementById('htl-scroll-container');
    const prevBtn = document.getElementById('htl-prev');
    const nextBtn = document.getElementById('htl-next');

    if (scrollContainer && prevBtn && nextBtn) {
        const scrollAmount = 300; // px

        const updateScrollButtons = () => {
            const isAtStart = scrollContainer.scrollLeft <= 0;
            const isAtEnd = scrollContainer.scrollLeft + scrollContainer.clientWidth >= scrollContainer.scrollWidth - 1;
            
            prevBtn.classList.toggle('disabled', isAtStart);
            nextBtn.classList.toggle('disabled', isAtEnd);
        };

        const smoothScroll = (amount) => {
            scrollContainer.scrollBy({
                left: amount,
                behavior: 'smooth'
            });
        };

        prevBtn.addEventListener('click', () => smoothScroll(-scrollAmount));
        nextBtn.addEventListener('click', () => smoothScroll(scrollAmount));

        // Initial check and update on scroll
        scrollContainer.addEventListener('scroll', updateScrollButtons);
        window.addEventListener('resize', updateScrollButtons);
        
        // Initial state
        setTimeout(updateScrollButtons, 100);
    }
});
