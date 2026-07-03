
let propiedades = [];
let archivosFotos = []; 
let imagenesUrls = [];

const SUPABASE_URL = "https://delswnqvmrupvobalqyr.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_B4fMCrV7KPvfzy22uqKVWg_57X66nK6"; 

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


async function generarHash(texto) {
  const encoder = new TextEncoder();
  const data = encoder.encode(texto);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}


 //2. SISTEMA DE COMPROBACIÓN DE ACCESO

async function verificarAcceso() {
  const inputClave = document.getElementById('access-key').value;
  const errorMsg = document.getElementById('error-msg');
  
  const claveCorrecta = "Propiedades2022"; 
  
  if (inputClave === claveCorrecta) {
    if (errorMsg) errorMsg.style.display = 'none';
    
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';
    
    sessionStorage.setItem('admin_session', 'active');
    cargarPropiedades();
  } else {
    alert("Contraseña incorrecta");
    if (errorMsg) errorMsg.style.display = 'block';
    document.getElementById('access-key').value = '';
  }
}


// 3. CONTROL DE EVENTOS CENTRALIZADO

document.addEventListener("DOMContentLoaded", function() {
  const btnLogin = document.getElementById('btn-login');
  if (btnLogin) {
    btnLogin.addEventListener('click', verificarAcceso);
  }

  const accessKeyInput = document.getElementById('access-key');
  if (accessKeyInput) {
    accessKeyInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        verificarAcceso();
      }
    });
  }

  // AGREGADO: Lógica interactiva para el Ojito de la Contraseña
  const btnTogglePassword = document.getElementById('btn-toggle-password');
  if (btnTogglePassword && accessKeyInput) {
    btnTogglePassword.addEventListener('click', function() {
      const ojoIcono = document.getElementById('ojo-icono');
      
      if (accessKeyInput.type === 'password') {
        accessKeyInput.type = 'text';
        // Cambia el ojo normal por el ojo con una línea (ocultar)
        ojoIcono.classList.remove('bi-eye');
        ojoIcono.classList.add('bi-eye-slash');
      } else {
        accessKeyInput.type = 'password';
        // Vuelve al ojo normal
        ojoIcono.classList.remove('bi-eye-slash');
        ojoIcono.classList.add('bi-eye');
      }
    });
  }

  const inputImagenes = document.getElementById('imagenes');
  if (inputImagenes) {
    inputImagenes.addEventListener('change', function(e) {
      const preview = document.getElementById('preview-imagenes');
      const files = Array.from(e.target.files);
      
      if (files.length === 0) return;

      files.forEach(file => {
        archivosFotos.push(file);
        
        const imgContainer = document.createElement('div');
        imgContainer.classList.add('preview-card');
        
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.classList.add('preview-img');
        
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '×';
        deleteBtn.classList.add('btn-delete-preview');
        
        deleteBtn.onclick = function() {
          const index = archivosFotos.indexOf(file);
          if (index > -1) {
            archivosFotos.splice(index, 1);
          }
          imgContainer.remove();
        };
        
        imgContainer.appendChild(img);
        imgContainer.appendChild(deleteBtn);
        preview.appendChild(imgContainer);
      });
      
      e.target.value = "";
    });
  }

  if (sessionStorage.getItem('admin_session') === 'active') {
    if (document.getElementById('login-section')) document.getElementById('login-section').style.display = 'none';
    if (document.getElementById('admin-panel')) document.getElementById('admin-panel').style.display = 'block';
    cargarPropiedades();
  }
});

// 4. LOGICA DE NEGOCIO (CONEXIÓN SUPABASE)
async function cargarPropiedades() {
  try {
    const { data, error } = await supabaseClient
      .from('Proyecto') 
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;

    propiedades = data.map(p => {
      let urlsArray = [];
      if (p.foto_url) {
        urlsArray = p.foto_url.split(',').map(url => url.trim()).filter(url => url !== "");
      }

      return {
        id_real: p.id,
        titulo: p.nombre,
        categoria: p.categoria || "Casa", 
        precio: p.precio || "0",
        tipoPrecio: p.tipo_precio || "/ Valor Total",
        ubicacion: p.ubicacion || "",
        piezas: p.piezas || 0,
        banos: p.banos || 0,
        imagenes: urlsArray
      };
    });

  } catch (err) {
    console.error("Error al cargar propiedades de Supabase:", err);
  }
  
  renderizarPropiedades();
}

function renderizarPropiedades() {
  const contenedor = document.getElementById('lista-propiedades');
  if (!contenedor) return;
  
  if (propiedades.length === 0) {
    contenedor.innerHTML = "<p>No hay propiedades guardadas en Supabase.</p>";
    return;
  }
  
  contenedor.innerHTML = "";
  propiedades.forEach((p, idx) => {
    const sufijo = p.tipoPrecio ? p.tipoPrecio : "/ Total";
    contenedor.innerHTML += `
      <div class="propiedad-card">
        <div>
          <strong style="font-size: 1.1em; color: #111;">${p.titulo}</strong> 
          <span style="font-size: 0.85em; background: #e0e0e0; color: #333; padding: 2px 6px; border-radius: 4px; margin-left: 5px;">${p.categoria}</span><br>
          <span style="color: #28a745; font-weight: bold;">$${p.precio} ${sufijo}</span><br>
          <small style="color: #666;">📍 ${p.ubicacion} | 🛏️ ${p.piezas} piezas | 🚿 ${p.banos} baños | 📸 ${p.imagenes.length} fotos</small>
        </div>
        <div class="acciones">
          <button onclick="prepararEditar(${idx})" class="btn-edit">✏️ Editar</button>
          <button onclick="eliminarPropiedad(${idx})" class="btn-delete">❌ Borrar</button>
        </div>
      </div>
    `;
  });
}

