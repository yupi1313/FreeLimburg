// ===== Navbar Scroll Effect =====
const navbar = document.getElementById('navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;
    if (currentScroll > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
    lastScroll = currentScroll;
});

// ===== Mobile Hamburger Menu =====
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
});

// Close menu on link click
navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('open');
    });
});

// ===== Smooth Scroll for Nav Links =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
            const offset = 80;
            const top = target.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    });
});

// ===== Intersection Observer for Scroll Animations =====
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            // Don't unobserve so we can apply stagger delays correctly
        }
    });
}, observerOptions);

// Observe all reveal elements
document.querySelectorAll('.reveal, .timeline-item, .expertise-card, .media-card, .event-card').forEach(el => {
    observer.observe(el);
});

// ===== Counter Animation for Hero Stats =====
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number[data-count]');
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-count'));
        const duration = 2000;
        const startTime = performance.now();

        function updateCounter(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(target * easeOut);
            counter.textContent = current + '+';

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            }
        }

        requestAnimationFrame(updateCounter);
    });
}

// Trigger counter animation when hero is visible
const heroObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounters();
            heroObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.3 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) heroObserver.observe(heroStats);

// ===== Active Nav Link Highlight =====
const sections = document.querySelectorAll('section[id]');

function updateActiveNav() {
    const scrollY = window.scrollY + 100;

    sections.forEach(section => {
        const top = section.offsetTop;
        const height = section.offsetHeight;
        const id = section.getAttribute('id');

        if (scrollY >= top && scrollY < top + height) {
            navLinks.querySelectorAll('a').forEach(link => {
                link.style.color = '';
                if (link.getAttribute('href') === `#${id}`) {
                    link.style.color = '#00E5A0';
                }
            });
        }
    });
}

window.addEventListener('scroll', updateActiveNav);

// ===== Parallax for floating orbs =====
window.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 2;
    const y = (e.clientY / window.innerHeight - 0.5) * 2;

    document.querySelectorAll('.floating-orb').forEach((orb, i) => {
        const speed = (i + 1) * 8;
        orb.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
    });
});

// ===== Timeline stagger animation =====
const timelineItems = document.querySelectorAll('.timeline-item');
timelineItems.forEach((item, index) => {
    item.style.transitionDelay = `${index * 0.15}s`;
});

// ===== ESPORTS & BETTING QUIZ =====
const quizQuestions = [
    {
        q: "Which game is the most popular esport for betting worldwide?",
        options: ["Fortnite", "Counter-Strike 2", "Minecraft", "Apex Legends"],
        answer: 1,
        explanation: "Counter-Strike 2 (formerly CS:GO) is the most wagered-on esport globally, with the highest volume of bets across all major sportsbooks."
    },
    {
        q: "What is the name of the biggest Dota 2 tournament, known for its record-breaking prize pools?",
        options: ["The Major", "Worlds", "The International", "DreamHack"],
        answer: 2,
        explanation: "The International (TI) is Dota 2's premier tournament, with prize pools crowdfunded through the Battle Pass — TI10 reached over $40 million."
    },
    {
        q: "In esports betting, what does the term 'map handicap' refer to?",
        options: ["A penalty for cheating", "A head start given to the underdog in maps won", "The geographic location of the match", "A type of in-game item"],
        answer: 1,
        explanation: "Map handicap (e.g., -1.5 maps) is a popular betting market where the favored team must win by a wider margin, similar to spread betting in traditional sports."
    },
    {
        q: "According to Juana Bischoff, what percentage of a sportsbook's volume can esports represent?",
        options: ["Less than 1%", "5% to 10%", "25% to 30%", "Over 50%"],
        answer: 1,
        explanation: "In the 'Expert to Expert' series, Juana highlighted that esports can constitute 5% to 10% of a sportsbook's total volume — a significant and growing share."
    },
    {
        q: "Which country in Latin America has the largest esports audience?",
        options: ["Argentina", "Mexico", "Brazil", "Colombia"],
        answer: 2,
        explanation: "Brazil has the largest esports audience in LATAM with over 40 million fans, and its regulated betting market makes it a key focus for companies like Oddin.gg."
    },
    {
        q: "What type of bet allows you to wager on events during a live esports match?",
        options: ["Futures bet", "Outright bet", "In-play / Live bet", "Accumulator"],
        answer: 2,
        explanation: "In-play or live betting lets you place bets during a match as odds change in real-time — it's one of the fastest-growing segments in esports betting."
    },
    {
        q: "What does Oddin.gg primarily provide to sportsbook operators?",
        options: ["Gaming PCs", "B2B esports betting solutions (odds, data, risk)", "Player coaching services", "Tournament hosting"],
        answer: 1,
        explanation: "Oddin.gg is a B2B esports betting solutions provider offering odds feeds, risk management, trading services, and iFrame solutions to operators worldwide."
    },
    {
        q: "Which esport features a 5v5 tactical shooter format with an economy system for buying weapons?",
        options: ["League of Legends", "Rocket League", "VALORANT", "StarCraft II"],
        answer: 2,
        explanation: "VALORANT by Riot Games combines tactical FPS gameplay with character abilities, featuring a buy system similar to Counter-Strike. It has become a major esports betting title since launch."
    },
    {
        q: "What is the most common format for CS2 professional matches used in betting?",
        options: ["Best of 1", "Best of 3", "Best of 7", "Round Robin"],
        answer: 1,
        explanation: "Best of 3 (Bo3) is the standard format for most CS2 professional matches, offering map bans, diverse map pools, and multiple betting markets per series."
    },
    {
        q: "Which annual event is considered the world's largest gaming industry conference, where Juana Bischoff was a featured speaker?",
        options: ["E3", "ICE Barcelona", "Gamescom", "BlizzCon"],
        answer: 1,
        explanation: "ICE Barcelona (formerly ICE London) is the world's largest gaming industry conference, attracting 40,000+ professionals. Juana was a featured speaker at ICE Barcelona 2026."
    }
];

