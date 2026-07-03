// Importar los módulos necesarios de Firestore directamente (SDK Modular)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Tu configuración oficial de Firebase (Plan Spark - 100% Gratis)
const firebaseConfig = {
  apiKey: "AIzaSyB8uF6_GvF84zT9jNqLz_XmZP3g-k90uEs",
  authDomain: "propiedades-fdf8b.firebaseapp.com",
  projectId: "propiedades-fdf8b",
  storageBucket: "propiedades-fdf8b.appspot.com",
  messagingSenderId: "364539660309",
  appId: "1:364539660309:web:15fbfa1370df33118aee44"
};

// Inicializar Firebase y Cloud Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Configuración de acceso básico
const CONTRASEÑA_CORRECTA = "2026";
let imagenesBase64 = []; 

// Referencias del DOM
const loginWrapper = document.getElementById('login-wrapper');
const adminPanel = document.getElementById('admin-panel');
const form = document.getElementById('propiedad-form');
const btnCancelar = document.getElementById('btn-cancelar');
const formTitle = document.getElementById('form-title');
const inputImagenes = document.getElementById('imagenes');
const previewContenedor = document.getElementById('preview-imagenes');

// --- SISTEMA DE AUTENTICACIÓN ---
document.getElementById('btn-login').addEventListener('click', verificarAcceso);
document.getElementById('btn-cerrar-sesion').addEventListener('click', cerrarSesion);

function verificarAcceso() {
    const inputClave = document.getElementById('access-key').value;
    const errorMsg = document.getElementById('error-msg');
    
    if (inputClave === CONTRASEÑA_CORRECTA) {
        errorMsg.style.display = 'none';
        if (loginWrapper) loginWrapper.style.display = 'none';
        document.getElementById('login-section').style.display = 'none';
        adminPanel.style.display = 'block';
        sessionStorage.setItem('admin_session', 'active');
        cargarPropiedades();
    } else {
        errorMsg.style.display = 'block';
        document.getElementById('access-key').value = '';
    }
}

function cerrarSesion() {
    sessionStorage.removeItem('admin_session');
    location.reload();
}

// --- NOTIFICACIONES TOAST (REEMPLAZAN AL ALERT) ---
function mostrarNotificacion(mensaje) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `✨ ${mensaje}`;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.transition = 'opacity 0.5s ease';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 3500);
}

