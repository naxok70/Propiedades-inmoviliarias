// Variable para almacenar las propiedades cargadas desde JSON
let propiedades = [];

// Función para formatear precio en pesos chilenos
function formatearPrecio(precio) {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0
    }).format(precio);
}

// Función para renderizar las tarjetas de propiedades
function renderizarPropiedades() {
    const contenedor = document.getElementById('contenedor-propiedades');
    
    // Limpiar el contenedor
    contenedor.innerHTML = '';
    
    // Recorrer el array de propiedades y crear las tarjetas
    propiedades.forEach((propiedad, idx) => {
        const col = document.createElement('div');
        col.className = 'col-12 col-sm-6 col-md-4 col-lg-4';
        
        const card = document.createElement('div');
        card.className = 'card property-card';
        
        // Obtener imágenes: usar arreglo imagenes o fallback a imagen individual
        const imagenes = (propiedad.imagenes && propiedad.imagenes.length > 0) ? propiedad.imagenes : [propiedad.imagen || 'images/casa1.jpg'];
        const primeraImagen = imagenes[0];
        
        const cardId = `propiedad-${idx}`;
        const imgId = `img-${idx}`;
        const counterId = `counter-${idx}`;
        
        card.innerHTML = `
            <div class="image-carousel">
                <button class="carousel-nav carousel-prev" onclick="cambiarImagen('${cardId}', -1)">‹</button>
                <img id="${imgId}" src="${primeraImagen}" alt="${propiedad.titulo}" loading="lazy" data-current-index="0">
                <button class="carousel-nav carousel-next" onclick="cambiarImagen('${cardId}', 1)">›</button>
                <div id="${counterId}" class="image-counter">1/${imagenes.length}</div>
            </div>
            <div class="card-body">
                <h5 class="card-title">${propiedad.titulo}</h5>
                <p class="price">${formatearPrecio(propiedad.precio)}</p>
                <div class="features">
                    <span class="feature">
                        <i class="bi bi-door-open-fill"></i>
                        ${propiedad.piezas} ${propiedad.piezas === 1 ? 'pieza' : 'piezas'}
                    </span>
                    <span class="feature">
                        <i class="bi bi-droplet-fill"></i>
                        ${propiedad.banos} ${propiedad.banos === 1 ? 'baño' : 'baños'}
                    </span>
                </div>
                <p class="location mb-3">
                    <i class="bi bi-geo-alt-fill"></i>
                    ${propiedad.ubicacion}
                </p>
                <button class="btn btn-primary btn-contact w-100">
                    <i class="bi bi-telephone-fill me-2"></i>
                    Contactar
                </button>
            </div>
        `;
        
        // Guardar las imágenes en el elemento para usarlas en el carrusel
        card.dataset.imagenes = JSON.stringify(imagenes);
        
        col.appendChild(card);
        contenedor.appendChild(col);
    });
}

// Función global para cambiar imágenes en el carrusel
function cambiarImagen(cardId, direction) {
    const idx = parseInt(cardId.replace('propiedad-', ''));
    const imgElement = document.getElementById(`img-${idx}`);
    const counterElement = document.getElementById(`counter-${idx}`);
    
    // Obtener las imágenes del array global o localStorage
    let imagenes;
    const datosLocales = localStorage.getItem('propiedades_local');
    
    if (datosLocales) {
        const propiedades = JSON.parse(datosLocales);
        const propiedad = propiedades[idx];
        if (propiedad) {
            imagenes = (propiedad.imagenes && propiedad.imagenes.length > 0) ? propiedad.imagenes : [propiedad.imagen || 'images/casa1.jpg'];
        }
    } else if (propiedades[idx]) {
        imagenes = (propiedades[idx].imagenes && propiedades[idx].imagenes.length > 0) ? propiedades[idx].imagenes : [propiedades[idx].imagen || 'images/casa1.jpg'];
    }
    
    if (imagenes && imagenes.length > 0) {
        // Obtener índice actual desde el elemento
        let currentIndex = parseInt(imgElement.dataset.currentIndex || 0);
        
        // Calcular nuevo índice
        currentIndex += direction;
        if (currentIndex < 0) {
            currentIndex = imagenes.length - 1;
        } else if (currentIndex >= imagenes.length) {
            currentIndex = 0;
        }
        
        // Actualizar imagen y contador
        imgElement.src = imagenes[currentIndex];
        imgElement.dataset.currentIndex = currentIndex;
        counterElement.textContent = `${currentIndex + 1}/${imagenes.length}`;
    }
}

// Función para abrir lightbox (disponible globalmente)
function abrirLightbox(imagenes, startIndex = 0) {
    if (typeof window.abrirLightbox === 'function') {
        window.abrirLightbox(imagenes, startIndex);
    }
}

// Busca esta función en tu app.js y reemplázala completa:
async function cargarPropiedades() {
    try {
        // 1. Primero miramos si el administrador guardó algo de forma local
        const datosLocales = localStorage.getItem('propiedades_local');
        
        if (datosLocales) {
            console.log("Sincronizado: Cargando datos desde el Panel Admin Local");
            propiedades = JSON.parse(datosLocales);
            renderizarPropiedades();
        } else {
            // 2. Si el panel está vacío, cargamos el JSON por defecto de tu computadora
            console.log("Cargando archivo JSON por defecto");
            const respuesta = await fetch('data/propiedades.json');
            propiedades = await respuesta.json();
            renderizarPropiedades();
        }
    } catch (error) {
        console.error("Error al comunicar los archivos locales:", error);
    }
}

// Asegúrate de que la función se esté ejecutando al cargar la página
document.addEventListener('DOMContentLoaded', cargarPropiedades);