import { createClient } from '@supabase/supabase-js';

// Credenciales de tu proyecto
const supabaseUrl = 'https://delswnqvmrupvobalqyr.supabase.co';
const supabaseKey = 'sb_publishable_B4fMCrV7KPvfzy22uqKVWg_57X66nK6';
const supabase = createClient(supabaseUrl, supabaseKey);

async function limpiarFotosHuérfanas() {
  try {
    console.log("Iniciando revisión de archivos en el Storage...");
    
    // 1. Obtener todas las fotos del bucket 'fotos'
    const { data: archivosStorage, error: errorStorage } = await supabase.storage
      .from('fotos')
      .list('', { limit: 1000 });

    if (errorStorage) throw errorStorage;
    if (!archivosStorage || archivosStorage.length === 0) {
      console.log("El bucket está vacío.");
      return;
    }

    console.log(`Se encontraron ${archivosStorage.length} archivos en el Storage.`);

    // 2. Obtener las referencias de la tabla 'Proyecto' usando la columna 'foto_url'
    const { data: proyectos, error: errorDb } = await supabase
      .from('Proyecto')
      .select('foto_url'); 

    if (errorDb) throw errorDb;

    // 3. Crear una lista con los nombres de archivos que SÍ se están usando
    const archivosEnUso = new Set();
    proyectos.forEach(proyecto => {
      const urlImagen = proyecto.foto_url; // Columna corregida
      
      if (urlImagen) {
        // Extrae el nombre del archivo al final de la URL
        const nombreArchivo = urlImagen.split('/').pop();
        archivosEnUso.add(nombreArchivo);
      }
    });

    console.log(`Hay ${archivosEnUso.size} archivos en uso por las propiedades actuales.`);

    // 4. Filtrar los archivos que están en el Storage pero NO en la base de datos
    const archivosParaBorrar = archivosStorage
      .filter(archivo => !archivosEnUso.has(archivo.name))
      .map(archivo => archivo.name);

    console.log(`Se encontraron ${archivosParaBorrar.length} archivos huérfanos para eliminar.`);

    if (archivosParaBorrar.length > 0) {
      // 5. Borrar los archivos sobrantes de Supabase Storage para liberar espacio
      const { error: deleteError } = await supabase.storage
        .from('fotos')
        .remove(archivosParaBorrar);

      if (deleteError) throw deleteError;

      alert(`¡Limpieza completada! Se eliminaron ${archivosParaBorrar.length} archivos antiguos y se liberó espacio.`);
      console.log('Archivos eliminados con éxito:', archivosParaBorrar);
    } else {
      alert('No hay archivos huérfanos para borrar.');
    }

  } catch (error) {
    console.error('Error durante la limpieza:', error);
    alert('Ocurrió un error al limpiar. Revisa la consola.');
  }
}

// Ejecutar la función
limpiarFotosHuérfanas();