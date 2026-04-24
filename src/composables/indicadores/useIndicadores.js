import { computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import axios from 'axios'
import apiUrl from '../../../config.js'

const headers = { Accept: 'application/json' }

// ── Años disponibles ─────────────────────────────────────────────────────────

/**
 * Query para obtener los años de informe de gestión disponibles.
 * staleTime: 5 min — cambian raramente.
 */
export function useAniosDisponibles() {
  const { data, isLoading } = useQuery({
    queryKey: ['indicadores-anios'],
    queryFn: () =>
      axios
        .post(`${apiUrl}/indicadores/obtener_anios`, {}, { headers })
        .then((r) => (r.data.data ?? []).map((a) => a.anio)),
    staleTime: 1000 * 60 * 5,
  })

  return {
    aniosDisponibles: computed(() => data.value ?? []),
    isLoading,
  }
}

/**
 * Mutation para crear un nuevo año de informe de gestión.
 */
export function useCrearAnio() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ anio, descripcion }) =>
      axios.post(`${apiUrl}/indicadores/crear_anio`, { anio, descripcion }, { headers }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['indicadores-anios'] })
    },
  })
}

// ── Indicadores mensuales ────────────────────────────────────────────────────

/**
 * Query de indicadores de gestión para un año.
 * @param {Ref<number|null>} anio
 */
export function useIndicadores(anio) {
  const queryKey = computed(() => ['indicadores', anio.value])

  const { data, isLoading, isFetching } = useQuery({
    queryKey,
    queryFn: () =>
      axios
        .post(
          `${apiUrl}/indicadores/obtener_indicadores_gestion`,
          { anio: anio.value },
          { headers },
        )
        .then((r) => r.data.data),
    enabled: computed(() => !!anio.value),
  })

  /** Meses mapeados al formato que usa la tabla */
  const meses = computed(() => {
    if (!data.value?.indicadores) return []
    return data.value.indicadores.map((ind) => ({
      nombre: ind.mes,
      mes_numero: ind.mes_numero,
      totalVencer: ind.total_completados,
      cerradasOportunamente: ind.oportunos,
      cerradasFueraTiempo: ind.no_oportunos,
      sinRegistrar: ind.sin_respuesta,
      indiceCumplimiento: ind.total_completados > 0 ? `${ind.porcentaje}%` : '',
      acumuladoAnio: `${ind.porcentaje_acumulado}%`,
      meta: ind.porcentaje_meta,
      totalIngresaron: ind.total_ingresados,
      ticketsAbiertos: ind.tickets_abiertos,
    }))
  })

  const datosIndicadores = computed(() => data.value ?? null)

  return { meses, datosIndicadores, isLoading, isFetching }
}

// ── Análisis de causas ───────────────────────────────────────────────────────

/**
 * Query de análisis de causas / acciones para un año.
 * @param {Ref<number|null>} anio
 */
export function useAnalisisCausas(anio) {
  const queryClient = useQueryClient()
  const queryKey = computed(() => ['analisis-causas', anio.value])

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      axios
        .post(
          `${apiUrl}/indicadores/obtener_analisis_causas`,
          { anio: anio.value },
          { headers },
        )
        .then((r) => r.data.data ?? []),
    enabled: computed(() => !!anio.value),
  })

  const guardarAnalisisMutation = useMutation({
    mutationFn: (payload) =>
      axios.post(`${apiUrl}/indicadores/guardar_analisis_causas`, payload, { headers }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey.value })
    },
  })

  return {
    accionesList: computed(() => data.value ?? []),
    isLoading,
    guardarAnalisisMutation,
  }
}

// ── Observaciones de mes ─────────────────────────────────────────────────────

/**
 * Query condicional: carga la observación del mes solo cuando el modal está abierto.
 * @param {Ref<number|null>} anio
 * @param {Ref<number|null>} mesNumero  - null cuando el modal está cerrado
 */
export function useObservacionMes(anio, mesNumero) {
  const queryClient = useQueryClient()
  const queryKey = computed(() => ['observacion-mes', anio.value, mesNumero.value])

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      axios
        .post(
          `${apiUrl}/indicadores/obtener_observacion_mes`,
          { anio: anio.value, mes: mesNumero.value },
          { headers },
        )
        .then((r) => r.data.data?.observaciones ?? ''),
    enabled: computed(() => !!anio.value && !!mesNumero.value),
    staleTime: 0, // siempre fresco al abrir el modal
  })

  const guardarObservacionMutation = useMutation({
    mutationFn: ({ anio, mes, observaciones }) =>
      axios.post(`${apiUrl}/indicadores/guardar_observacion_mes`, { anio, mes, observaciones }, { headers }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['observacion-mes', variables.anio, variables.mes],
      })
    },
  })

  return {
    observacion: computed(() => data.value ?? ''),
    isLoading,
    guardarObservacionMutation,
  }
}

// ── Tickets del periodo ──────────────────────────────────────────────────────

/**
 * Query paginada de tickets de un mes/año.
 * @param {Ref<number|null>} anio
 * @param {Ref<number|string|null>} mes
 * @param {Ref<number>} page
 * @param {Ref<number>} limit
 */
export function useTicketsPeriodo(anio, mes, page, limit) {
  const queryKey = computed(() => ['tickets-periodo', anio.value, mes.value, page.value, limit.value])

  const { data, isLoading, isFetching } = useQuery({
    queryKey,
    queryFn: () =>
      axios
        .post(
          `${apiUrl}/indicadores/obtener_tickets_periodo`,
          {
            anio: anio.value,
            mes: mes.value,
            tipo_ticket: 1, // Gestión
            page: page.value,
            limit: limit.value,
          },
          { headers },
        )
        .then((r) => r.data.data),
    enabled: computed(() => !!anio.value && !!mes.value),
    placeholderData: (prev) => prev, // keepPreviousData para paginación sin parpadeo
  })

  const tickets = computed(() => data.value?.tickets ?? [])
  const resumen = computed(() => data.value?.resumen ?? { total: 0, cerrados: 0, en_progreso: 0, abiertos: 0 })
  const pagination = computed(() => data.value?.pagination ?? { total_records: 0, total_pages: 0 })

  return { tickets, resumen, pagination, isLoading, isFetching }
}