document.getElementById('propiedad-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const idx = document.getElementById('index-propiedad').value;
  const btnGuardar = document.getElementById('btn-guardar');
  
  if (idx === "" && archivosFotos.length === 0) {
    alert("Por favor, selecciona al menos una imagen para la propiedad.");
    return;
  }

  btnGuardar.innerText = "⏳ Subiendo imágenes...";
  btnGuardar.disabled = true;
  
  try {
    let arrayUrlsFinales = [];

    if (idx !== "") {
      arrayUrlsFinales = [...imagenesUrls]; 
    }

    if (archivosFotos.length > 0) {
      for (const foto of archivosFotos) {
        const nombreUnico = `${Date.now()}_${foto.name}`;
        const { data: storageData, error: storageError } = await supabaseClient
          .storage
          .from('fotos')
          .upload(nombreUnico, foto);

        if (storageError) throw storageError;

        const { data: urlData } = supabaseClient.storage.from('fotos').getPublicUrl(nombreUnico);
        arrayUrlsFinales.push(urlData.publicUrl);
      }
    }

    const stringFotosFinal = arrayUrlsFinales.join(',');

    const payloadBD = {
      nombre: document.getElementById('titulo').value,
      categoria: document.getElementById('categoria').value,
      precio: document.getElementById('precio').value,
      tipo_precio: document.getElementById('tipoPrecio').value,
      ubicacion: document.getElementById('ubicacion').value,
      piezas: parseInt(document.getElementById('piezas').value) || 0,
      banos: parseInt(document.getElementById('banos').value) || 0,
      foto_url: stringFotosFinal
    };

    if (idx === "") {
      const { error: insertError } = await supabaseClient
        .from('Proyecto')
        .insert([payloadBD]);

      if (insertError) throw insertError;
      alert("¡Éxito! Propiedad publicada con todas sus fotos correctamente.");
    } else {
      const idReal = propiedades[idx].id_real;
      const { error: updateError } = await supabaseClient
        .from('Proyecto')
        .update(payloadBD)
        .eq('id', idReal);

      if (updateError) throw updateError;
      alert("¡Éxito! Propiedad actualizada correctamente en la nube.");
    }

    await cargarPropiedades();
    resetFormulario();

  } catch (error) {
    console.error("Error en la operación de Supabase:", error);
    alert("Ocurrió un error al guardar: " + (error.message || error));
  } finally {
    btnGuardar.disabled = false;
    btnGuardar.innerText = "Publicar Proyecto";
  }
});

async function eliminarPropiedad(idx) {
  const target = propiedades[idx];
  if (confirm(`¿Estás seguro de eliminar permanentemente "${target.titulo}"?`)) {
    try {
      const { error } = await supabaseClient
        .from('Proyecto')
        .delete()
        .eq('id', target.id_real);

      if (error) throw error;

      alert("Eliminado con éxito.");
      await cargarPropiedades();
    } catch (err) {
      alert("No se pudo eliminar: " + err.message);
    }
  }
}

function prepararEditar(idx) {
  const p = propiedades[idx];
  document.getElementById('index-propiedad').value = idx;
  document.getElementById('titulo').value = p.titulo;
  document.getElementById('categoria').value = p.categoria || "Casa"; 
  document.getElementById('precio').value = p.precio;
  document.getElementById('tipoPrecio').value = p.tipoPrecio || "/ Valor Total";
  document.getElementById('ubicacion').value = p.ubicacion;
  document.getElementById('piezas').value = p.piezas;
  document.getElementById('banos').value = p.banos;
  
  const preview = document.getElementById('preview-imagenes');
  preview.innerHTML = '';
  archivosFotos = [];
  imagenesUrls = [...p.imagenes]; 
  
  if (p.imagenes && p.imagenes.length > 0) {
    p.imagenes.forEach(url => {
      if(url === "") return;
      const imgContainer = document.createElement('div');
      imgContainer.classList.add('preview-card');
      
      const img = document.createElement('img');
      img.src = url;
      img.classList.add('preview-img');
      
      const deleteBtn = document.createElement('button');
      deleteBtn.innerHTML = '×';
      deleteBtn.classList.add('btn-delete-preview');
      
      deleteBtn.onclick = function() {
        const urlIndex = imagenesUrls.indexOf(url);
        if (urlIndex > -1) {
          imagenesUrls.splice(urlIndex, 1);
        }
        imgContainer.remove();
      };
      
      imgContainer.appendChild(img);
      imgContainer.appendChild(deleteBtn);
      preview.appendChild(imgContainer);
    });
  }
  
  document.getElementById('form-title').innerText = "✏️ Editando: " + p.titulo;
  document.getElementById('btn-guardar').innerText = "💾 Actualizar en Internet";
  document.getElementById('btn-cancelar').style.display = "inline-block";
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetFormulario() {
  document.getElementById('propiedad-form').reset();
  document.getElementById('index-propiedad').value = "";
  document.getElementById('categoria').value = "";
  const preview = document.getElementById('preview-imagenes');
  if (preview) preview.innerHTML = '';
  archivosFotos = [];
  imagenesUrls = [];
  document.getElementById('form-title').innerText = "➕ Añadir Nueva Propiedad";
  document.getElementById('btn-guardar').innerText = "💾 Publicar Proyecto";
  document.getElementById('btn-cancelar').style.display = "none";
}

function cerrarSesion() {
  sessionStorage.removeItem('admin_session');
  document.getElementById('admin-panel').style.display = 'none';
  document.getElementById('login-section').style.display = 'block';
  document.getElementById('access-key').value = '';
}