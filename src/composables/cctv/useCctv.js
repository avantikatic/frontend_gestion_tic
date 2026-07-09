import { computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import axios from 'axios'
import apiUrl from '../../../config.js'

const BASE = `${apiUrl}/cctv`
const H    = { Accept: 'application/json' }
const post = (url, body = {}) => axios.post(url, body, { headers: H }).then(r => r.data.data)

// ── Catálogos ──────────────────────────────────────────────────────────────────

export function useCctvCatalogos() {
  const EMPTY = { estados_camara: [], metodos_backup: [], niveles_acceso: [], severidades: [], estados_incidente: [] }

  const { data } = useQuery({
    queryKey:  ['cctv-catalogos'],
    queryFn:   () => post(`${BASE}/obtener_catalogos`),
    staleTime: Infinity,
  })

  return { catalogos: computed(() => data.value ?? EMPTY) }
}

// ── Dashboard ──────────────────────────────────────────────────────────────────

export function useCctvDashboard() {
  const EMPTY = { totales: { sedes: 0, camaras: 0, dias_almacenamiento: 0, cargos_autorizados: 0 }, por_sede: [] }

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['cctv-dashboard'],
    queryFn:  () => post(`${BASE}/dashboard`),
  })

  return {
    dashboard:       computed(() => data.value ?? EMPTY),
    dashLoading:     isLoading,
    refetchDashboard: refetch,
  }
}

// ── Sedes ──────────────────────────────────────────────────────────────────────

export function useCctvSedes() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['cctv-sedes'],
    queryFn:  () => post(`${BASE}/listar_sedes`),
  })

  const invalidar = () => {
    qc.invalidateQueries({ queryKey: ['cctv-sedes'] })
    qc.invalidateQueries({ queryKey: ['cctv-dashboard'] })
    qc.invalidateQueries({ queryKey: ['cctv-camaras'] })
  }

  const crearSedeMutation      = useMutation({ mutationFn: (p) => post(`${BASE}/crear_sede`,     p), onSuccess: invalidar })
  const actualizarSedeMutation = useMutation({ mutationFn: (p) => post(`${BASE}/actualizar_sede`, p), onSuccess: invalidar })
  const eliminarSedeMutation   = useMutation({ mutationFn: (id) => post(`${BASE}/eliminar_sede`,  { id_sede: id }), onSuccess: invalidar })

  return {
    sites:              computed(() => data.value ?? []),
    sitesLoading:       isLoading,
    crearSedeMutation,
    actualizarSedeMutation,
    eliminarSedeMutation,
  }
}

// ── Cámaras ────────────────────────────────────────────────────────────────────

// Devuelve TODAS las cámaras (sin paginar) — para combos y KPIs del dashboard
export function useCctvCamaras() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['cctv-camaras'],
    queryFn:  () => post(`${BASE}/listar_camaras`, { page_size: 9999 }),
  })

  const invalidar = () => {
    qc.invalidateQueries({ queryKey: ['cctv-camaras'] })
    qc.invalidateQueries({ queryKey: ['cctv-camaras-pag'] })
    qc.invalidateQueries({ queryKey: ['cctv-dashboard'] })
  }

  const crearCamaraMutation      = useMutation({ mutationFn: (p) => post(`${BASE}/crear_camara`,     p), onSuccess: invalidar })
  const actualizarCamaraMutation = useMutation({ mutationFn: (p) => post(`${BASE}/actualizar_camara`, p), onSuccess: invalidar })
  const eliminarCamaraMutation   = useMutation({ mutationFn: (id) => post(`${BASE}/eliminar_camara`,  { id_camara: id }), onSuccess: invalidar })

  return {
    cameras:              computed(() => data.value?.items ?? []),
    camerasLoading:       isLoading,
    crearCamaraMutation,
    actualizarCamaraMutation,
    eliminarCamaraMutation,
  }
}

// Devuelve cámaras paginadas + filtradas por sede — para la tabla del inventario
export function useCctvCamarasPaginado(filtros) {
  const EMPTY = { items: [], total: 0, page: 1, page_size: 15, total_pages: 1 }

  const { data, isLoading } = useQuery({
    queryKey: computed(() => ['cctv-camaras-pag', filtros.id_sede, filtros.page]),
    queryFn:  () => post(`${BASE}/listar_camaras`, {
      ...(filtros.id_sede ? { id_sede: filtros.id_sede } : {}),
      page:      filtros.page,
      page_size: 15,
    }),
  })

  return {
    camarasPag:        computed(() => data.value?.items ?? []),
    paginacion:        computed(() => data.value        ?? EMPTY),
    camarasPagLoading: isLoading,
  }
}

// ── Cargos / permisos ──────────────────────────────────────────────────────────

export function useCctvCargos() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['cctv-cargos'],
    queryFn:  () => post(`${BASE}/listar_cargos`),
  })

  const invalidar = () => {
    qc.invalidateQueries({ queryKey: ['cctv-cargos'] })
    qc.invalidateQueries({ queryKey: ['cctv-dashboard'] })
  }

  const crearCargoMutation      = useMutation({ mutationFn: (p) => post(`${BASE}/crear_cargo`,     p), onSuccess: invalidar })
  const actualizarCargoMutation = useMutation({ mutationFn: (p) => post(`${BASE}/actualizar_cargo`, p), onSuccess: invalidar })
  const eliminarCargoMutation   = useMutation({ mutationFn: (id) => post(`${BASE}/eliminar_cargo`,  { id_cargo: id }), onSuccess: invalidar })

  return {
    roles:              computed(() => data.value ?? []),
    rolesLoading:       isLoading,
    crearCargoMutation,
    actualizarCargoMutation,
    eliminarCargoMutation,
  }
}

// ── Registros (cambios, revisiones, incidentes) ────────────────────────────────

export function useCctvRegistros() {
  const qc = useQueryClient()

  const { data: cambiosData } = useQuery({
    queryKey: ['cctv-cambios'],
    queryFn:  () => post(`${BASE}/listar_cambios`),
  })

  const { data: revisionesData } = useQuery({
    queryKey: ['cctv-revisiones'],
    queryFn:  () => post(`${BASE}/listar_revisiones`),
  })

  const { data: incidentesData } = useQuery({
    queryKey: ['cctv-incidentes'],
    queryFn:  () => post(`${BASE}/listar_incidentes`),
  })

  const crearChangelogMutation = useMutation({
    mutationFn: (p) => post(`${BASE}/crear_cambio`, p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cctv-cambios'] }),
  })

  const crearRevisionMutation = useMutation({
    mutationFn: (p) => post(`${BASE}/crear_revision`, p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cctv-revisiones'] }),
  })

  const crearIncidenteMutation = useMutation({
    mutationFn: (p) => post(`${BASE}/crear_incidente`, p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cctv-incidentes'] }),
  })

  const actualizarIncidenteMutation = useMutation({
    mutationFn: (p) => post(`${BASE}/actualizar_incidente`, p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cctv-incidentes'] }),
  })

  return {
    changelogs: computed(() => cambiosData.value   ?? []),
    reviews:    computed(() => revisionesData.value ?? []),
    incidents:  computed(() => incidentesData.value ?? []),
    crearChangelogMutation,
    crearRevisionMutation,
    crearIncidenteMutation,
    actualizarIncidenteMutation,
  }
}
