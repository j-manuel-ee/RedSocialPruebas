const mensaje = document.getElementById("mensaje");

// Diccionario de instituciones por término de correo
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

// Función auxiliar para detectar institución
function detectarInstitucion(email) {
    let miInstitucion = "Comunidad UNAM";
    const correoMinusculas = email.toLowerCase();
    const dominiosOrdenados = Object.keys(instituciones).sort((a, b) => b.length - a.length);

    for (const dominio of dominiosOrdenados) {
        if (correoMinusculas.endsWith(dominio)) {
            miInstitucion = instituciones[dominio];
            break;
        }
    }
    return miInstitucion;
}

// ========================
// REGISTRO CON SUPABASE AUTH
// ========================
const formRegistro = document.getElementById("formRegistro");

if (formRegistro) {
    formRegistro.addEventListener("submit", async function(e) {
        e.preventDefault();

        const nombre = document.getElementById("nombre").value.trim();
        const email = document.getElementById("email").value.trim();
        const cuenta = document.getElementById("cuenta").value.trim();
        const password = document.getElementById("password").value;
        const fecha_nacimiento = document.getElementById("fecha_nacimiento")?.value || null;

        try {
            // 🚀 Usamos Auth SignUp (esto dispara el Trigger en tu BD)
            const { data, error } = await window.supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: { // Estos campos se mapean en tu función handle_new_user()
                        nombre_completo: nombre,
                        numero_cuenta: cuenta,
                        fecha_nacimiento: fecha_nacimiento
                    }
                }
            });

            if (error) throw error;

            mensaje.innerHTML = `
                <div class="alert alert-success">
                    ¡Cuenta creada! Revisa tu correo o inicia sesión ahora.
                </div>
            `;
            setTimeout(() => { window.location.href = "index.html"; }, 1500);

        } catch (err) {
            mostrarError(err.message || "Error al registrar");
        }
    });
}

// ========================
// LOGIN CON SUPABASE AUTH
// ========================
const formLogin = document.getElementById("formLogin");

if (formLogin) {
    formLogin.addEventListener("submit", async function(e) {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        try {
            // 1. Intentar iniciar sesión (Auth maneja el password cifrado internamente)
            const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) throw new Error("Credenciales inválidas");

            // 2. Obtener datos extra de nuestra tabla pública 'usuarios' usando el ID del Auth
            const { data: perfil, error: perfilError } = await window.supabaseClient
                .from('usuarios')
                .select('*')
                .eq('id', data.user.id)
                .single();

            if (perfilError) throw perfilError;

            // 3. Detectar institución y guardar sesión
            const miInstitucion = detectarInstitucion(perfil.email);
            
            const datosSesion = {
                id: perfil.id,
                nombre: perfil.nombre,
                email: perfil.email,
                numero_cuenta: perfil.numero_cuenta,
                institucion: miInstitucion
            };

            localStorage.setItem("sesion", JSON.stringify(datosSesion));
            
            if (mensaje) {
                mensaje.innerHTML = `<div class="alert alert-success py-2">Bienvenido a ${miInstitucion}</div>`;
            }

            setTimeout(() => { window.location.href = "inicioRed.html"; }, 1000);

        } catch (err) {
            mostrarError(err.message);
        }
    });
}

// ========================
// FUNCIONES DE APOYO
// ========================
function mostrarError(msg) {
    if (!mensaje) return;
    mensaje.innerHTML = `<div class="alert alert-danger py-2 small shadow-sm">${msg}</div>`;
}

function actualizarBotonSesion() {
    const authArea = document.getElementById("authArea");
    if (!authArea) return;

    const sesion = JSON.parse(localStorage.getItem("sesion"));

    if (sesion) {
        authArea.innerHTML = `
            <div class="dropdown">
                <button class="btn btn-light btn-sm dropdown-toggle shadow-sm" data-bs-toggle="dropdown">
                    <i class="bi bi-person-circle me-1"></i> Hola, ${sesion.nombre.split(' ')[0]}
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow border-0">
                    <li class="px-3 py-2 text-center">
                        <div class="fw-bold text-truncate" style="max-width: 150px;">${sesion.nombre}</div>
                        <small class="text-muted">${sesion.email}</small>
                        <div class="small text-info fw-bold mt-1">${sesion.institucion}</div>
                    </li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="perfil.html"><i class="bi bi-gear me-2"></i>Mi Perfil</a></li>
                    <li>
                        <button class="dropdown-item text-danger" id="logout">
                            <i class="bi bi-box-arrow-right me-2"></i>Cerrar sesión
                        </button>
                    </li>
                </ul>
            </div>
        `;

        document.getElementById("logout").addEventListener("click", async () => {
            await window.supabaseClient.auth.signOut(); // Cerrar sesión en Supabase también
            localStorage.removeItem("sesion");
            location.reload();
        });
    }
}

// ==========================================
// INICIALIZACIÓN
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    actualizarBotonSesion();

    const myCarousel = document.querySelector('#carouselUnam');
    if (myCarousel) {
        new bootstrap.Carousel(myCarousel, {
            interval: 2500,
            ride: 'carousel',
            pause: false
        }).cycle();
    }
});