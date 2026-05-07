const form = document.getElementById("formLogin");
const mensaje = document.getElementById("mensaje");

form.addEventListener("submit", async function(e) {
  e.preventDefault();

  const inputField = document.getElementById("email");
  const passwordField = document.getElementById("password");

  const input = inputField.value.trim();
  const password = passwordField.value;

  // Limpiar estados previos
  mensaje.innerHTML = "";
  inputField.classList.remove("is-invalid", "is-valid");
  passwordField.classList.remove("is-invalid", "is-valid");

  // 1. Validación básica de campos vacíos
  if (!input || !password) {
    inputField.classList.add("is-invalid");
    passwordField.classList.add("is-invalid");
    return mostrarError("Completa todos los campos");
  }

  try {
    let emailFinal = input;

    // 2. Si el usuario ingresó un NÚMERO DE CUENTA, necesitamos obtener su correo primero
    // porque Supabase Auth solo inicia sesión con Email.
    const esSoloNumeros = /^\d+$/.test(input);
    
    if (esSoloNumeros) {
      if (input.length !== 9) {
        inputField.classList.add("is-invalid");
        return mostrarError("El número de cuenta debe tener 9 dígitos");
      }

      // Buscamos el correo asociado a ese número de cuenta en nuestra tabla pública
      const { data: usuarioData, error: errorBusqueda } = await window.supabaseClient
        .from('usuarios')
        .select('email')
        .eq('numero_cuenta', input)
        .single();

      if (errorBusqueda || !usuarioData) {
        throw new Error("No existe una cuenta asociada a ese número.");
      }
      emailFinal = usuarioData.email;
    }

    // 3. INTENTO DE LOGIN CON SUPABASE AUTH
    const { data: authData, error: authError } = await window.supabaseClient.auth.signInWithPassword({
      email: emailFinal,
      password: password,
    });

    if (authError) {
      if (authError.message === "Invalid login credentials") {
        throw new Error("Correo o contraseña incorrectos");
      }
      throw authError;
    }

    // 4. Obtener los datos del perfil (nombre, institución, etc.) para la sesión local
    const { data: perfil, error: perfilError } = await window.supabaseClient
      .from('usuarios')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (perfilError) throw perfilError;

    // 5. ÉXITO: Guardar sesión y redirigir
    inputField.classList.add("is-valid");
    passwordField.classList.add("is-valid");

    // Función para detectar institución (opcional, si quieres mostrarla en el mensaje)
    const miInstitucion = detectarInstitucion(perfil.email);
    mostrarExito(`Bienvenido, ${perfil.nombre.split(' ')[0]} ✔`);

    const datosSesion = {
      id: perfil.id,
      nombre: perfil.nombre,
      email: perfil.email,
      numero_cuenta: perfil.numero_cuenta,
      institucion: miInstitucion
    };

    localStorage.setItem("sesion", JSON.stringify(datosSesion));

    setTimeout(() => {
      window.location.href = "inicioRed.html"; // Cambia esto a tu página de inicio real
    }, 1000);

  } catch (err) {
    console.error("ERROR LOGIN:", err.message);
    inputField.classList.add("is-invalid");
    passwordField.classList.add("is-invalid");
    mostrarError(err.message || "Error al iniciar sesión");
  }
});

// Función auxiliar para el nombre de la institución
function detectarInstitucion(email) {
    const instituciones = {
       "@aragon.unam.mx": "FES Aragón",
      "@iztacala.unam.mx": "FES Iztacala",
      "@acatlan.unam.mx": "FES Acatlán",
      "@cuautitlan.unam.mx": "FES Cuautitlán",
      "@zaragoza.unam.mx": "FES Zaragoza",
      "@arquitectura.unam.mx": "Facultad de Arquitectura",
      "@fad.unam.mx": "Facultad de Artes y Diseño",
      "@ciencias.unam.mx": "Facultad de Ciencias",
      "@politicas.unam.mx": "Facultad de Ciencias Políticas y Sociales",
      "@fca.unam.mx": "Facultad de Contaduría y Administración",
      "@derecho.unam.mx": "Facultad de Derecho",
      "@economia.unam.mx": "Facultad de Economía",
      "@filos.unam.mx": "Facultad de Filosofía y Letras",
      "@ingenieria.unam.mx": "Facultad de Ingeniería",
      "@facmed.unam.mx": "Facultad de Medicina",
      "@fmvz.unam.mx": "Facultad de Medicina Veterinaria y Zootecnia",
      "@musica.unam.mx": "Facultad de Música",
      "@odontologia.unam.mx": "Facultad de Odontología",
      "@psicologia.unam.mx": "Facultad de Psicología",
      "@quimica.unam.mx": "Facultad de Química",
      "@enes.morelia.unam.mx": "ENES Morelia",
      "@enes.leon.unam.mx": "ENES León",
      "@enes.juriquilla.unam.mx": "ENES Juriquilla",
      "@emes.merida.unam.mx": "ENES Mérida",
      "@unam.mx": "Comunidad UNAM"
    };
    const correo = email.toLowerCase();
    for (const dominio in instituciones) {
        if (correo.endsWith(dominio)) return instituciones[dominio];
    }
    return "Comunidad UNAM";
}

function mostrarError(msg) {
  mensaje.innerHTML = `<div class="alert alert-danger py-2 small shadow-sm">${msg}</div>`;
}

function mostrarExito(msg) {
  mensaje.innerHTML = `<div class="alert alert-success py-2 small shadow-sm">${msg}</div>`;
}