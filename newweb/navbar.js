const toggleButton = document.querySelector(".menu-toggle");
const menuIcon = toggleButton.querySelector("i"); // icono dentro del botón
const nav = document.querySelector(".nav");
const navLinks = document.querySelectorAll(".nav a");

toggleButton.addEventListener("click", () => {
  nav.classList.toggle("active");

  // Cambiar icono hamburguesa <-> cruz
  if (nav.classList.contains("active")) {
    menuIcon.classList.remove("fa-bars");
    menuIcon.classList.add("fa-times");
  } else {
    menuIcon.classList.remove("fa-times");
    menuIcon.classList.add("fa-bars");
  }
});

// Cuando hacés click en un link, cerrar el menú
navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("active");
    menuIcon.classList.remove("fa-times");
    menuIcon.classList.add("fa-bars");
  });
});

// Toggle footer hamburguer and X
const footerToggleButton = document.querySelector(".footer-menu-toggle");
const footerMenu = document.querySelector(".footer-menu");
const footerIcon = footerToggleButton.querySelector("i");

footerToggleButton.addEventListener("click", () => {
  footerMenu.classList.toggle("active");

  if (footerMenu.classList.contains("active")) {
    footerIcon.classList.remove("fa-bars");
    footerIcon.classList.add("fa-times"); // Cambiamos a ícono X
  } else {
    footerIcon.classList.remove("fa-times");
    footerIcon.classList.add("fa-bars"); // Volvemos a hamburguesa
  }
});
