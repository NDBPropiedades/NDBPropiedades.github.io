document.addEventListener("DOMContentLoaded", () => {
  function onSubmitCaptcha() {
    grecaptcha.ready(() => {
      grecaptcha
        .execute("6Lf8RCorAAAAAKHkFqg0E9kAlzjeS7Yl-1Z3n-qz", { action: "submit" })
        .then((token) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = "g-recaptcha-response";
          input.value = token;
          document.getElementById("contactForm").appendChild(input);
          document.getElementById("contactForm").submit();
        });
    });
  }

  const btn = document.getElementById("submit-button");
  if (btn) {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      onSubmitCaptcha();
    });
  }
});