import { computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import axios from 'axios'
import apiUrl from '../../../config.js'

const headers = { Accept: 'application/json' }

// ── Años disponibles ─────────────────────────────────────────────────────────

export function useAniosDisponiblesMantenimiento() {
  const { data, isLoading } = useQuery({
    queryKey: ['mantenimiento-anios'],
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

export function useCrearAnioMantenimiento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ anio, descripcion }) =>
      axios.post(`${apiUrl}/indicadores/crear_anio`, { anio, descripcion }, { headers }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mantenimiento-anios'] })
    },
  })
}

// ── Indicadores mensuales de Mantenimiento ───────────────────────────────────

/**
 * Query de indicadores de mantenimiento para un año.
 * @param {Ref<number|null>} anio
 */
export function useIndicadoresMantenimiento(anio) {
  const queryKey = computed(() => ['mantenimiento-indicadores', anio.value])

  const { data, isLoading, isFetching } = useQuery({
    queryKey,
    queryFn: () =>
      axios
        .post(
          `${apiUrl}/indicadores/obtener_indicadores_mantenimiento`,
          { anio: anio.value },
          { headers },
        )
        .then((r) => r.data.data),
    enabled: computed(() => !!anio.value),
  })

  const meses = computed(() => {
    if (!data.value?.indicadores) return []
    return data.value.indicadores.map((ind) => ({
      nombre:                ind.mes,
      mes_numero:            ind.mes_numero,
      totalVencer:           ind.total_actividades,
      cerradasOportunamente: ind.actividades_oportunas,
      cerradasFueraTiempo:   0,
      sinRegistrar:          0,
      indiceCumplimiento:    ind.porcentaje,           // el backend ya devuelve "100.0%"
      acumuladoAnio:         ind.porcentaje_acumulado, // el backend ya devuelve "100.0%"
      meta:                  ind.porcentaje_meta,
      totalIngresaron:       0,
      ticketsAbiertos:       0,
    }))
  })

  const datosIndicadores = computed(() => data.value ?? null)

  return { meses, datosIndicadores, isLoading, isFetching }
}

// ── Análisis de causas de Mantenimiento ─────────────────────────────────────

export function useAnalisisCausasMantenimiento(anio) {
  const queryClient = useQueryClient()
  const queryKey = computed(() => ['mantenimiento-analisis-causas', anio.value])

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      axios
        .post(
          `${apiUrl}/indicadores/obtener_analisis_causas_mantenimiento`,
          { anio: anio.value },
          { headers },
        )
        .then((r) => r.data.data ?? []),
    enabled: computed(() => !!anio.value),
  })

  const guardarAnalisisMutation = useMutation({
    mutationFn: (payload) =>
      axios.post(
        `${apiUrl}/indicadores/guardar_analisis_causas_mantenimiento`,
        payload,
        { headers },
      ),
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

export function useObservacionMesMantenimiento(anio, mesNumero) {
  const queryClient = useQueryClient()
  const queryKey = computed(() => ['mantenimiento-observacion-mes', anio.value, mesNumero.value])

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      axios
        .post(
          `${apiUrl}/indicadores/obtener_observacion_mes_mantenimiento`,
          { anio: anio.value, mes: mesNumero.value },
          { headers },
        )
        .then((r) => r.data.data?.observaciones ?? ''),
    enabled: computed(() => !!anio.value && !!mesNumero.value),
    staleTime: 0,
  })

  const guardarObservacionMutation = useMutation({
    mutationFn: ({ anio, mes, observaciones }) =>
      axios.post(
        `${apiUrl}/indicadores/guardar_observacion_mes_mantenimiento`,
        { anio, mes, observaciones },
        { headers },
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['mantenimiento-observacion-mes', variables.anio, variables.mes],
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

export function useTicketsPeriodoMantenimiento(anio, mes, page, limit) {
  const queryKey = computed(() => ['mantenimiento-tickets-periodo', anio.value, mes.value, page.value, limit.value])

  const { data, isLoading, isFetching } = useQuery({
    queryKey,
    queryFn: () =>
      axios
        .post(
          `${apiUrl}/indicadores/obtener_tickets_periodo`,
          {
            anio: anio.value,
            mes: mes.value,
            tipo_ticket: 3, // Mantenimiento
            page: page.value,
            limit: limit.value,
          },
          { headers },
        )
        .then((r) => r.data.data),
    enabled: computed(() => !!anio.value && !!mes.value),
    placeholderData: (prev) => prev,
  })

  const tickets = computed(() => data.value?.tickets ?? [])
  const resumen = computed(() => data.value?.resumen ?? { total: 0, cerrados: 0, en_progreso: 0, abiertos: 0 })
  const pagination = computed(() => data.value?.pagination ?? { total_records: 0, total_pages: 0 })

  return { tickets, resumen, pagination, isLoading, isFetching }
}
