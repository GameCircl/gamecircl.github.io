document.addEventListener("DOMContentLoaded", () => {
  // Jahr automatisch einfügen
  document.getElementById("year").textContent = new Date().getFullYear();

  // Fade-in beim Scrollen
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
});