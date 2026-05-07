// js/conexion.js
const supabaseUrl = 'https://csicfyvadluenphbfkot.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzaWNmeXZhZGx1ZW5waGJma290Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NTg3NzgsImV4cCI6MjA5MzQzNDc3OH0.R7mAUDg3-SWQWjIQM0qLjgBWQVK_4kybzK5Gi-AIzZ8';

window.supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// Función global para hashear contraseñas
window.hashPassword = async function(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
};

console.log("Conexión con Supabase configurada correctamente.");
