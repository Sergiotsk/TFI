import type { SupabaseClient } from '@supabase/supabase-js'
import type { AlmacenDeArchivos, ArchivoParaSubir } from '@tfi/application'

/**
 * Almacén de archivos sobre un bucket privado de Supabase Storage.
 *
 * La ruta la arma el caso de uso (`institucion/postulacion/archivo`). Las
 * policies de Storage validan que el usuario pueda escribir o leer esa ruta;
 * las URLs son firmadas y de corta duración, nunca públicas.
 */
export class AlmacenDeArchivosSupabase implements AlmacenDeArchivos {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly bucket = 'documentos',
  ) {}

  async subir(ruta: string, archivo: ArchivoParaSubir): Promise<void> {
    const { error } = await this.supabase.storage.from(this.bucket).upload(
      ruta,
      archivo.contenido,
      {
        contentType: archivo.mimeType,
        upsert: false,
      },
    )
    if (error) throw new Error(`No se pudo subir el archivo: ${error.message}`)
  }

  async eliminar(ruta: string): Promise<void> {
    const { error } = await this.supabase.storage.from(this.bucket).remove([ruta])
    if (error) throw new Error(`No se pudo eliminar el archivo: ${error.message}`)
  }

  async urlFirmada(ruta: string, segundos: number): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .createSignedUrl(ruta, segundos)
    if (error || !data) {
      throw new Error(`No se pudo firmar la URL del archivo: ${error?.message ?? ''}`)
    }

    return data.signedUrl
  }
}
