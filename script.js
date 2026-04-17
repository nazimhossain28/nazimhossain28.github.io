// ============================================
// Navigation
// ============================================
const navbar = document.getElementById('navbar');
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
});

navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('active');
});

// Close mobile menu on link click
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('active');
  });
});

// ============================================
// Abstract toggle (event delegation, no inline JS)
// ============================================
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action="toggle-abstract"]');
  if (!btn) return;
  const content = btn.nextElementSibling;
  const isVisible = content.classList.contains('visible');
  content.classList.toggle('visible');
  btn.textContent = isVisible ? 'Show Abstract' : 'Hide Abstract';
});

// ============================================
// Scroll animations
// ============================================
function initScrollAnimations() {
  const elements = document.querySelectorAll(
    '.timeline-item, .experience-card, .research-card, .achievement-card, .contact-card, .about-content, .interest-tags'
  );

  elements.forEach(el => el.classList.add('fade-in'));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  elements.forEach(el => observer.observe(el));
}

// ============================================
// Active nav link on scroll
// ============================================
function initActiveNavTracking() {
  const sections = document.querySelectorAll('section[id]');
  const navAnchors = document.querySelectorAll('.nav-links a');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const top = section.offsetTop - 100;
      if (window.scrollY >= top) {
        current = section.getAttribute('id');
      }
    });

    navAnchors.forEach(a => {
      a.style.color = '';
      if (a.getAttribute('href') === '#' + current) {
        a.style.color = 'var(--primary)';
      }
    });
  });
}

// ============================================
// Back to Top
// ============================================
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  });
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ============================================
// Timeline scroll progress
// ============================================
function initTimelineProgress() {
  const timeline = document.getElementById('educationTimeline');
  const progressBar = document.getElementById('timelineProgress');
  const items = timeline.querySelectorAll('.timeline-item');
  if (!items.length) return;

  function updateTimeline() {
    var timelineRect = timeline.getBoundingClientRect();
    var timelineTop = timelineRect.top + window.scrollY;
    var timelineHeight = timeline.offsetHeight;

    // Determine active item based on scroll — each item activates
    // when its marker scrolls past the viewport middle
    var scrollMiddle = window.scrollY + window.innerHeight * 0.5;
    var activeIndex = -1;

    items.forEach(function(item, index) {
      var itemTop = timelineTop + item.offsetTop + 13; // marker center
      if (scrollMiddle >= itemTop) {
        activeIndex = index;
      }
    });

    var totalItems = items.length;

    items.forEach(function(item, index) {
      item.classList.remove('active', 'passed');
      if (activeIndex >= 0) {
        if (index < activeIndex) {
          item.classList.add('passed');
        } else if (index === activeIndex) {
          item.classList.add('active');
        }
      }
    });

    // Update progress bar height to reach the active marker
    if (activeIndex >= 0) {
      var activeItem = items[activeIndex];
      var markerCenter = activeItem.offsetTop + 13;
      if (activeIndex === totalItems - 1) {
        // Last item: extend to the full grey line (bottom - 4px)
        progressBar.style.height = (timelineHeight - 4) + 'px';
      } else {
        progressBar.style.height = markerCenter + 'px';
      }
    } else {
      progressBar.style.height = '0px';
    }
  }

  window.addEventListener('scroll', updateTimeline);
  updateTimeline();
}

// ============================================
// Init
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  initScrollAnimations();
  initActiveNavTracking();
  initBackToTop();
  initTimelineProgress();
  document.getElementById('footerYear').textContent = new Date().getFullYear();
});
