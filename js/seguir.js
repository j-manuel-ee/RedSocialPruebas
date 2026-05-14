const FollowModule = (() => {

  // ── MODAL HTML ──────────────────────────────────────────────
  function inyectarModal() {
    if (document.getElementById('follow-modal-overlay')) return;
    const tpl = document.createElement('div');
    tpl.innerHTML = `
      <div id="follow-modal-overlay" class="follow-modal-overlay" style="display:none">
        <div class="follow-modal">
          <div class="follow-modal-head">
            <div class="follow-modal-title" id="follow-modal-title">Siguiendo</div>
            <button class="follow-modal-close" id="follow-modal-close">✕</button>
          </div>
          <div class="follow-modal-body" id="follow-modal-body">
            <div class="follow-empty"><div class="empty-icon">⏳</div>Cargando...</div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(tpl.firstElementChild);

    // Cerrar al hacer clic fuera
    document.getElementById('follow-modal-overlay').addEventListener('click', (e) => {
      if (e.target === document.getElementById('follow-modal-overlay')) cerrarModal();
    });
    document.getElementById('follow-modal-close').addEventListener('click', cerrarModal);

    // Cerrar con ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') cerrarModal();
    });
  }

  // ── CONTADORES ──────────────────────────────────────────────
  async function cargarContadores(perfilId) {
    try {
      const [{ count: cntSiguiendo }, { count: cntSeguidores }] = await Promise.all([
        window.supabaseClient
          .from('seguidores')
          .select('*', { count: 'exact', head: true })
          .eq('seguidor_id', perfilId),
        window.supabaseClient
          .from('seguidores')
          .select('*', { count: 'exact', head: true })
          .eq('seguido_id', perfilId),
      ]);

      const elSiguiendo  = document.getElementById('stat-siguiendo');
      const elSeguidores = document.getElementById('stat-seguidores');
      if (elSiguiendo)  elSiguiendo.textContent  = cntSiguiendo  || 0;
      if (elSeguidores) elSeguidores.textContent = cntSeguidores || 0;
    } catch (err) {
      console.error('[FollowModule] cargarContadores:', err.message);
    }
  }

  // ── ESTADO DEL BOTÓN ────────────────────────────────────────
  async function actualizarBoton(btnEl, sesionId, perfilId) {
    if (!btnEl) return;
    try {
      const { data } = await window.supabaseClient
        .from('seguidores')
        .select('id')
        .eq('seguidor_id', sesionId)
        .eq('seguido_id', perfilId)
        .maybeSingle();

      if (data) {
        btnEl.textContent = '✔ Siguiendo';
        btnEl.classList.add('siguiendo');
      } else {
        btnEl.textContent = '➕ Seguir';
        btnEl.classList.remove('siguiendo');
      }
    } catch (err) {
      console.error('[FollowModule] actualizarBoton:', err.message);
    }
  }

  // ── TOGGLE SEGUIR / DEJAR DE SEGUIR ─────────────────────────
  async function toggle(btnEl, sesionId, perfilId, onDone) {
    if (!btnEl || btnEl.disabled) return;
    btnEl.disabled = true;
    const yaSigue = btnEl.classList.contains('siguiendo');
    try {
      if (yaSigue) {
        await window.supabaseClient
          .from('seguidores')
          .delete()
          .eq('seguidor_id', sesionId)
          .eq('seguido_id', perfilId);
        _toast('ok', 'Dejaste de seguir a este usuario');
      } else {
        await window.supabaseClient
          .from('seguidores')
          .insert([{ seguidor_id: sesionId, seguido_id: perfilId }]);
        _toast('ok', '¡Ahora sigues a este usuario!');
      }
      await actualizarBoton(btnEl, sesionId, perfilId);
      await cargarContadores(perfilId);
      if (typeof onDone === 'function') onDone();
    } catch (err) {
      _toast('error', 'Error al procesar', err.message);
    } finally {
      btnEl.disabled = false;
    }
  }

  // ── MODAL ───────────────────────────────────────────────────
  async function abrirModal(tipo, perfilId) {
    const overlay = document.getElementById('follow-modal-overlay');
    const titulo  = document.getElementById('follow-modal-title');
    const cuerpo  = document.getElementById('follow-modal-body');
    if (!overlay) return;

    titulo.innerHTML = tipo === 'siguiendo'
      ? 'A quien <span>sigues</span>'
      : 'Tus <span>seguidores</span>';

    cuerpo.innerHTML = '<div class="follow-empty"><div class="empty-icon">⏳</div>Cargando...</div>';
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    try {
      const campo    = tipo === 'siguiendo' ? 'seguido_id'  : 'seguidor_id';
      const filtro   = tipo === 'siguiendo' ? 'seguidor_id' : 'seguido_id';

      const { data: rows } = await window.supabaseClient
        .from('seguidores')
        .select(campo)
        .eq(filtro, perfilId);

      if (!rows || rows.length === 0) {
        const msg = tipo === 'siguiendo' ? 'Aún no sigues a nadie.' : 'Aún no tienes seguidores.';
        cuerpo.innerHTML = `<div class="follow-empty"><div class="empty-icon">${tipo === 'siguiendo' ? '🔭' : '👥'}</div>${msg}</div>`;
        return;
      }

      const ids = rows.map(r => r[campo]);
      const { data: perfiles } = await window.supabaseClient
        .from('usuarios')
        .select('id, nombre, email, foto_perfil')
        .in('id', ids);

      if (!perfiles || perfiles.length === 0) {
        cuerpo.innerHTML = '<div class="follow-empty">Sin usuarios para mostrar.</div>';
        return;
      }

      cuerpo.innerHTML = perfiles.map(u => {
        const avatar = u.foto_perfil
          || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.nombre)}&background=002f6c&color=c8a951&bold=true`;
        return `
          <a class="follow-user-item" href="perfil.html?id=${u.id}">
            <img class="follow-user-avatar" src="${avatar}" alt="${u.nombre}">
            <div>
              <div class="follow-user-name">${u.nombre}</div>
              <div class="follow-user-email">${u.email}</div>
            </div>
          </a>`;
      }).join('');

    } catch (err) {
      cuerpo.innerHTML = '<div class="follow-empty">Error al cargar. Intenta de nuevo.</div>';
      console.error('[FollowModule] abrirModal:', err.message);
    }
  }

  function cerrarModal() {
    const overlay = document.getElementById('follow-modal-overlay');
    if (overlay) overlay.style.display = 'none';
    document.body.style.overflow = '';
  }

  // ── TOAST (interno, si la página no tiene uno propio) ───────
  function _toast(type, title, msg = '') {
    // Intenta usar el toast del sistema de la página si existe
    if (typeof showToast === 'function') { showToast(type, title, msg); return; }
    const icons = { ok: '✅', error: '🚫', warn: '⚠️' };
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:10px;pointer-events:none;';
      document.body.appendChild(container);
    }
    const t = document.createElement('div');
    t.style.cssText = 'background:#181c24;border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:14px 16px;min-width:240px;max-width:320px;display:flex;gap:10px;pointer-events:all;box-shadow:0 8px 32px rgba(0,0,0,0.5);animation:toastIn .3s ease both;font-family:Sora,sans-serif;';
    t.innerHTML = `<span style="font-size:16px">${icons[type]||'ℹ️'}</span><div><div style="font-size:13px;font-weight:700;color:${type==='error'?'#e05252':'#34d399'}">${title}</div>${msg?`<div style="font-size:11px;color:#6b7280;margin-top:2px">${msg}</div>`:''}</div>`;
    container.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  }

  // ── API PÚBLICA ─────────────────────────────────────────────
  return { inyectarModal, cargarContadores, actualizarBoton, toggle, abrirModal, cerrarModal };

})();
