async function registrarLikeSeguro(postId, currentLikes, userId) {
    const { error: errorLike } = await window.supabaseClient
        .from('likes_usuarios')
        .insert([{ user_id: userId, post_id: postId }]);

    if (errorLike) {
        if (errorLike.code === '23505') return "duplicado";
        return "error";
    }

    const { error: errorUpdate } = await window.supabaseClient
        .from('publicaciones')
        .update({ likes_count: currentLikes + 1 })
        .eq('id', postId);
    
    return errorUpdate ? "error" : "exito";
}

async function guardarComentario(postId, texto, sesion) {
    const { error } = await window.supabaseClient
        .from('comentarios')
        .insert([{
            publicacion_id: postId,
            autor_id: sesion.id,
            autor_comentario_nombre: sesion.nombre,
            contenido_comentario: texto
        }]);
    
    return !error;
}

window.gestionarLike = async (postId, currentLikes) => {
    const sesion = JSON.parse(localStorage.getItem("sesion"));
    if (!sesion) return alert("Debes iniciar sesión para dar like");

    const resultado = await registrarLikeSeguro(postId, currentLikes, sesion.id);

    if (resultado === "duplicado") {
        alert("Ya le diste like a esta publicación");
    } else if (resultado === "error") {
        alert("Hubo un error al procesar tu like");
    } else {
        cargarPublicaciones(); 
    }
};

window.enviarComentario = async (postId) => {
    const input = document.getElementById(`input-comentario-${postId}`);
    const texto = input.value.trim();
    const sesion = JSON.parse(localStorage.getItem("sesion"));

    if (!texto || !sesion) return;

    const exito = await guardarComentario(postId, texto, sesion);
    
    if (exito) {
        input.value = "";
        cargarPublicaciones(); 
    } else {
        alert("No se pudo publicar el comentario");
    }
};

