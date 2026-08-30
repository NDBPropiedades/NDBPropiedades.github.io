const toggleButton=document.querySelector(".menu-toggle"),menuIcon=toggleButton.querySelector("i"),nav=document.querySelector(".nav"),navLinks=document.querySelectorAll(".nav a");toggleButton.addEventListener("click",()=>{nav.classList.toggle("active"),nav.classList.contains("active")?(menuIcon.classList.remove("fa-bars"),menuIcon.classList.add("fa-times")):(menuIcon.classList.remove("fa-times"),menuIcon.classList.add("fa-bars"))}),navLinks.forEach(e=>{e.addEventListener("click",()=>{nav.classList.remove("active"),menuIcon.classList.remove("fa-times"),menuIcon.classList.add("fa-bars")})});const footerToggleButton=document.querySelector(".footer-menu-toggle"),footerMenu=document.querySelector(".footer-menu"),footerIcon=footerToggleButton.querySelector("i");footerToggleButton.addEventListener("click",()=>{footerMenu.classList.toggle("active"),footerMenu.classList.contains("active")?(footerIcon.classList.remove("fa-bars"),footerIcon.classList.add("fa-times")):(footerIcon.classList.remove("fa-times"),footerIcon.classList.add("fa-bars"))});

(function initScrollProgress() {
  const wrapper = document.createElement("div");
  wrapper.className = "scroll-progress";
  const bar = document.createElement("div");
  bar.className = "scroll-progress-bar";
  wrapper.appendChild(bar);
  document.body.prepend(wrapper);

  let ticking = false;

  function updateProgress() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight =
      document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = percent + "%";
    ticking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        requestAnimationFrame(updateProgress);
        ticking = true;
      }
    },
    { passive: true },
  );

  window.addEventListener("resize", updateProgress);
  updateProgress();
})();