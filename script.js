// ==== THEME SWITCHER ====
const themeMarker = document.getElementById("themeMarker");
const themePoints = document.querySelectorAll(".theme-points span");

function setTheme(mode) {
  if (mode === "auto") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", mode);
  }
  localStorage.setItem("theme", mode);

  const index = { auto:0, light:1, dark:2 }[mode];
  themeMarker.style.transform = `translateX(${index * 100}%)`;
}

const savedTheme = localStorage.getItem("theme") || "auto";
setTheme(savedTheme);

themePoints.forEach(span => {
  span.addEventListener("click", () => setTheme(span.dataset.mode));
});

// ==== SIDEBAR TOGGLE ====
const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const sidebarOverlay = document.getElementById("sidebarOverlay");

sidebarToggle.addEventListener("click", () => {
  sidebar.classList.add("show");
  sidebarOverlay.classList.remove("hidden");
});

sidebarOverlay.addEventListener("click", () => {
  sidebar.classList.remove("show");
  sidebarOverlay.classList.add("hidden");
});

// Swipe (für Mobile)
let touchStartX = 0;
document.addEventListener("touchstart", e => {
  touchStartX = e.touches[0].clientX;
});
document.addEventListener("touchend", e => {
  const diffX = e.changedTouches[0].clientX - touchStartX;
  if (diffX > 80) {
    sidebar.classList.add("show");
    sidebarOverlay.classList.remove("hidden");
  } else if (diffX < -80) {
    sidebar.classList.remove("show");
    sidebarOverlay.classList.add("hidden");
  }
});

// ==== MODAL (LOGIN) ====
const modal = document.getElementById("modal");
const openLogin = document.getElementById("openLogin");
const modalClose = document.getElementById("modalClose");

openLogin.addEventListener("click", () => {
  modal.classList.remove("hidden");
});
modalClose.addEventListener("click", () => {
  modal.classList.add("hidden");
});

// ==== YEAR FOOTER ====
document.getElementById("year").textContent = new Date().getFullYear();

// ==== DEMO STATS HANDLING ====
const usernameInput = document.getElementById("username");
const saveUser = document.getElementById("saveUser");
const logoutBtn = document.getElementById("logoutBtn");
const miniName = document.getElementById("miniName");

saveUser.addEventListener("click", () => {
  localStorage.setItem("username", usernameInput.value);
  miniName.textContent = usernameInput.value || "GameCircl";
});
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("username");
  usernameInput.value = "";
  miniName.textContent = "GameCircl";
});

// restore name
const storedName = localStorage.getItem("username");
if (storedName) {
  miniName.textContent = storedName;
  usernameInput.value = storedName;
}
