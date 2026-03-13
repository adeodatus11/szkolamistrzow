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

    const scrollToElement = (element) => {
        if (!element) return;
        const headerOffset = updateHeaderOffset();
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset - 50; // 50px extra breathing room for perfect visibility

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#' || targetId === '') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                // Close mobile menu if open
                if (mainNav && mainNav.classList.contains('active')) {
                    mainNav.classList.remove('active');
                }
                
                scrollToElement(targetElement);
            }
        });
    });

    // Scroll to hash on page load (bug fix for recruitment timeline)
    if (window.location.hash) {
        window.addEventListener('load', () => {
            const target = document.querySelector(window.location.hash);
            if (target) {
                setTimeout(() => scrollToElement(target), 100);
            }
        });
    }

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

    // 4. Accordion Behavior (Event Delegation)
    document.addEventListener('click', (e) => {
        const tradeHeader = e.target.closest('.trade-accordion-header');
        if (tradeHeader) {
            const card = tradeHeader.closest('.trade-card');
            const isActive = tradeHeader.classList.contains('active');
            
            // Close all items in the same container
            const containerEl = tradeHeader.closest('section') || document.body;
            containerEl.querySelectorAll('.trade-accordion-header').forEach(q => {
                q.classList.remove('active');
                const p = q.nextElementSibling;
                if(p) p.style.maxHeight = null;
                const otherCard = q.closest('.trade-card');
                if (otherCard) otherCard.classList.remove('expanded');
            });

            // If it wasn't active, open it
            if (!isActive) {
                tradeHeader.classList.add('active');
                if (card) {
                    card.classList.add('expanded');
                    // Smooth scroll to card after it moves to top (with delay for order change and animation)
                    setTimeout(() => {
                        scrollToElement(card);
                    }, 300); // 300ms delay for layout and genie animation stabilization
                }
                const answer = tradeHeader.nextElementSibling;
                if(answer) {
                    answer.style.maxHeight = answer.scrollHeight + "px";
                }
            }
        }
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

    // 6. Employers Page Logic (XML Loader)
    const employersRoot = document.getElementById('employers-root');
    const searchInput = document.getElementById('employer-search');
    let allTradesData = [];

    if (employersRoot) {
        const loadEmployers = async () => {
            try {
                // Try from global variable first (embedded in HTML)
                if (window.EMPLOYERS_DATA) {
                    allTradesData = window.EMPLOYERS_DATA;
                } else {
                    // Fallback to XML if needed
                    const response = await fetch('pracodawcy.xml');
                    const xmlText = await response.text();
                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
                    const trades = xmlDoc.querySelectorAll('zawod');
                    
                    allTradesData = Array.from(trades).map(tradeNode => {
                        const rawName = tradeNode.getAttribute('nazwa') || '';
                        const cechNode = tradeNode.querySelector('cech');
                        const employersNodes = tradeNode.querySelectorAll('pracodawcy firma');
                        
                        return {
                            name: rawName,
                            cech: cechNode ? {
                                nazwa: cechNode.querySelector('nazwa_firmy')?.textContent || '',
                                adres: cechNode.querySelector('adres_firmy')?.textContent || '',
                                telefon: cechNode.querySelector('telefon')?.textContent || '',
                                email: cechNode.querySelector('email')?.textContent || '',
                                www: cechNode.querySelector('www')?.textContent || ''
                            } : null,
                            employers: Array.from(employersNodes).map(emp => ({
                                nazwa: emp.querySelector('nazwa_firmy')?.textContent || '',
                                adres: emp.querySelector('adres_firmy')?.textContent || '',
                                telefon: emp.querySelector('telefon')?.textContent || '',
                                kontakt: emp.querySelector('osoba_kontaktowa')?.textContent || ''
                            }))
                        };
                    });
                }

                // Sort alphabetically by name
                allTradesData.sort((a, b) => a.name.localeCompare(b.name, 'pl'));

                renderTrades(allTradesData);
            } catch (error) {
                console.error('Error loading data:', error);
                employersRoot.innerHTML = '<p class="error-msg">Wystąpił błąd podczas ładowania danych. Spróbuj odświeżyć stronę.</p>';
            }
        };

        const renderTrades = (tradesToShow) => {
            if (tradesToShow.length === 0) {
                employersRoot.innerHTML = '<p class="no-results">Nie znaleziono zawodów ani firm pasujących do wyszukiwania.</p>';
                return;
            }

            employersRoot.innerHTML = tradesToShow.map(trade => `
                <div class="trade-card">
                    <button class="trade-card-header trade-accordion-header" aria-expanded="false">
                        <div class="trade-header-inner">
                            <span class="trade-icon-main">${trade.icon || '🛠️'}</span>
                            <div class="trade-name">
                                ${trade.name.split(/;\s*/).filter(n => n.length > 0).map(part => {
                                    const full = part.trim();
                                    // Logic for specific "Monter zabudowy..." shortening
                                    let short = full;
                                    if (full.toLowerCase().includes("monter zabudowy i robót wykończeniowych")) {
                                        short = "monter zabudowy";
                                    }
                                    return `
                                        <div class="trade-name-line">
                                            <span class="trade-name-short">${short}</span>
                                            <span class="trade-name-full">${full}</span>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                        <i class="fa-solid fa-chevron-down trade-toggle-icon"></i>
                    </button>
                    <div class="trade-card-body trade-accordion-body">
                        <div class="trade-card-content">
                            ${trade.cech ? `
                                <div class="guild-box">
                                    <div class="guild-box-header"><span class="guild-icon">🏛️</span> Instytucja kontaktowa / Cech</div>
                                    <div class="guild-name">${trade.cech.nazwa}</div>
                                    <div class="guild-details">
                                        ${trade.cech.adres ? `<span class="guild-detail">${trade.cech.adres}</span>` : ''}
                                        ${trade.cech.telefon ? `<a href="tel:${trade.cech.telefon.replace(/\s/g, '')}" class="guild-phone">📞 ${trade.cech.telefon}</a>` : ''}
                                        ${trade.cech.email ? `<a href="mailto:${trade.cech.email}" class="guild-link">✉️ ${trade.cech.email}</a>` : ''}
                                        ${trade.cech.www ? `<a href="${trade.cech.www}" class="guild-link" target="_blank">🌐 ${trade.cech.www}</a>` : ''}
                                    </div>
                                </div>
                            ` : ''}
                            
                            <div class="employers-section-label">Pracodawcy</div>
                            ${trade.employers.length > 0 ? `
                                <div class="employers-list">
                                    ${trade.employers.map(emp => `
                                        <div class="employer-item">
                                            <div class="employer-name">${emp.nazwa}</div>
                                            ${emp.kontakt ? `<div class="employer-contact-person">👤 ${emp.kontakt}</div>` : ''}
                                            ${emp.adres ? `<div class="employer-detail"><span class="emp-icon">📍</span>${emp.adres}</div>` : ''}
                                            ${emp.telefon ? `<div class="employer-detail"><span class="emp-icon">📞</span><a href="tel:${emp.telefon.replace(/\s/g, '')}">${emp.telefon}</a></div>` : ''}
                                        </div>
                                    `).join('')}
                                </div>
                            ` : `
                                <div class="no-employers-msg">Aktualną listę pracodawców można uzyskać przez kontakt z odpowiednim cechem.</div>
                            `}
                        </div>
                    </div>
                </div>
            `).join('');
        };


        loadEmployers();
    }
});
