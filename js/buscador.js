async function inicializarBuscador() {
    const input = document.getElementById('inputBusqueda');
    const res = document.getElementById('resultadosBusqueda');

    // Si los elementos no existen en la página actual, detener el script sin error
    if (!input || !res) return;

    input.oninput = async (e) => {
        const q = e.target.value.trim();

        if (q.length < 1) {
            res.innerHTML = "";
            res.style.display = "none";
            return;
        }

        try {
            // Buscamos en la tabla 'usuarios' usando el cliente global
            const { data, error } = await window.supabaseClient
                .from('usuarios')
                .select('id, nombre, email, foto_perfil')
                .ilike('nombre', `%${q}%`)
                .limit(5);

            if (error) throw error;

            if (data && data.length > 0) {
                res.style.display = "block";
                res.innerHTML = data.map(u => `
                    <div class="hover-result" 
                         style="padding: 12px; border-bottom: 1px solid var(--border); cursor: pointer; display: flex; align-items: center; gap: 12px;"
                         onclick="location.href='perfil.html?id=${u.id}'">
                        <img src="${u.foto_perfil || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.nombre)}&background=002f6c&color=c8a951&bold=true`}" 
                             style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover; border: 1px solid var(--gold); flex-shrink: 0;">
                        <div style="overflow: hidden;">
                            <div style="font-weight: 600; color: #fff; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${u.nombre}</div>
                            <div style="color: #888; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${u.email}</div>
                        </div>
                    </div>
                `).join('');
            } else {
                res.style.display = "block";
                res.innerHTML = '<div style="padding: 15px; text-align: center; color: #888; font-size: 12px;">Sin coincidencias</div>';
            }
        } catch (err) {
            console.error("Error en búsqueda:", err.message);
        }
    };

    // Cerrar al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !res.contains(e.target)) {
            res.style.display = "none";
        }
    });
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', inicializarBuscador);