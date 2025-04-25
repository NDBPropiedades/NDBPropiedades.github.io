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
* Easy selector helper function
*/
const select = (el, all = false) => {
 el = el.trim();
 return all
   ? [...document.querySelectorAll(el)]
   : document.querySelector(el);
};

let preloader = select("#preloader");
if (preloader) {
  window.addEventListener("load", () => {
    preloader.remove();
  });
}  
