document.getElementById("contactForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const API_URL = "https://tokkobroker.com/api/v1/webcontact/?key=76c2e21bd630d16cfdb33e96f43fc013eafc4173";

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("telefono").value;
    const localidad = document.getElementById("localidad").value;
    const operacion = document.querySelector("[name='tipo_operacion']").value;
    const tipoInmueble = document.querySelector("[name='tipo_inmueble']").value;
    const mensaje = document.getElementById("mensaje").value;

    const text = `Localidad: ${localidad}\nOperación: ${operacion}\nTipo de inmueble: ${tipoInmueble}\nMensaje: ${mensaje}`;

    const payload = {
      name: name,
      email: email,
      phone: phone,
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
        if (!res.ok) throw new Error("Error en el envío");
        alert("Formulario enviado correctamente.");
        window.location.href = "https://ndbpropiedades.com.ar/gracias.html";
      })
      .catch((err) => {
        console.error(err);
        alert("Hubo un error al enviar. Intentá nuevamente.");
      });
  });