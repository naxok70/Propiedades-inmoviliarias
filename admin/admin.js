let propiedades = [];
let imagenesBase64 = [];

// Contraseña directa en texto plano
const CONTRASEÑA_CORRECTA = "2026";

// Comprobación de seguridad directa (sin encriptar)
function verificarAcceso() {
  const inputClave = document.getElementById('access-key').value;
  const errorMsg = document.getElementById('error-msg');
  
  // Comparación directa de los textos
  if (inputClave === CONTRASEÑA_CORRECTA) {
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

// Preview de múltiples imágenes seleccionadas con COMPRESIÓN y OVERLAY uniforme para eliminación
document.getElementById('imagenes').addEventListener('change', async function(e) {
  const preview = document.getElementById('preview-imagenes');
  const files = Array.from(e.target.files);
  
  if (files.length === 0) return;

  // Función para redimensionar y comprimir la imagen usando un canvas HTML5
  function comprimirImagen(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Definimos un tamaño máximo balanceado de 800px para el catálogo
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convertimos a JPEG con calidad del 60% (baja drásticamente el peso de almacenamiento)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
          resolve(dataUrl);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  try {
    // Procesamos todas las fotos aplicando la compresión en paralelo
    const promesas = files.map(file => comprimirImagen(file));
    const nuevosBase64 = await Promise.all(promesas);
    
    nuevosBase64.forEach(imgData => {
      imagenesBase64.push(imgData);
      
      const imgContainer = document.createElement('div');
      imgContainer.className = 'preview-thumb-container';
      
      const img = document.createElement('img');
      img.src = imgData;
      
      // Capa oscura (Overlay) interactiva que reemplaza los botones desalineados
      const overlay = document.createElement('div');
      overlay.className = 'preview-thumb-overlay';
      overlay.innerHTML = '<span>✕ Eliminar</span>';
      
      overlay.onclick = function() {
        const index = imagenesBase64.indexOf(imgData);
        if (index > -1) {
          imagenesBase64.splice(index, 1);
        }
        imgContainer.remove();
      };
      
      imgContainer.appendChild(img);
      imgContainer.appendChild(overlay);
      preview.appendChild(imgContainer);
    });
  } catch (err) {
    console.error("Error al procesar y comprimir las imágenes:", err);
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
          <button onclick="eliminarPropiedad(${idx})" class="btn-delete-card" title="Eliminar Propiedad">✕ Borrar</button>
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
    mostrarNotificacion("Por favor, selecciona al menos una imagen.");
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
  mostrarNotificacion("¡Súper! Cambios guardados en tu navegador.");
  
  renderizarPropiedades();
  resetFormulario();
});

// ELIMINAR PROPIEDAD DE LA BASE LOCAL
function eliminarPropiedad(idx) {
  if (confirm(`¿Estás seguro de eliminar "${propiedades[idx].titulo}"?`)) {
    propiedades.splice(idx, 1);
    localStorage.setItem('propiedades_local', JSON.stringify(propiedades, null, 2));
    renderizarPropiedades();
    mostrarNotificacion("Propiedad eliminada correctamente.");
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
      imgContainer.className = 'preview-thumb-container';
      
      const img = document.createElement('img');
      img.src = imgSrc;
      
      const overlay = document.createElement('div');
      overlay.className = 'preview-thumb-overlay';
      overlay.innerHTML = '<span>✕ Eliminar</span>';
      
      overlay.onclick = function() {
        const index = imagenesBase64.indexOf(imgSrc);
        if (index > -1) {
          imagenesBase64.splice(index, 1);
        }
        imgContainer.remove();
      };
      
      imgContainer.appendChild(img);
      imgContainer.appendChild(overlay);
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

// Función para mostrar notificaciones flotantes modernas sin usar alert()
function mostrarNotificacion(mensaje) {
  const container = document.getElementById('toast-container');
  if (!container) return; // Salvaguarda por si acaso no encuentra el contenedor
  
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.innerHTML = `✨ ${mensaje}`;
  
  container.appendChild(toast);
  
  // Se elimina automáticamente después de 3.5 segundos con un efecto suave
  setTimeout(() => {
    toast.style.transition = 'opacity 0.5s ease';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 500);
  }, 3500);
}