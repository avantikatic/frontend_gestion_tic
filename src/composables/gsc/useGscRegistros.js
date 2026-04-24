import { computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { keepPreviousData } from '@tanstack/vue-query'
import axios from 'axios'
import apiUrl from '../../../config.js'

const headers = { Accept: 'application/json' }

/** Mapea código de filtro a nombre de estado para resolución por ID */
const CODIGO_A_NOMBRE = {
  ABI: 'Abierto',
  ANA: 'En análisis',
  MIT: 'Mitigado',
  CER: 'Cerrado',
}

/**
 * Transforma un registro crudo de la API al formato que usa el componente.
 * @param {Object} reg    Registro crudo de la API
 * @param {Object} cats   Objeto con arrays de catálogos resueltos
 */
function transformRegistro(reg, cats) {
  const { modulosGSC, estadosGSC, tiposEvidencia, fuentesSeguridad, impactos, riesgos } = cats

  const modulo = modulosGSC.find((m) => m.id === reg.id_modulo)
  const estado = estadosGSC.find((e) => e.id === reg.id_estado)

  const registroUI = {
    id: reg.id,
    id_registro: reg.id,
    id_modulo: reg.id_modulo,
    modulo: modulo?.codigo ?? 'SEG',
    estado: estado?.nombre ?? 'Abierto',
    notificarGerencia: reg.notificar_gerencia,
    descripcion: reg.descripcion ?? '',
    resumen: reg.resumen ?? '',
    creadoEn: reg.fecha_creacion,
    actualizadoEn: reg.fecha_actualizacion ?? reg.fecha_creacion,
    afectaSistemas: [],
    evidencias: [],
    evidencia: false,
    tiene_evidencias: reg.tiene_evidencias ?? false,
    cantidad_evidencias: reg.cantidad_evidencias ?? 0,
    cantidad_sistemas_afectados: reg.cantidad_sistemas_afectados ?? 0,
    hitosEstado: {
      abiertoEn: reg.fecha_abierto ?? null,
      enAnalisisEn: reg.fecha_en_analisis ?? null,
      mitigadoEn: reg.fecha_mitigado ?? null,
      cerradoEn: reg.fecha_cerrado ?? null,
    },
  }

  // Sistemas afectados
  if (Array.isArray(reg.sistemas_afectados)) {
    registroUI.afectaSistemas = reg.sistemas_afectados.map((s) => s.nombre)
  }

  // Evidencias
  if (Array.isArray(reg.evidencias) && reg.evidencias.length > 0) {
    registroUI.evidencias = reg.evidencias.map((ev) => {
      const tipo = tiposEvidencia.find((t) => t.id === ev.id_tipo_evidencia)
      return {
        uid: `E-${ev.id_evidencia}`,
        tipo: tipo?.nombre ?? '',
        observacion: ev.observacion ?? '',
        ...ev.datos_especificos,
      }
    })
    registroUI.evidencia = true
  }

  // Datos específicos del módulo
  if (reg.datos_modulo) {
    const dm = reg.datos_modulo
    switch (registroUI.modulo) {
      case 'SEG': {
        registroUI.fechaHora = dm.fecha_hora_incidente
        const fuente = fuentesSeguridad.find((f) => f.id === dm.id_fuente_seguridad)
        registroUI.fuente = fuente?.nombre ?? ''
        registroUI.tipo = dm.tipo_amenaza ?? ''
        const impacto = impactos.find((i) => i.id === dm.id_impacto)
        registroUI.impacto = impacto?.nombre ?? ''
        registroUI.responsableTIC = dm.responsable_tic ?? ''
        break
      }
      case 'DISP':
        registroUI.servicioAfectado = dm.servicio_afectado ?? ''
        registroUI.tipoEvento = dm.tipo_evento ?? ''
        registroUI.tiempoIndisponibleMin = dm.tiempo_indisponible_min ?? 0
        registroUI.slaAfectado = dm.sla_afectado ?? false
        registroUI.acciones = dm.acciones ?? ''
        break
      case 'MNT': {
        registroUI.area = dm.area ?? ''
        registroUI.tipo = dm.tipo_mantenimiento ?? ''
        registroUI.descripcion = dm.descripcion ?? ''
        registroUI.fechaInicio = dm.fecha_inicio
        registroUI.fechaFin = dm.fecha_fin
        registroUI.requiereParada = dm.requiere_parada ?? false
        const riesgo = riesgos.find((r) => r.id === dm.id_riesgo)
        registroUI.riesgo = riesgo?.nombre ?? ''
        break
      }
      case 'DR':
        registroUI.escenario = dm.escenario ?? ''
        registroUI.fechaInicio = dm.fecha_inicio
        registroUI.fechaFin = dm.fecha_fin
        registroUI.objetivo = dm.objetivo ?? ''
        registroUI.resultado = dm.resultado ?? ''
        registroUI.hallazgos = dm.hallazgos ?? ''
        registroUI.leccionesAprendidas = dm.lecciones_aprendidas ?? ''
        break
    }
  }

  return normalizeRecord(registroUI)
}

function normalizeRecord(r) {
  const x = { ...r }
  if (!x.estado) x.estado = 'Abierto'
  if (x.notificarGerencia === undefined) x.notificarGerencia = false
  if (x.enviarContactosEmpresa === undefined) x.enviarContactosEmpresa = false
  if (!Array.isArray(x.evidencias)) x.evidencias = []
  if (!Array.isArray(x.afectaSistemas)) x.afectaSistemas = []
  if (!Array.isArray(x.correosCC)) x.correosCC = []
  if (x.evidencia === undefined) x.evidencia = false
  return x
}

/**
 * Query principal de registros GSC con paginación, filtros y mutaciones CRUD.
 *
 * @param {Object} filtros  - { moduloSeleccionado, filtroEstado, page, pageSize, q } (todos Ref)
 * @param {Object} catalogos - refs devueltos por useGscCatalogos()
 */
export function useGscRegistros(filtros, catalogos) {
  const { moduloSeleccionado, filtroEstado, page, pageSize, q } = filtros
  const queryClient = useQueryClient()

  /** ID numérico del módulo seleccionado (null si catálogos aún no cargaron) */
  const idModulo = computed(
    () => catalogos.modulosGSC.value.find((m) => m.codigo === moduloSeleccionado.value)?.id ?? null,
  )

  const queryKey = computed(() => [
    'registros-gsc',
    moduloSeleccionado.value,
    filtroEstado.value,
    page.value,
    pageSize.value,
    q.value,
  ])

  const { data: rawData, isLoading, isError, isFetching } = useQuery({
    queryKey,
    queryFn: async () => {
      const filtros = {
        id_modulo: idModulo.value,
        limite: pageSize.value,
        offset: (page.value - 1) * pageSize.value,
      }

      // Resolver id_estado desde el código de filtro
      const nombreEstado = CODIGO_A_NOMBRE[filtroEstado.value]
      if (nombreEstado) {
        const estado = catalogos.estadosGSC.value.find((e) => e.nombre === nombreEstado)
        if (estado) filtros.id_estado = estado.id
      }

      if (q.value.trim()) filtros.q = q.value.trim()

      const response = await axios.post(
        `${apiUrl}/gestion-continuidad/listar_registros_gsc`,
        filtros,
        { headers },
      )
      return response.data.data
    },
    enabled: computed(() => !!idModulo.value),
    placeholderData: keepPreviousData, // mantiene datos previos mientras carga la siguiente página
  })

  /** Registros transformados listos para la UI */
  const registros = computed(() => {
    if (!rawData.value?.registros) return []
    const cats = {
      modulosGSC: catalogos.modulosGSC.value,
      estadosGSC: catalogos.estadosGSC.value,
      tiposEvidencia: catalogos.tiposEvidencia.value,
      fuentesSeguridad: catalogos.fuentesSeguridad.value,
      impactos: catalogos.impactos.value,
      riesgos: catalogos.riesgos.value,
    }
    return rawData.value.registros.map((reg) => transformRegistro(reg, cats))
  })

  const totalRegistros = computed(() => rawData.value?.total ?? 0)
  const totalPaginas = computed(() => rawData.value?.total_paginas ?? 1)

  /** Invalida queries de registros y contadores (para llamar tras mutaciones) */
  function invalidarRegistros() {
    queryClient.invalidateQueries({ queryKey: ['registros-gsc'] })
    queryClient.invalidateQueries({ queryKey: ['contadores-gsc'] })
  }

  // ── Mutaciones ───────────────────────────────────────────────────────────

  const crearRegistroMutation = useMutation({
    mutationFn: (payload) =>
      axios.post(`${apiUrl}/gestion-continuidad/crear_registro_gsc`, payload, { headers }),
    onSuccess: invalidarRegistros,
  })

  const actualizarRegistroMutation = useMutation({
    mutationFn: (payload) =>
      axios.post(`${apiUrl}/gestion-continuidad/actualizar_registro_gsc`, payload, { headers }),
    onSuccess: invalidarRegistros,
  })

  const eliminarRegistroMutation = useMutation({
    mutationFn: (id_registro) =>
      axios.post(
        `${apiUrl}/gestion-continuidad/eliminar_registro_gsc`,
        { id_registro },
        { headers },
      ),
    onSuccess: invalidarRegistros,
  })

  return {
    registros,
    totalRegistros,
    totalPaginas,
    isLoading,
    isError,
    isFetching,
    crearRegistroMutation,
    actualizarRegistroMutation,
    eliminarRegistroMutation,
  }
}

/**
 * Query para obtener un registro individual (usado en el modal de edición).
 * @param {Ref<number|null>} idRegistro
 */
export function useGscRegistroDetalle(idRegistro) {
  return useQuery({
    queryKey: computed(() => ['registro-gsc-detalle', idRegistro.value]),
    queryFn: () =>
      axios
        .post(
          `${apiUrl}/gestion-continuidad/obtener_registro_gsc`,
          { id_registro: idRegistro.value },
          { headers },
        )
        .then((r) => r.data.data),
    enabled: computed(() => !!idRegistro.value),
    staleTime: 0, // Siempre fresco al abrir el modal de edición
  })
}

/**
 * Query de contadores KPI globales (sin filtro de módulo).
 */
export function useGscContadores() {
  return useQuery({
    queryKey: ['contadores-gsc'],
    queryFn: () =>
      axios
        .post(`${apiUrl}/gestion-continuidad/obtener_contadores_gsc`, {}, { headers })
        .then((r) => r.data.data ?? { total: 0, abiertos: 0, en_analisis: 0, mitigados: 0, cerrados: 0 }),
  })
}
