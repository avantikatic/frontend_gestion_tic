import { computed } from 'vue'
import { useQuery, useMutation, useQueryClient, useQueries } from '@tanstack/vue-query'
import axios from 'axios'
import apiUrl from '../../../config.js'

const headers = { Accept: 'application/json' }
const headersJson = { Accept: 'application/json', 'Content-Type': 'application/json' }

// ── Catálogos ────────────────────────────────────────────────────────────────

/**
 * Carga los 5 catálogos de licencias en paralelo.
 * staleTime: Infinity — solo se invalidan cuando se crea un nuevo ítem.
 */
export function useLicenciasCatalogos() {
  const queryClient = useQueryClient()

  const results = useQueries({
    queries: [
      {
        queryKey: ['licencias-cat-tipos-servicio'],
        queryFn: () =>
          axios.post(`${apiUrl}/licencias/catalogos/tipos-servicio`, {}, { headers })
            .then((r) => r.data.data ?? []),
        staleTime: Infinity,
      },
      {
        queryKey: ['licencias-cat-proveedores'],
        queryFn: () =>
          axios.post(`${apiUrl}/licencias/catalogos/proveedores`, {}, { headers })
            .then((r) => r.data.data ?? []),
        staleTime: Infinity,
      },
      {
        queryKey: ['licencias-cat-productos'],
        queryFn: () =>
          axios.post(`${apiUrl}/licencias/catalogos/productos-servicios`, {}, { headers })
            .then((r) => r.data.data ?? []),
        staleTime: Infinity,
      },
      {
        queryKey: ['licencias-cat-metodos-pago'],
        queryFn: () =>
          axios.post(`${apiUrl}/licencias/catalogos/metodos-pago`, {}, { headers })
            .then((r) => r.data.data ?? []),
        staleTime: Infinity,
      },
      {
        queryKey: ['licencias-cat-monedas'],
        queryFn: () =>
          axios.post(`${apiUrl}/licencias/catalogos/tipos-moneda`, {}, { headers })
            .then((r) => r.data.data ?? []),
        staleTime: Infinity,
      },
    ],
  })

  const invalidarCatalogos = () => {
    queryClient.invalidateQueries({ queryKey: ['licencias-cat-tipos-servicio'] })
    queryClient.invalidateQueries({ queryKey: ['licencias-cat-proveedores'] })
    queryClient.invalidateQueries({ queryKey: ['licencias-cat-productos'] })
    queryClient.invalidateQueries({ queryKey: ['licencias-cat-metodos-pago'] })
    queryClient.invalidateQueries({ queryKey: ['licencias-cat-monedas'] })
  }

  // Mutations para crear ítems de catálogo
  const crearProductoMutation = useMutation({
    mutationFn: (nombre) =>
      axios.post(`${apiUrl}/licencias/catalogos/productos-servicios/crear`, { nombre }, { headers }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['licencias-cat-productos'] }),
  })

  const crearTipoServicioMutation = useMutation({
    mutationFn: (nombre) =>
      axios.post(`${apiUrl}/licencias/catalogos/tipos-servicio/crear`, { nombre }, { headers }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['licencias-cat-tipos-servicio'] }),
  })

  const crearMetodoPagoMutation = useMutation({
    mutationFn: (nombre) =>
      axios.post(`${apiUrl}/licencias/catalogos/metodos-pago/crear`, { nombre }, { headers }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['licencias-cat-metodos-pago'] }),
  })

  return {
    tiposServicio: computed(() => results.value[0]?.data ?? []),
    proveedores: computed(() => results.value[1]?.data ?? []),
    productos: computed(() => results.value[2]?.data ?? []),
    metodosPago: computed(() => results.value[3]?.data ?? []),
    tiposMoneda: computed(() => results.value[4]?.data ?? []),
    isLoading: computed(() => results.value.some((r) => r.isLoading)),
    invalidarCatalogos,
    crearProductoMutation,
    crearTipoServicioMutation,
    crearMetodoPagoMutation,
  }
}

// ── Licencias (lista paginada + KPIs) ────────────────────────────────────────

/**
 * Query principal de licencias con paginación y KPIs.
 * @param {Ref<number>} page
 * @param {Ref<number>} perPage
 */
