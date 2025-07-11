document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("submit-button");
  if (btn) {
    btn.addEventListener("click", (e) => {
      const captchaResponse = grecaptcha.getResponse();
      if (!captchaResponse) {
        e.preventDefault();
        alert("Por favor completa el reCAPTCHA antes de enviar.");
        return;
      }
      // Si reCAPTCHA está OK, el formulario se enviará normalmente (o podés manejarlo con JS)
    });
  }
});