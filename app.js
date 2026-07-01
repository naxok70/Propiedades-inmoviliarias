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
    propiedades.forEach(propiedad => {
        const col = document.createElement('div');
        col.className = 'col-12 col-sm-6 col-md-4 col-lg-4';
        
        const card = document.createElement('div');
        card.className = 'card property-card';
        
        card.innerHTML = `
            <img src="${propiedad.imagen}" class="card-img-top" alt="${propiedad.titulo}" loading="lazy">
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
        
        col.appendChild(card);
        contenedor.appendChild(col);
    });
}

// Función para cargar propiedades desde el archivo JSON
async function cargarPropiedades() {
    try {
        const respuesta = await fetch('data/propiedades.json');
        if (!respuesta.ok) {
            throw new Error('Error al cargar el archivo JSON');
        }
        propiedades = await respuesta.json();
        renderizarPropiedades();
    } catch (error) {
        console.error('Error:', error);
        // Mostrar mensaje de error en el contenedor
        const contenedor = document.getElementById('contenedor-propiedades');
        contenedor.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger text-center">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    Error al cargar las propiedades. Por favor, intenta nuevamente más tarde.
                </div>
            </div>
        `;
    }
}

// Ejecutar la función cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', cargarPropiedades);