// --- PREVISUALIZACIÓN Y COMPRESIÓN MÁXIMA DE IMÁGENES ---
inputImagenes.addEventListener('change', async function(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Redimensiona y comprime a JPEG pesado ultraligero para Firestore
    function comprimirImagen(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    
                    const MAX_WIDTH = 600; // Tamaño optimizado para almacenamiento no relacional
                    const MAX_HEIGHT = 600;
                    
                    if (width > height) {
                        if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                    } else {
                        if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Calidad al 50% reduce drásticamente el string de caracteres del Base64
                    resolve(canvas.toDataURL('image/jpeg', 0.5));
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    try {
        const promesas = files.map(file => comprimirImagen(file));
        const nuevasImagenes = await Promise.all(promesas);

        nuevasImagenes.forEach(imgData => {
            imagenesBase64.push(imgData);
            
            const imgContainer = document.createElement('div');
            imgContainer.className = 'preview-thumb-container';
            
            const img = document.createElement('img');
            img.src = imgData;
            
            const overlay = document.createElement('div');
            overlay.className = 'preview-thumb-overlay';
            overlay.innerHTML = '<span>✕ Eliminar</span>';
            
            overlay.onclick = function() {
                imgContainer.remove();
                imagenesBase64 = imagenesBase64.filter(i => i !== imgData);
            };
            
            imgContainer.appendChild(img);
            imgContainer.appendChild(overlay);
            previewContenedor.appendChild(imgContainer);
        });
    } catch (err) {
        console.error("Error al procesar imágenes:", err);
    }
    
    e.target.value = "";
});

// --- ENVIAR FORMULARIO (CREAR O EDITAR EN LA NUBE) ---
form.addEventListener('submit', async function(e) {
    e.preventDefault();
    const idPropiedad = document.getElementById('id-propiedad').value;
    
    if (idPropiedad === "" && imagenesBase64.length === 0) {
        mostrarNotificacion("Por favor, selecciona al menos una imagen.");
        return;
    }
    
    const btnGuardar = document.getElementById('btn-guardar');
    btnGuardar.disabled = true;
    btnGuardar.innerText = "⏳ Guardando datos en la nube...";

    try {
        const datosPropiedad = {
            titulo: document.getElementById('titulo').value,
            precio: document.getElementById('precio').value,
            tipoPrecio: document.getElementById('tipoPrecio').value,
            ubicacion: document.getElementById('ubicacion').value,
            piezas: parseInt(document.getElementById('piezas').value) || 0,
            banos: parseInt(document.getElementById('banos').value) || 0,
            imagenes: imagenesBase64, // Array de strings Base64 directo a Firestore
            fechaRegistro: new Date().toISOString()
        };

        if (idPropiedad === "") {
            // Guardar nueva propiedad
            await addDoc(collection(db, "propiedades"), datosPropiedad);
            mostrarNotificacion("¡Propiedad guardada en la nube con éxito!");
        } else {
            // Actualizar propiedad existente
            const docRef = doc(db, "propiedades", idPropiedad);
            await updateDoc(docRef, datosPropiedad);
            mostrarNotificacion("¡Propiedad actualizada exitosamente!");
        }

        resetFormulario();
        cargarPropiedades();
    } catch (error) {
        console.error("Error al guardar en Firebase Firestore:", error);
        mostrarNotificacion("Error de red al intentar guardar en la nube.");
    } finally {
        btnGuardar.disabled = false;
        btnGuardar.innerText = "💾 Guardar Cambios en la Nube";
    }
});

// --- TRAER DATOS DE PROPIEDADES EN VIVO DESDE LA NUBE ---
async function cargarPropiedades() {
    const lista = document.getElementById('lista-propiedades');
    lista.innerHTML = "Cargando base de datos remota...";
    
    try {
        const querySnapshot = await getDocs(collection(db, "propiedades"));
        lista.innerHTML = "";
        
        if (querySnapshot.empty) {
            lista.innerHTML = "<p>No hay propiedades registradas aún en la nube.</p>";
            return;
        }

        querySnapshot.forEach((doc) => {
            const p = doc.data();
            const id = doc.id;
            const sufijo = p.tipoPrecio ? p.tipoPrecio : "/ Mes";
            const fotoPrincipal = p.imagenes && p.imagenes.length > 0 ? p.imagenes[0] : 'https://via.placeholder.com/80';

            const card = document.createElement('div');
            card.className = 'propiedad-card';
            card.innerHTML = `
                <div style="display:flex; gap:15px; align-items:center;">
                    <img src="${fotoPrincipal}" style="width:70px; height:70px; object-fit:cover; border-radius:6px; border:1px solid #eee;">
                    <div>
                        <strong style="font-size: 1.1em; color: #111;">${p.titulo}</strong><br>
                        <span style="color: #28a745; font-weight: bold;">$${p.precio} ${sufijo}</span><br>
                        <small style="color: #666;">📍 ${p.ubicacion} | 🛏️ ${p.piezas} piezas | 🚿 ${p.banos} baños</small>
                    </div>
                </div>
                <div class="acciones">
                    <button class="btn-edit" data-id="${id}">✏️ Editar</button>
                    <button class="btn-delete-card" data-id="${id}" title="Eliminar Propiedad">✕ Borrar</button>
                </div>
            `;
            lista.appendChild(card);
        });

        // Vincular eventos dinámicos
        document.querySelectorAll('.btn-edit').forEach(b => b.addEventListener('click', e => prepararEditar(e.target.dataset.id)));
        document.querySelectorAll('.btn-delete-card').forEach(b => b.addEventListener('click', e => eliminarPropiedad(e.target.dataset.id)));

    } catch (error) {
        console.error("Error al cargar propiedades de Firestore:", error);
        lista.innerHTML = "<p style='color:red;'>Error al conectar con el servidor remoto.</p>";
    }
}

// --- PASAR DATOS AL FORMULARIO PARA EDITAR ---
async function prepararEditar(id) {
    mostrarNotificacion("Cargando datos para edición...");
    
    try {
        const querySnapshot = await getDocs(collection(db, "propiedades"));
        querySnapshot.forEach((docSnap) => {
            if (docSnap.id === id) {
                const casa = docSnap.data();
                
                document.getElementById('id-propiedad').value = id;
                document.getElementById('titulo').value = casa.titulo;
                document.getElementById('precio').value = casa.precio;
                document.getElementById('tipoPrecio').value = casa.tipoPrecio || "/ Mes";
                document.getElementById('ubicacion').value = casa.ubicacion;
                document.getElementById('piezas').value = casa.piezas;
                document.getElementById('banos').value = casa.banos;

                previewContenedor.innerHTML = "";
                imagenesBase64 = [...casa.imagenes];

                casa.imagenes.forEach(base64 => {
                    const containerDiv = document.createElement('div');
                    containerDiv.className = 'preview-thumb-container';
                    
                    const img = document.createElement('img');
                    img.src = base64;
                    
                    const overlay = document.createElement('div');
                    overlay.className = 'preview-thumb-overlay';
                    overlay.innerHTML = '<span>✕ Eliminar</span>';
                    
                    overlay.onclick = function() {
                        containerDiv.remove();
                        imagenesBase64 = imagenesBase64.filter(u => u !== base64);
                    };
                    
                    containerDiv.appendChild(img);
                    containerDiv.appendChild(overlay);
                    previewContenedor.appendChild(containerDiv);
                });

                formTitle.innerText = "✏️ Editando: " + casa.titulo;
                document.getElementById('btn-guardar').innerText = "💾 Actualizar en la Nube";
                btnCancelar.style.display = "inline-block";
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    } catch (error) {
        console.error("Error al preparar edición:", error);
    }
}

// --- ELIMINAR PROPIEDAD DESDE LA NUBE ---
async function eliminarPropiedad(id) {
    if (confirm("¿Estás seguro de que deseas eliminar permanentemente esta propiedad de la nube?")) {
        try {
            await deleteDoc(doc(db, "propiedades", id));
            mostrarNotificacion("Propiedad eliminada de la nube.");
            cargarPropiedades();
        } catch (error) {
            console.error("Error al eliminar documento de Firestore:", error);
            mostrarNotificacion("No se pudo procesar la eliminación remota.");
        }
    }
}

// --- RESETEAR EL FORMULARIO ---
btnCancelar.addEventListener('click', resetFormulario);

function resetFormulario() {
    form.reset();
    document.getElementById('id-propiedad').value = "";
    previewContenedor.innerHTML = '';
    imagenesBase64 = [];
    formTitle.innerText = "➕ Añadir Nueva Propiedad";
    document.getElementById('btn-guardar').innerText = "💾 Guardar Cambios en la Nube";
    btnCancelar.style.display = "none";
}

// --- CONTROL DE RECARGAS DE SESIÓN ---
window.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('admin_session') === 'active') {
        if (loginWrapper) loginWrapper.style.display = 'none';
        document.getElementById('login-section').style.display = 'none';
        adminPanel.style.display = 'block';
        cargarPropiedades();
    }
});