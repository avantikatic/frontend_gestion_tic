import { computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import axios from 'axios'
import apiUrl from '../../../config.js'

const BASE = `${apiUrl}/contingencia`
const H    = { Accept: 'application/json' }
const post = (url, body = {}) => axios.post(url, body, { headers: H }).then(r => r.data.data)

// ── Catálogos ──────────────────────────────────────────────────────────────────
// Una sola petición que trae todos los selects del módulo.
// staleTime Infinity → no se vuelve a pedir hasta recargar la página.

export function useContingenciaCatalogos() {
  const EMPTY = {
    tipos_evento:            [],
    prioridades:             [],
    estados_evento:          [],
    estados_accion:          [],
    estados_documento:       [],
    tipos_bitacora:          [],
    resultados_recuperacion: [],
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: ['contingencia-catalogos'],
    queryFn:  () => post(`${BASE}/obtener_catalogos`),
    staleTime: Infinity,
  })

  return {
    catalogos:  computed(() => data.value ?? EMPTY),
    catLoading: isLoading,
    catError:   isError,
  }
}

// ── Contadores KPI ─────────────────────────────────────────────────────────────

export function useContingenciaContadores() {
  const EMPTY = {
    total_eventos: 0, eventos_abiertos: 0,
    acciones_total: 0, acciones_completadas: 0,
    total_documentos: 0, total_bitacoras: 0,
  }

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['contingencia-contadores'],
    queryFn:  () => post(`${BASE}/obtener_contadores`),
  })

  return {
    contadores: computed(() => data.value ?? EMPTY),
    contLoading: isLoading,
    refetchContadores: refetch,
  }
}

// ── Eventos ────────────────────────────────────────────────────────────────────

export function useContingenciaEventos(filtros) {
  const qc = useQueryClient()

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: computed(() => ['contingencia-eventos', filtros.value]),
    queryFn:  () => post(`${BASE}/listar_eventos`, filtros.value),
  })

  const invalidar = () => {
    qc.invalidateQueries({ queryKey: ['contingencia-eventos'] })
    qc.invalidateQueries({ queryKey: ['contingencia-contadores'] })
  }

  const crearMutation = useMutation({
    mutationFn: (payload) => post(`${BASE}/crear_evento`, payload),
    onSuccess:  invalidar,
  })

  const actualizarMutation = useMutation({
    mutationFn: (payload) => post(`${BASE}/actualizar_evento`, payload),
    onSuccess:  invalidar,
  })

  const eliminarMutation = useMutation({
    mutationFn: (id_evento) => post(`${BASE}/eliminar_evento`, { id_evento }),
    onSuccess: (_, id_evento) => {
      invalidar()
      qc.invalidateQueries({ queryKey: ['contingencia-expediente', id_evento] })
    },
  })

  return {
    eventos:          computed(() => data.value ?? []),
    eventosLoading:   isLoading,
    eventosFetching:  isFetching,
    refetchEventos:   refetch,
    crearMutation,
    actualizarMutation,
    eliminarMutation,
  }
}

// ── Expediente activo (acciones, docs, bitácoras, recuperación) ────────────────

export function useContingenciaExpediente(idEvento) {
  const qc = useQueryClient()
  const enabled = computed(() => !!idEvento.value)

  // ── Acciones ──────────────────────────────────────────────────────────────
  const { data: accionesData, refetch: refetchAcciones } = useQuery({
    queryKey: computed(() => ['contingencia-acciones', idEvento.value]),
    queryFn:  () => post(`${BASE}/listar_acciones`, { id_evento: idEvento.value }),
    enabled,
  })

  // ── Documentos ────────────────────────────────────────────────────────────
  const { data: docsData, refetch: refetchDocs } = useQuery({
    queryKey: computed(() => ['contingencia-documentos', idEvento.value]),
    queryFn:  () => post(`${BASE}/listar_documentos`, { id_evento: idEvento.value }),
    enabled,
  })

  // ── Bitácoras ─────────────────────────────────────────────────────────────
  const { data: bitacorasData, refetch: refetchBitacoras } = useQuery({
    queryKey: computed(() => ['contingencia-bitacoras', idEvento.value]),
    queryFn:  () => post(`${BASE}/listar_bitacoras`, { id_evento: idEvento.value }),
    enabled,
  })

  // ── Recuperación ──────────────────────────────────────────────────────────
  const { data: recData, refetch: refetchRec } = useQuery({
    queryKey: computed(() => ['contingencia-recuperacion', idEvento.value]),
    queryFn:  () => post(`${BASE}/obtener_recuperacion`, { id_evento: idEvento.value }),
    enabled,
    staleTime: 0,
  })

  // ── Helpers de invalidación ───────────────────────────────────────────────
  const invalidarAcciones = () => {
    qc.invalidateQueries({ queryKey: ['contingencia-acciones',  idEvento.value] })
    qc.invalidateQueries({ queryKey: ['contingencia-bitacoras', idEvento.value] })
    qc.invalidateQueries({ queryKey: ['contingencia-contadores'] })
  }
  const invalidarDocs = () => {
    qc.invalidateQueries({ queryKey: ['contingencia-documentos', idEvento.value] })
    qc.invalidateQueries({ queryKey: ['contingencia-bitacoras',  idEvento.value] })
    qc.invalidateQueries({ queryKey: ['contingencia-contadores'] })
  }
  const invalidarBitacoras = () =>
    qc.invalidateQueries({ queryKey: ['contingencia-bitacoras', idEvento.value] })
  const invalidarRec = () => {
    qc.invalidateQueries({ queryKey: ['contingencia-recuperacion', idEvento.value] })
    qc.invalidateQueries({ queryKey: ['contingencia-bitacoras',    idEvento.value] })
  }

  // ── Mutaciones ────────────────────────────────────────────────────────────
  const crearAccionMutation      = useMutation({ mutationFn: (p) => post(`${BASE}/crear_accion`,      p), onSuccess: invalidarAcciones })
  const actualizarAccionMutation = useMutation({ mutationFn: (p) => post(`${BASE}/actualizar_accion`, p), onSuccess: invalidarAcciones })
  const eliminarAccionMutation   = useMutation({ mutationFn: (id) => post(`${BASE}/eliminar_accion`,  { id_accion: id }), onSuccess: invalidarAcciones })

  const crearDocMutation    = useMutation({ mutationFn: (p)  => post(`${BASE}/crear_documento`,    p),                    onSuccess: invalidarDocs })
  const eliminarDocMutation = useMutation({ mutationFn: (id) => post(`${BASE}/eliminar_documento`, { id_documento: id }), onSuccess: invalidarDocs })

  const guardarRecMutation = useMutation({ mutationFn: (p) => post(`${BASE}/guardar_recuperacion`, p), onSuccess: invalidarRec })

  const crearBitacoraMutation = useMutation({ mutationFn: (p) => post(`${BASE}/crear_bitacora`, p), onSuccess: invalidarBitacoras })

  return {
    acciones:   computed(() => accionesData.value  ?? []),
    documentos: computed(() => docsData.value      ?? []),
    bitacoras:  computed(() => bitacorasData.value ?? []),
    recuperacion: computed(() => recData.value     ?? null),

    refetchAcciones,
    refetchDocs,
    refetchBitacoras,
    refetchRec,

    crearAccionMutation,
    actualizarAccionMutation,
    eliminarAccionMutation,
    crearDocMutation,
    eliminarDocMutation,
    guardarRecMutation,
    crearBitacoraMutation,
  }
}
