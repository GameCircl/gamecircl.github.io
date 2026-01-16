document.addEventListener("DOMContentLoaded", () => {
  // Jahr automatisch einfügen
  const yearElements = document.querySelectorAll("#year");
  const currentYear = new Date().getFullYear();
  yearElements.forEach(el => {
    el.textContent = currentYear;
  });

  // ──────────────────────────────────
  // FADE-IN BEIM SCROLLEN
  // ──────────────────────────────────
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

  // ──────────────────────────────────
  // SMOOTH SCROLL FÜR NAVIGATION LINKS
  // ──────────────────────────────────
  document.querySelectorAll('.legal-nav-btn').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href');
      const targetEl = document.querySelector(targetId);
      
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ──────────────────────────────────
  // COPY-TO-CLIPBOARD FUNKTIONALITÄT
  // ──────────────────────────────────
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const copyText = btn.previousElementSibling.textContent.trim();
      
      try {
        await navigator.clipboard.writeText(copyText);
        
        // Visuelles Feedback
        const originalText = btn.textContent;
        btn.textContent = '✓';
        btn.classList.add('copied');
        
        setTimeout(() => {
          btn.textContent = originalText;
          btn.classList.remove('copied');
        }, 2000);
      } catch (err) {
        console.error('Fehler beim Kopieren:', err);
        alert('Konnte nicht kopieren. Bitte manuell kopieren.');
      }
    });
  });

  // ──────────────────────────────────
  // SMOOTH SCROLL FÜR HASH-LINKS
  // ──────────────────────────────────
  if (window.location.hash) {
    setTimeout(() => {
      const targetEl = document.querySelector(window.location.hash);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        targetEl.style.borderLeftColor = '#00ffff';
        
        setTimeout(() => {
          targetEl.style.borderLeftColor = 'transparent';
        }, 2000);
      }
    }, 100);
  }
});