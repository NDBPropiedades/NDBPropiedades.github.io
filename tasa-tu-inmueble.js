document.getElementById("contactForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const API_KEY = "76c2e21bd630d16cfdb33e96f43fc013eafc4173";
  const API_URL = `https://tokkobroker.com/api/v1/webcontact/?key=${API_KEY}`;

  const name = document.getElementById("name")?.value.trim() || "";
  const email = document.getElementById("email")?.value.trim() || "";
  const phone = document.querySelector("[name='telefono']")?.value.trim() || "";
  const localidad = document.getElementById("localidad")?.value.trim() || "";
  const operacion = document.querySelector("[name='tipo_operacion']")?.value.trim() || "";
  const tipoInmueble = document.querySelector("[name='tipo_inmueble']")?.value.trim() || "";
  const mensaje = document.getElementById("mensaje")?.value.trim() || "";

  const text = `
    Localidad: ${localidad}
    Operación: ${operacion}
    Tipo de Inmueble: ${tipoInmueble}
    Mensaje: ${mensaje}
  `.trim();

  if (!name || (!phone && !email)) {
    alert("Completá al menos nombre y teléfono o email.");
    return;
  }

const payload = {
  name: name,
  email: email,
  phone: phone,        
  cellphone: phone,    
  text: text,
  tags: ["Formulario Web", "Tasacion"],
  agent_mail: "info@ndbpropiedades.com.ar"
};

  fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  })
  .then((res) => {
    if (!res.ok) throw new Error(`Error en el envío (${res.status})`);
    alert("Formulario enviado correctamente.");
    window.location.href = "https://ndbpropiedades.com.ar/gracias.html";
  })
  .catch((err) => {
    console.error("❌ Error al enviar:", err);
    alert("Ocurrió un error al enviar el formulario. Por favor, intentá nuevamente.");
  });
});