export function useLicencias(page, perPage) {
  const queryClient = useQueryClient()
  const queryKey = computed(() => ['licencias', page.value, perPage.value])

  const { data, isLoading, isFetching } = useQuery({
    queryKey,
    queryFn: () =>
      axios
        .post(
          `${apiUrl}/licencias/obtener?page=${page.value}&per_page=${perPage.value}`,
          { incluir_bajas: true },
          { headers },
        )
        .then((r) => r.data.data),
    placeholderData: (prev) => prev,
  })

  const licencias = computed(() => data.value?.licencias ?? [])
  const totalLicencias = computed(() => data.value?.total ?? 0)
  const totalPaginas = computed(() => data.value?.total_pages ?? 1)
  const kpisBackend = computed(() => data.value?.kpis ?? {
    total: 0, criticas: 0, proximas: 0, vigentes: 0, costo_anual_total: 0,
  })

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ['licencias'] })

  // Mutation crear
  const crearLicenciaMutation = useMutation({
    mutationFn: (payload) =>
      axios.post(`${apiUrl}/licencias/crear`, payload, { headers: headersJson }),
    onSuccess: invalidar,
  })

  // Mutation actualizar (incluye baja/reactivar)
  const actualizarLicenciaMutation = useMutation({
    mutationFn: ({ id, payload }) =>
      axios.put(`${apiUrl}/licencias/actualizar/${id}`, payload, { headers: headersJson }),
    onSuccess: invalidar,
  })

  return {
    licencias,
    totalLicencias,
    totalPaginas,
    kpisBackend,
    isLoading,
    isFetching,
    crearLicenciaMutation,
    actualizarLicenciaMutation,
  }
}

// ── Tipos de revisión ────────────────────────────────────────────────────────

export function useTiposRevision() {
  const { data, isLoading } = useQuery({
    queryKey: ['licencias-tipos-revision'],
    queryFn: () =>
      axios.post(`${apiUrl}/licencias/tipos-revision`, {}, { headers })
        .then((r) => r.data.data ?? []),
    staleTime: Infinity,
  })
  return {
    tiposRevision: computed(() => data.value ?? []),
    isLoading,
  }
}

// ── Revisiones ───────────────────────────────────────────────────────────────

/**
 * @param {Ref<number>} page
 * @param {Ref<number>} perPage
 */
export function useRevisiones(page, perPage) {
  const queryClient = useQueryClient()
  const queryKey = computed(() => ['licencias-revisiones', page.value, perPage.value])

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      axios
        .post(
          `${apiUrl}/licencias/revisiones/obtener?page=${page.value}&per_page=${perPage.value}`,
          {},
          { headers },
        )
        .then((r) => r.data.data),
    placeholderData: (prev) => prev,
  })

  const revisiones = computed(() => data.value?.revisiones ?? [])
  const totalRevisiones = computed(() => data.value?.total ?? 0)
  const totalPaginas = computed(() => data.value?.total_pages ?? 1)

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ['licencias-revisiones'] })

  const agregarRevisionMutation = useMutation({
    mutationFn: (payload) =>
      axios.post(`${apiUrl}/licencias/revisiones/crear`, payload, { headers }),
    onSuccess: invalidar,
  })

  const eliminarRevisionMutation = useMutation({
    mutationFn: (revision_id) =>
      axios.put(`${apiUrl}/licencias/revisiones/eliminar`, { revision_id }, { headers }),
    onSuccess: invalidar,
  })

  return {
    revisiones,
    totalRevisiones,
    totalPaginas,
    isLoading,
    agregarRevisionMutation,
    eliminarRevisionMutation,
  }
}

// ── Versiones ────────────────────────────────────────────────────────────────

/**
 * @param {Ref<number>} page
 * @param {Ref<number>} perPage
 */
export function useVersiones(page, perPage) {
  const queryClient = useQueryClient()
  const queryKey = computed(() => ['licencias-versiones', page.value, perPage.value])

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      axios
        .post(
          `${apiUrl}/licencias/versiones/obtener?page=${page.value}&per_page=${perPage.value}`,
          {},
          { headers },
        )
        .then((r) => r.data.data),
    placeholderData: (prev) => prev,
  })

  const versiones = computed(() => data.value?.versiones ?? [])
  const totalVersiones = computed(() => data.value?.total ?? 0)
  const totalPaginas = computed(() => data.value?.total_pages ?? 1)

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ['licencias-versiones'] })

  const agregarVersionMutation = useMutation({
    mutationFn: (payload) =>
      axios.post(`${apiUrl}/licencias/versiones/crear`, payload, { headers }),
    onSuccess: invalidar,
  })

  const eliminarVersionMutation = useMutation({
    mutationFn: (version_id) =>
      axios.put(`${apiUrl}/licencias/versiones/eliminar`, { version_id }, { headers }),
    onSuccess: invalidar,
  })

  return {
    versiones,
    totalVersiones,
    totalPaginas,
    isLoading,
    agregarVersionMutation,
    eliminarVersionMutation,
  }
}