(function initQuiz() {
    const startBtn = document.getElementById('startQuiz');
    const retryBtn = document.getElementById('retryQuiz');
    const startScreen = document.getElementById('quizStart');
    const activeScreen = document.getElementById('quizActive');
    const resultsScreen = document.getElementById('quizResults');
    const progressFill = document.getElementById('quizProgressFill');
    const questionNum = document.getElementById('quizQuestionNum');
    const scoreLive = document.getElementById('quizScoreLive');
    const questionEl = document.getElementById('quizQuestion');
    const optionsEl = document.getElementById('quizOptions');
    const feedbackEl = document.getElementById('quizFeedback');
    const scoreBig = document.getElementById('quizScoreBig');
    const resultsTitle = document.getElementById('quizResultsTitle');
    const resultsMsg = document.getElementById('quizResultsMsg');
    const resultsFill = document.getElementById('quizResultsFill');
    const resultsIcon = document.getElementById('quizResultsIcon');

    if (!startBtn) return;

    let currentQ = 0;
    let score = 0;
    let answered = false;

    function shuffleArray(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    let shuffledQuestions = [];

    function startQuiz() {
        currentQ = 0;
        score = 0;
        answered = false;
        shuffledQuestions = shuffleArray(quizQuestions).slice(0, 10);
        startScreen.style.display = 'none';
        resultsScreen.style.display = 'none';
        activeScreen.style.display = 'block';
        loadQuestion();
    }

    function loadQuestion() {
        answered = false;
        const q = shuffledQuestions[currentQ];
        progressFill.style.width = `${((currentQ) / shuffledQuestions.length) * 100}%`;
        questionNum.textContent = `${currentQ + 1} / ${shuffledQuestions.length}`;
        scoreLive.textContent = `Score: ${score}`;
        questionEl.textContent = q.q;
        feedbackEl.classList.remove('show');
        feedbackEl.innerHTML = '';

        optionsEl.innerHTML = '';
        q.options.forEach((opt, i) => {
            const btn = document.createElement('button');
            btn.className = 'quiz-option';
            btn.textContent = opt;
            btn.addEventListener('click', () => selectAnswer(i, btn));
            optionsEl.appendChild(btn);
        });
    }

    function selectAnswer(index, btn) {
        if (answered) return;
        answered = true;

        const q = shuffledQuestions[currentQ];
        const allBtns = optionsEl.querySelectorAll('.quiz-option');

        allBtns.forEach(b => b.classList.add('disabled'));

        if (index === q.answer) {
            btn.classList.add('correct');
            score++;
            scoreLive.textContent = `Score: ${score}`;
            feedbackEl.innerHTML = `✅ <strong>Correct!</strong> ${q.explanation}`;
        } else {
            btn.classList.add('wrong');
            allBtns[q.answer].classList.add('correct');
            feedbackEl.innerHTML = `❌ <strong>Wrong!</strong> ${q.explanation}`;
        }

        feedbackEl.classList.add('show');

        // Auto-advance after delay
        setTimeout(() => {
            currentQ++;
            if (currentQ < shuffledQuestions.length) {
                loadQuestion();
            } else {
                showResults();
            }
        }, 2500);
    }

    function showResults() {
        activeScreen.style.display = 'none';
        resultsScreen.style.display = 'flex';
        scoreBig.textContent = score;

        const pct = (score / shuffledQuestions.length) * 100;

        if (pct >= 90) {
            resultsIcon.textContent = '🏆';
            resultsTitle.textContent = 'Esports Expert!';
            resultsMsg.textContent = 'You clearly know your stuff — Juana would be impressed! Maybe you should work in esports betting too.';
        } else if (pct >= 70) {
            resultsIcon.textContent = '🎯';
            resultsTitle.textContent = 'Solid Knowledge!';
            resultsMsg.textContent = 'Great score! You have a strong grasp of esports and the betting landscape.';
        } else if (pct >= 50) {
            resultsIcon.textContent = '🎮';
            resultsTitle.textContent = 'Getting There!';
            resultsMsg.textContent = 'Not bad! With a bit more esports watching, you will be an expert in no time.';
        } else {
            resultsIcon.textContent = '📚';
            resultsTitle.textContent = 'Time to Study!';
            resultsMsg.textContent = 'Esports is a vast world — try again and see how much you can learn!';
        }

        // Animate results bar
        setTimeout(() => {
            resultsFill.style.width = `${pct}%`;
        }, 200);
    }

    startBtn.addEventListener('click', startQuiz);
    retryBtn.addEventListener('click', () => {
        resultsFill.style.width = '0%';
        startQuiz();
    });
})();
