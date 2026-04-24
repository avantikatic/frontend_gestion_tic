import { useQueries } from '@tanstack/vue-query'
import { computed } from 'vue'
import axios from 'axios'
import apiUrl from '../../../config.js'

const HEADERS = { Accept: 'application/json' }

export function useTicketsCatalogos() {
  const catalogResults = useQueries({
    queries: [
      {
        queryKey: ['tickets-cat-estados'],
        queryFn: () =>
          axios
            .get(`${apiUrl}/obtener_estados_tickets`, { headers: HEADERS })
            .then(r => r.data.data || []),
        staleTime: Infinity,
      },
      {
        queryKey: ['tickets-cat-tecnicos'],
        queryFn: () =>
          axios
            .get(`${apiUrl}/obtener_tecnicos_gestion_tic`, { headers: HEADERS })
            .then(r => r.data.data || []),
        staleTime: Infinity,
      },
      {
        queryKey: ['tickets-cat-prioridades'],
        queryFn: () =>
          axios
            .post(`${apiUrl}/obtener_prioridades`, {}, { headers: HEADERS })
            .then(r => r.data.data || []),
        staleTime: Infinity,
      },
      {
        queryKey: ['tickets-cat-tipos-soporte'],
        queryFn: () =>
          axios
            .post(`${apiUrl}/obtener_tipo_soporte`, {}, { headers: HEADERS })
            .then(r => r.data.data || []),
        staleTime: Infinity,
      },
      {
        queryKey: ['tickets-cat-tipos-ticket'],
        queryFn: () =>
          axios
            .post(`${apiUrl}/obtener_tipo_ticket`, {}, { headers: HEADERS })
            .then(r => r.data.data || []),
        staleTime: Infinity,
      },
      {
        queryKey: ['tickets-cat-macroprocesos'],
        queryFn: () =>
          axios
            .post(`${apiUrl}/obtener_macroprocesos`, {}, { headers: HEADERS })
            .then(r => r.data.data || []),
        staleTime: Infinity,
      },
      {
        queryKey: ['tickets-cat-tipos-nivel'],
        queryFn: () =>
          axios
            .post(`${apiUrl}/obtener_tipo_nivel`, {}, { headers: HEADERS })
            .then(r => r.data.data || []),
        staleTime: Infinity,
      },
      {
        queryKey: ['tickets-cat-origenes-estrategicos'],
        queryFn: () =>
          axios
            .post(`${apiUrl}/obtener_origen_estrategico`, {}, { headers: HEADERS })
            .then(r => r.data.data || []),
        staleTime: Infinity,
      },
    ],
  })

  const estados               = computed(() => catalogResults.value[0].data ?? [])
  const tecnicos              = computed(() => catalogResults.value[1].data ?? [])
  const prioridades           = computed(() => catalogResults.value[2].data ?? [])
  const tiposSoporte          = computed(() => catalogResults.value[3].data ?? [])
  const tiposTicket           = computed(() => catalogResults.value[4].data ?? [])
  const macroprocesos         = computed(() => catalogResults.value[5].data ?? [])
  const tiposNivel            = computed(() => catalogResults.value[6].data ?? [])
  const origenesEstrategicos  = computed(() => catalogResults.value[7].data ?? [])

  const isLoadingCatalogos = computed(() =>
    catalogResults.value.some(r => r.isLoading),
  )

  return {
    estados,
    tecnicos,
    prioridades,
    tiposSoporte,
    tiposTicket,
    macroprocesos,
    tiposNivel,
    origenesEstrategicos,
    isLoadingCatalogos,
  }
}
