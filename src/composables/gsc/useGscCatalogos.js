import { computed } from 'vue'
import { useQueries } from '@tanstack/vue-query'
import axios from 'axios'
import apiUrl from '../../../config.js'

const headers = { Accept: 'application/json' }

function postCatalogo(endpoint) {
  return axios
    .post(`${apiUrl}/gestion-continuidad/${endpoint}`, {}, { headers })
    .then((r) => r.data.data ?? [])
}

/**
 * Obtiene todos los catálogos de GSC en paralelo.
 * staleTime: Infinity → los catálogos solo se refrescan manualmente
 * (no cambian durante la sesión del usuario).
 */
export function useGscCatalogos() {
  const results = useQueries({
    queries: [
      {
        queryKey: ['gsc-estados'],
        queryFn: () => postCatalogo('obtener_estados_gsc'),
        staleTime: Infinity,
      },
      {
        queryKey: ['gsc-sistemas'],
        queryFn: () => postCatalogo('obtener_sistemas_afectados_gsc'),
        staleTime: Infinity,
      },
      {
        queryKey: ['gsc-modulos'],
        queryFn: () => postCatalogo('obtener_modulos_gsc'),
        staleTime: Infinity,
      },
      {
        queryKey: ['gsc-tipos-evidencia'],
        queryFn: () => postCatalogo('obtener_tipos_evidencia_gsc'),
        staleTime: Infinity,
      },
      {
        queryKey: ['gsc-origenes'],
        queryFn: () => postCatalogo('obtener_origenes_plataforma_gsc'),
        staleTime: Infinity,
      },
      {
        queryKey: ['gsc-fuentes'],
        queryFn: () => postCatalogo('obtener_fuentes_seguridad_gsc'),
        staleTime: Infinity,
      },
      {
        queryKey: ['gsc-impactos'],
        queryFn: () => postCatalogo('obtener_impactos_gsc'),
        staleTime: Infinity,
      },
      {
        queryKey: ['gsc-riesgos'],
        queryFn: () => postCatalogo('obtener_riesgos_gsc'),
        staleTime: Infinity,
      },
    ],
  })

  return {
    estadosGSC: computed(() => results.value[0].data ?? []),
    sistemasAfectados: computed(() => results.value[1].data ?? []),
    modulosGSC: computed(() => results.value[2].data ?? []),
    tiposEvidencia: computed(() => results.value[3].data ?? []),
    origenesPlataforma: computed(() => results.value[4].data ?? []),
    fuentesSeguridad: computed(() => results.value[5].data ?? []),
    impactos: computed(() => results.value[6].data ?? []),
    riesgos: computed(() => results.value[7].data ?? []),
    isLoading: computed(() => results.value.some((r) => r.isLoading)),
    isError: computed(() => results.value.some((r) => r.isError)),
  }
}
