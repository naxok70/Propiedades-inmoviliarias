// ==========================================
// CONFIGURACIÓN DE SUPABASE
// ==========================================
// RECUERDA: Coloca tu URL real de Supabase aquí
const SUPABASE_URL = "https://tu-url-de-supabase.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_B4fMCrV7KPvfzy22uqKVWg_57X66nK6"; 

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variable para almacenar las propiedades cargadas desde SUPABASE
let propiedades = [];

// Función para fomentar precio en pesos chilenos
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
        
        // Obtener imágenes desde el array de Supabase o usar fallback
        const imagenes = (propiedad.imagenes && propiedad.imagenes.length > 0) ? propiedad.imagenes : ['images/casa1.jpg'];
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

// Función global para cambiar imágenes en el carrusel (Adaptada para Supabase)
function cambiarImagen(cardId, direction) {
    const idx = parseInt(cardId.replace('propiedad-', ''));
    const imgElement = document.getElementById(`img-${idx}`);
    const counterElement = document.getElementById(`counter-${idx}`);
    
    let imagenes;
    
    // Leemos directamente del arreglo en memoria sincronizado de Supabase
    if (propiedades[idx]) {
        imagenes = (propiedades[idx].imagenes && propiedades[idx].imagenes.length > 0) ? propiedades[idx].imagenes : ['images/casa1.jpg'];
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

// CARGA LOS DATOS EN TIEMPO REAL DESDE SUPABASE
async function cargarPropiedades() {
    try {
        console.log("Sincronizando: Conectando a Supabase Cloud...");
        
        const { data, error } = await supabase
            .from('proyecto') // El nombre de la tabla en tu Supabase
            .select('*')
            .order('id', { ascending: false }); // Trae los registros más nuevos arriba

        if (error) throw error;

        // Mapeamos lo que llega de la BD de internet al formato de tu array
        propiedades = data.map(p => ({
            titulo: p.nombre,
            precio: p.precio || "0",
            tipoPrecio: p.tipo_precio || "/ Valor Total",
            ubicacion: p.ubicacion || "",
            piezas: p.piezas || 0,
            banos: p.banos || 0,
            imagenes: p.foto_url ? [p.foto_url] : [] // Lo inyectamos en formato array
        }));

        // Dibujamos las propiedades reales ya descargadas
        renderizarPropiedades();

    } catch (error) {
        console.error("Error al comunicar con la base de datos de Supabase:", error);
    }
}

// Ejecución al cargar la página de clientes
document.addEventListener('DOMContentLoaded', cargarPropiedades);