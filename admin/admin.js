let propiedades = [];
let imagenesBase64 = [];
// Al inicio de admin/admin.js
const SUPABASE_URL = "https://tu-url-de-supabase.supabase.co"; // Tu url de project settings
const SUPABASE_ANON_KEY = "sb_publishable_B4fMCrV7KPvfzy22uqKVWg_57X66nK6"; // La publishable key que me mostraste

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// Hash SHA-256 correspondiente a la contraseña "2026"
const CONTRASEÑA_HASH_SECRETO = "2026";


// Función interna para generar el hash en tiempo real de forma segura
async function sha256(string) {
  const utf8 = new TextEncoder().encode(string);
  const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Comprobación de seguridad encriptada sin revelar la clave original
async function verificarAcceso() {
  const inputClave = document.getElementById('access-key').value;
  const errorMsg = document.getElementById('error-msg');
  
  // Encriptamos la clave introducida por el input
  const hashInput = await sha256(inputClave);

  // Comparamos los hashes criptográficos en vez de los textos planos
  if (hashInput === CONTRASEÑA_HASH_SECRETO) {
    errorMsg.style.display = 'none';
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';
    
    // Guardamos sesión temporal en la pestaña activa
    sessionStorage.setItem('admin_session', 'active');

    cargarPropiedades();
  } else {
    errorMsg.style.display = 'block';
    document.getElementById('access-key').value = '';
  }
}

// Carga los datos desde el LocalStorage del navegador
function cargarPropiedades() {
  const datosLocales = localStorage.getItem('propiedades_local');
  if (datosLocales) {
    propiedades = JSON.parse(datosLocales);
  } else {
    // Caso base inicial de prueba si está vacío
    propiedades = [
      {
        titulo: "Casa de Prueba Local en Vitacura",
        precio: "12.500",
        tipoPrecio: "/ Valor Total",
        ubicacion: "Vitacura, Santiago",
        piezas: 4,
        banos: 3,
        imagenes: ["images/casa1.jpg"]
      }
    ];
    localStorage.setItem('propiedades_local', JSON.stringify(propiedades));
  }
  renderizarPropiedades();
}

// Escucha la tecla Enter en el campo de contraseña para mejorar la experiencia
document.getElementById('access-key').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    verificarAcceso();
  }
});

// Mantener la sesión iniciada de manera fluida si se recarga la página por accidente
document.addEventListener("DOMContentLoaded", function() {
  if (sessionStorage.getItem('admin_session') === 'active') {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';
    cargarPropiedades();
  }
});

// Preview de múltiples imágenes seleccionadas con opción individual de eliminación
document.getElementById('imagenes').addEventListener('change', async function(e) {
  const preview = document.getElementById('preview-imagenes');
  const files = Array.from(e.target.files);
  
  if (files.length === 0) return;

  const promesas = files.map(file => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = function(event) {
        resolve(event.target.result);
      };
      reader.readAsDataURL(file);
    });
  });

  try {
    const nuevosBase64 = await Promise.all(promesas);
    
    nuevosBase64.forEach(imgData => {
      imagenesBase64.push(imgData);
      
      const imgContainer = document.createElement('div');
      imgContainer.style.position = 'relative';
      imgContainer.style.display = 'inline-block';
      
      const img = document.createElement('img');
      img.src = imgData;
      img.style.width = '80px';
      img.style.height = '80px';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '4px';
      img.style.border = '1px solid #ddd';
      
      const deleteBtn = document.createElement('button');
      deleteBtn.innerHTML = '×';
      deleteBtn.style.position = 'absolute';
      deleteBtn.style.top = '-8px';
      deleteBtn.style.right = '-8px';
      deleteBtn.style.background = '#6c757d';
      deleteBtn.style.color = 'white';
      deleteBtn.style.border = 'none';
      deleteBtn.style.borderRadius = '50%';
      deleteBtn.style.width = '20px';
      deleteBtn.style.height = '20px';
      deleteBtn.style.cursor = 'pointer';
      deleteBtn.style.fontSize = '14px';
      deleteBtn.style.lineHeight = '1';
      
      deleteBtn.onclick = function() {
        const index = imagenesBase64.indexOf(imgData);
        if (index > -1) {
          imagenesBase64.splice(index, 1);
        }
        imgContainer.remove();
      };
      
      imgContainer.appendChild(img);
      imgContainer.appendChild(deleteBtn);
      preview.appendChild(imgContainer);
    });
  } catch (err) {
    console.error("Error al procesar las imágenes locales:", err);
  }
  
  e.target.value = "";
});

// DIBUJAR LAS TARJETAS DE PROPIEDADES EN EL PANEL
function renderizarPropiedades() {
  const contenedor = document.getElementById('lista-propiedades');
  if (propiedades.length === 0) {
    contenedor.innerHTML = "<p>No hay propiedades guardadas en la memoria local.</p>";
    return;
  }
  
  contenedor.innerHTML = "";
  propiedades.forEach((p, idx) => {
    const sufijo = p.tipoPrecio ? p.tipoPrecio : "/ Mes";
    contenedor.innerHTML += `
      <div class="propiedad-card">
        <div>
          <strong style="font-size: 1.1em; color: #111;">${p.titulo}</strong><br>
          <span style="color: #28a745; font-weight: bold;">$${p.precio} ${sufijo}</span><br>
          <small style="color: #666;">📍 ${p.ubicacion} | 🛏️ ${p.piezas} piezas | 🚿 ${p.banos} baños</small>
        </div>
        <div class="acciones">
          <button onclick="prepararEditar(${idx})" class="btn-edit">✏️ Editar</button>
          <button onclick="eliminarPropiedad(${idx})" class="btn-delete">❌ Borrar</button>
        </div>
      </div>
    `;
  });
}

