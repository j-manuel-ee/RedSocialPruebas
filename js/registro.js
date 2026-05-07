const form = document.getElementById("formRegistro");
const mensaje = document.getElementById("mensaje");

const fechaNacInput = document.getElementById("fecha_nacimiento");
if (fechaNacInput) {
    const hoy = new Date();
    const anioLimite = hoy.getFullYear() - 17;
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    
    const fechaMaximaValida = `${anioLimite}-${mes}-${dia}`;
    fechaNacInput.max = fechaMaximaValida;
}
const btnTogglePassword = document.getElementById("btnTogglePassword");
const passwordEl = document.getElementById("password");
const iconEye = document.getElementById("iconEye");

if (btnTogglePassword && passwordEl) {
  btnTogglePassword.addEventListener("click", function() {
    const isPassword = passwordEl.type === "password";
    passwordEl.type = isPassword ? "text" : "password";
    iconEye.classList.toggle("bi-eye");
    iconEye.classList.toggle("bi-eye-slash");
  });
}

form.addEventListener("submit", async function(e) {
  e.preventDefault();

  const nombre = document.getElementById("nombre");
  const email = document.getElementById("email");
  const cuenta = document.getElementById("cuenta");
  const password = document.getElementById("password");
  const fechaNac = document.getElementById("fecha_nacimiento");

  const nombreVal = nombre.value.trim();
  const emailVal = email.value.trim().toLowerCase();
  const cuentaVal = cuenta.value.trim();
  const passwordVal = password.value;
  const fechaNacVal = fechaNac.value;

  const campos = [nombre, email, cuenta, password, fechaNac];
  campos.forEach(input => input.classList.remove("is-invalid", "is-valid"));

  try {
    if (!nombreVal || !emailVal || !cuentaVal || !passwordVal || !fechaNacVal) {
      throw new Error("Todos los campos son obligatorios.");
    }

    const dominiosPermitidos = [
        "@comunidad.unam.mx", 
        "@fi.unam.mx", 
        "@ingenieria.unam.mx", 
        "@unam.mx"
    ];
    const esDominioValido = dominiosPermitidos.some(dom => emailVal.endsWith(dom));

    if (!esDominioValido) {
      email.classList.add("is-invalid");
      throw new Error("Debes usar un correo institucional (@comunidad.unam.mx, @aragon.unam.mx, etc).");
    }

    const birthDate = new Date(fechaNacVal);
    const today = new Date();
    let edad = today.getFullYear() - birthDate.getFullYear();
    const diferenciaMeses = today.getMonth() - birthDate.getMonth();
    
    if (diferenciaMeses < 0 || (diferenciaMeses === 0 && today.getDate() < birthDate.getDate())) {
        edad--;
    }

    if (edad < 17) {
        fechaNac.classList.add("is-invalid");
        throw new Error("Lo sentimos, debes tener al menos 17 años para registrarte.");
    }

    if (passwordVal.length < 6) {
        password.classList.add("is-invalid");
        throw new Error("La contraseña debe tener al menos 6 caracteres.");
    }

    if (!window.supabaseClient) {
        throw new Error("Error de conexión: No se pudo detectar el cliente de Supabase.");
    }

    const { data, error } = await window.supabaseClient.auth.signUp({
      email: emailVal,
      password: passwordVal,
      options: {
        data: {
          nombre_completo: nombreVal,
          numero_cuenta: cuentaVal,
          fecha_nacimiento: fechaNacVal
        }
      }
    });

    if (error) {
      if (error.message.includes("already registered") || error.status === 400) {
        email.classList.add("is-invalid");
        throw new Error("Este correo ya está vinculado a una cuenta.");
      }
      throw error;
    }

    mostrarExito("¡Registro exitoso! Por favor, revisa tu correo para confirmar tu cuenta.");
    
    campos.forEach(input => input.classList.add("is-valid"));
    
    form.reset();
    
    setTimeout(() => {
      window.location.href = "index.html";
    }, 3000);

  } catch (err) {
    console.error("DETALLE ERROR REGISTRO:", err.message);
    mostrarError(err.message);
  }
});

function mostrarError(msg) {
  mensaje.textContent = msg;
  mensaje.className = "alert alert-danger mt-3 animate-fade-in";
  mensaje.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function mostrarExito(msg) {
  mensaje.textContent = msg;
  mensaje.className = "alert alert-success mt-3 animate-fade-in";
  mensaje.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
