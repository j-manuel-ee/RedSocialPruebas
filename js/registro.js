/**
 * RED UNAM - Lógica de Registro de Usuarios
 * Incluye: Validación de edad (17 años), correos UNAM y Supabase Auth.
 */

const form = document.getElementById("formRegistro");
const mensaje = document.getElementById("mensaje");

// --- 1. CONFIGURACIÓN INICIAL DEL CALENDARIO (MÍNIMO 17 AÑOS) ---
// Ejecutamos esto en cuanto carga el script para limitar el selector de fecha
const fechaNacInput = document.getElementById("fecha_nacimiento");
if (fechaNacInput) {
    const hoy = new Date();
    // Restamos 17 años a la fecha actual
    const anioLimite = hoy.getFullYear() - 17;
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    
    // El atributo 'max' impide seleccionar fechas de personas menores de 17 años
    const fechaMaximaValida = `${anioLimite}-${mes}-${dia}`;
    fechaNacInput.max = fechaMaximaValida;
}

// --- 2. LÓGICA PARA VER/OCULTAR CONTRASEÑA ---
const btnTogglePassword = document.getElementById("btnTogglePassword");
const passwordEl = document.getElementById("password");
const iconEye = document.getElementById("iconEye");

if (btnTogglePassword && passwordEl) {
  btnTogglePassword.addEventListener("click", function() {
    const isPassword = passwordEl.type === "password";
    // Cambiamos el tipo de input
    passwordEl.type = isPassword ? "text" : "password";
    // Cambiamos el icono de Bootstrap Icons
    iconEye.classList.toggle("bi-eye");
    iconEye.classList.toggle("bi-eye-slash");
  });
}

// --- 3. EVENTO PRINCIPAL DE REGISTRO ---
form.addEventListener("submit", async function(e) {
  e.preventDefault();

  // Referencias a los elementos del DOM
  const nombre = document.getElementById("nombre");
  const email = document.getElementById("email");
  const cuenta = document.getElementById("cuenta");
  const password = document.getElementById("password");
  const fechaNac = document.getElementById("fecha_nacimiento");

  // Captura de valores
  const nombreVal = nombre.value.trim();
  const emailVal = email.value.trim().toLowerCase();
  const cuentaVal = cuenta.value.trim();
  const passwordVal = password.value;
  const fechaNacVal = fechaNac.value;

  // Limpiar estados de validación previos
  const campos = [nombre, email, cuenta, password, fechaNac];
  campos.forEach(input => input.classList.remove("is-invalid", "is-valid"));

  try {
    // A. VALIDACIÓN DE CAMPOS VACÍOS
    if (!nombreVal || !emailVal || !cuentaVal || !passwordVal || !fechaNacVal) {
      throw new Error("Todos los campos son obligatorios.");
    }

    // B. VALIDACIÓN DE DOMINIOS INSTITUCIONALES UNAM
    const dominiosPermitidos = [
        "@comunidad.unam.mx", 
        "@fi.unam.mx", 
        "@ingenieria.unam.mx", 
        "@unam.mx"
    ];
    const esDominioValido = dominiosPermitidos.some(dom => emailVal.endsWith(dom));

    if (!esDominioValido) {
      email.classList.add("is-invalid");
      throw new Error("Debes usar un correo institucional (@comunidad.unam.mx, @fi.unam.mx, etc).");
    }

    // C. VALIDACIÓN LÓGICA DE EDAD (MÍNIMO 17 AÑOS)
    const birthDate = new Date(fechaNacVal);
    const today = new Date();
    let edad = today.getFullYear() - birthDate.getFullYear();
    const diferenciaMeses = today.getMonth() - birthDate.getMonth();
    
    // Ajuste: Si el mes actual es menor al de nacimiento, o es el mismo mes pero el día actual es menor
    if (diferenciaMeses < 0 || (diferenciaMeses === 0 && today.getDate() < birthDate.getDate())) {
        edad--;
    }

    if (edad < 17) {
        fechaNac.classList.add("is-invalid");
        throw new Error("Lo sentimos, debes tener al menos 17 años para registrarte.");
    }

    // D. VALIDACIÓN DE CONTRASEÑA (MÍNIMO 6 CARACTERES PARA SUPABASE)
    if (passwordVal.length < 6) {
        password.classList.add("is-invalid");
        throw new Error("La contraseña debe tener al menos 6 caracteres.");
    }

    // E. PROCESO DE REGISTRO EN SUPABASE AUTH
    if (!window.supabaseClient) {
        throw new Error("Error de conexión: No se pudo detectar el cliente de Supabase.");
    }

    // El método signUp crea el usuario en auth.users y (mediante triggers) en tu tabla pública
    const { data, error } = await window.supabaseClient.auth.signUp({
      email: emailVal,
      password: passwordVal,
      options: {
        data: {
          // Estos metadatos son procesados por la base de datos
          nombre_completo: nombreVal,
          numero_cuenta: cuentaVal,
          fecha_nacimiento: fechaNacVal
        }
      }
    });

    if (error) {
      // Si el correo ya existe en Supabase Auth
      if (error.message.includes("already registered") || error.status === 400) {
        email.classList.add("is-invalid");
        throw new Error("Este correo ya está vinculado a una cuenta.");
      }
      throw error;
    }

    // --- F. ÉXITO ---
    mostrarExito("¡Registro exitoso! Por favor, revisa tu correo para confirmar tu cuenta.");
    
    // Marcar campos como válidos visualmente
    campos.forEach(input => input.classList.add("is-valid"));
    
    // Resetear formulario
    form.reset();
    
    // Redirección tras un breve tiempo para que el usuario lea el mensaje
    setTimeout(() => {
      window.location.href = "index.html";
    }, 3000);

  } catch (err) {
    console.error("DETALLE ERROR REGISTRO:", err.message);
    mostrarError(err.message);
  }
});

// --- 4. FUNCIONES DE INTERFAZ (MENSAJES) ---

function mostrarError(msg) {
  mensaje.textContent = msg;
  mensaje.className = "alert alert-danger mt-3 animate-fade-in";
  // Desplazar la vista al mensaje de error
  mensaje.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function mostrarExito(msg) {
  mensaje.textContent = msg;
  mensaje.className = "alert alert-success mt-3 animate-fade-in";
  mensaje.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