// CAPTURAR EL FORMULARIO (AGREGAR O EDITAR)
document.getElementById('propiedad-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const idx = document.getElementById('index-propiedad').value;
  
  if (idx === "" && imagenesBase64.length === 0) {
    alert("Por favor, selecciona al menos una imagen para la propiedad.");
    return;
  }
  
  const nuevaPropiedad = {
    titulo: document.getElementById('titulo').value,
    precio: document.getElementById('precio').value,
    tipoPrecio: document.getElementById('tipoPrecio').value,
    ubicacion: document.getElementById('ubicacion').value,
    piezas: parseInt(document.getElementById('piezas').value),
    banos: parseInt(document.getElementById('banos').value),
    imagenes: imagenesBase64.length > 0 ? imagenesBase64 : (idx !== "" ? propiedades[idx].imagenes : [])
  };

  if (idx === "") {
    propiedades.push(nuevaPropiedad);
  } else {
    propiedades[idx] = nuevaPropiedad;
  }

  localStorage.setItem('propiedades_local', JSON.stringify(propiedades, null, 2));
  alert("¡Súper! Cambios guardados temporalmente en tu navegador.");
  
  renderizarPropiedades();
  resetFormulario();
});

// ELIMINAR PROPIEDAD DE LA BASE LOCAL
function eliminarPropiedad(idx) {
  if (confirm(`¿Estás seguro de eliminar "${propiedades[idx].titulo}"?`)) {
    propiedades.splice(idx, 1);
    localStorage.setItem('propiedades_local', JSON.stringify(propiedades, null, 2));
    renderizarPropiedades();
  }
}

// PASAR DATOS AL FORMULARIO PARA EDITAR
function prepararEditar(idx) {
  const p = propiedades[idx];
  document.getElementById('index-propiedad').value = idx;
  document.getElementById('titulo').value = p.titulo;
  document.getElementById('precio').value = p.precio;
  document.getElementById('tipoPrecio').value = p.tipoPrecio || "/ Mes";
  document.getElementById('ubicacion').value = p.ubicacion;
  document.getElementById('piezas').value = p.piezas;
  document.getElementById('banos').value = p.banos;
  
  const preview = document.getElementById('preview-imagenes');
  preview.innerHTML = '';
  imagenesBase64 = [];
  if (p.imagenes && p.imagenes.length > 0) {
    p.imagenes.forEach((imgSrc, imgIndex) => {
      imagenesBase64.push(imgSrc);
      
      const imgContainer = document.createElement('div');
      imgContainer.style.position = 'relative';
      imgContainer.style.display = 'inline-block';
      
      const img = document.createElement('img');
      img.src = imgSrc;
      img.style.width = '80px';
      img.style.height = '80px';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '4px';
      img.style.border = '1px solid #ddd';
      
      const deleteBtn = document.createElement('button');
      deleteBtn.innerHTML = '×';
      deleteBtn.style.position = 'absolute';
      deleteBtn.style.top = '-8px';
      deleteBtn.style.right = '-8px';
      deleteBtn.style.background = '#6c757d';
      deleteBtn.style.color = 'white';
      deleteBtn.style.border = 'none';
      deleteBtn.style.borderRadius = '50%';
      deleteBtn.style.width = '20px';
      deleteBtn.style.height = '20px';
      deleteBtn.style.cursor = 'pointer';
      deleteBtn.style.fontSize = '14px';
      deleteBtn.style.lineHeight = '1';
      deleteBtn.onclick = function() {
        const index = imagenesBase64.indexOf(imgSrc);
        if (index > -1) {
          imagenesBase64.splice(index, 1);
        }
        imgContainer.remove();
      };
      
      imgContainer.appendChild(img);
      imgContainer.appendChild(deleteBtn);
      preview.appendChild(imgContainer);
    });
  }
  
  document.getElementById('form-title').innerText = "✏️ Editando: " + p.titulo;
  document.getElementById('btn-guardar').innerText = "💾 Actualizar de forma Local";
  document.getElementById('btn-cancelar').style.display = "inline-block";
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// RESETEAR EL FORMULARIO A SU ESTADO INICIAL
function resetFormulario() {
  document.getElementById('propiedad-form').reset();
  document.getElementById('index-propiedad').value = "";
  document.getElementById('preview-imagenes').innerHTML = '';
  imagenesBase64 = [];
  document.getElementById('form-title').innerText = "➕ Añadir Nueva Propiedad";
  document.getElementById('btn-guardar').innerText = "💾 Guardar Cambios Localmente";
  document.getElementById('btn-cancelar').style.display = "none";
}

// CERRAR SESIÓN
function cerrarSesion() {
  sessionStorage.removeItem('admin_session');
  document.getElementById('admin-panel').style.display = 'none';
  document.getElementById('login-section').style.display = 'block';
  document.getElementById('access-key').value = '';
}