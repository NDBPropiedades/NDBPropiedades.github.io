document.addEventListener("DOMContentLoaded", () => {
  const letter = document.getElementById("changing-letter");
  const options = ["o", "a"];
  let index = 0;

  setInterval(() => {
    index = (index + 1) % options.length;
    letter.classList.add("opacity-0");
    setTimeout(() => {
      letter.textContent = options[index];
      letter.classList.remove("opacity-0");
    }, 300);
  }, 2500);
});

  /**
   * Preloader
   */
  const preloader = document.querySelector("#preloader");
  if (preloader) {
    window.addEventListener("load", () => {
      preloader.remove();
    });
  }
