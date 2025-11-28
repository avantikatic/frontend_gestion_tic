<template>
  <main class="indicators-module">
    <!-- Cabecera del módulo con título y controles -->
    <div class="header">
      <div>
        <p class="breadcrumb">Gestión TIC / Indicadores</p>
        <h1>{{ selectedView === 'informe' ? 'INFORME DE GESTIÓN' : 'AUTOMATIZACIÓN DE ACTIVIDADES DE MACROPROCESOS' }}</h1>
      </div>

      <div class="header-controls">
        <select id="viewSelect" v-model="selectedView" class="year-selector">
          <option value="module">Automatización de actividades de macroprocesos</option>
          <option value="informe">Informe de Gestión</option>
        </select>

        <template v-if="selectedView !== 'informe'">
          <select
            id="monthFilter"
            v-model="monthFilter"
            class="month-selector"
          >
            <option value="Todos">Todos los meses</option>
            <option
              v-for="m in allMonths"
              :key="m"
              :value="m"
            >
              {{ m }}
            </option>
          </select>

          <button
            type="button"
            class="btn-crear-anio"
            @click="resetFilters"
          >
            Limpiar filtros
          </button>
        </template>
      </div>
    </div>

    <!-- Mostrar componente Indicators cuando se selecciona 'Informe de Gestión' -->
    <Indicators v-if="selectedView === 'informe'" />

    <!-- Contenido del módulo de indicadores -->
    <template v-else>
    <section class="indicator-info">
      <h2>1. INFORMACIÓN DEL INDICADOR</h2>
      <table class="info-table">
        <thead>
          <tr>
            <th>INDICADOR</th>
            <th>TIPO</th>
            <th>FÓRMULA</th>
            <th>META ESTADO ADECUADO</th>
            <th>ESTADO ACEPTABLE</th>
            <th>ESTADO INACEPTABLE</th>
            <th>FRECUENCIA DE SEGUIMIENTO</th>
            <th>RESPONSABLE DEL INDICADOR</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="indicator-name">{{ indicatorInfo.name }}</td>
            <td>{{ indicatorInfo.type }}</td>
            <td class="formula">{{ indicatorInfo.formulaShort }}</td>
            <td class="meta-adecuado">{{ indicatorInfo.meta }}%</td>
            <td class="estado-aceptable">{{ indicatorInfo.acceptableRange }}</td>
            <td class="estado-inaceptable">{{ indicatorInfo.unacceptableText }}</td>
            <td>{{ indicatorInfo.frequency }}</td>
            <td>{{ indicatorInfo.owner }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- Grid 2 columnas: izquierda ancho, derecha gráficas -->
    <section class="content-grid">
      <!-- Columna izquierda: resultados + análisis -->
      <div class="content-left">
        
        <!-- ============ INDICATOR RESULTS TABLE (antes IndicatorResultsTable.vue) ============ -->
        <section class="indicator-table">
          <header class="indicator-table__header">
            <h2>2. Resultados</h2>
            <p class="subtitle">
              Seguimiento mensual de la automatización de actividades de macroprocesos.
            </p>
          </header>

          <div class="indicator-table__wrapper">
            <table>
              <thead>
                <tr>
                  <th>Mes</th>
                  <th>Proyectos</th>
                  <th>ACPM</th>
                  <th>Activ. informe gestión</th>
                  <th>N° support a ejecutar</th>
                  <th>N° soportes cerrados oportunamente</th>
                  <th>N° soportes cerrados fuera de tiempo</th>
                  <th>N° soportes sin cierre</th>
                  <th>% Automatización oportunamente</th>
                  <th>% Acumulado año</th>
                  <th>Meta</th>
                  <th>% Ejecución total tickets</th>
                  <th>N° soportes ingresados</th>
                  <th>N° soportes pendientes</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!filteredResults.length">
                  <td colspan="14" class="empty-row">
                    No hay registros para el periodo seleccionado.
                  </td>
                </tr>

                <tr v-for="row in filteredResults" :key="row.month">
                  <td class="sticky-col">{{ row.month }}</td>
                  <td>{{ row.projects }}</td>
                  <td>{{ row.acpm }}</td>
                  <td>{{ row.reports }}</td>
                  <td>{{ row.totalSupports }}</td>
                  <td>{{ row.supportsOnTime }}</td>
                  <td>{{ row.supportsLate }}</td>
                  <td>{{ row.supportsOpen }}</td>
                  <td :class="percentageClass(row.pctAutomation)">
                    {{ row.pctAutomation }}%
                  </td>
                  <td>{{ row.pctAccumulated }}%</td>
                  <td>90%</td>
                  <td>{{ row.pctExecutionTickets }}%</td>
                  <td>{{ row.supportsEntered }}</td>
                  <td>{{ row.supportsPending }}</td>
                </tr>

                <tr class="totals-row" v-if="filteredResults.length">
                  <td class="sticky-col">TOTAL / PROM</td>
                  <td>{{ totals.projects }}</td>
                  <td>{{ totals.acpm }}</td>
                  <td>{{ totals.reports }}</td>
                  <td>{{ totals.totalSupports }}</td>
                  <td>{{ totals.supportsOnTime }}</td>
                  <td>{{ totals.supportsLate }}</td>
                  <td>{{ totals.supportsOpen }}</td>
                  <td>{{ totals.avgAutomation }}%</td>
                  <td>{{ totals.avgAccumulated }}%</td>
                  <td>90%</td>
                  <td>{{ totals.avgExecution }}%</td>
                  <td>{{ totals.supportsEntered }}</td>
                  <td>{{ totals.supportsPending }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- ============ INDICATOR ANALYSIS TABLE (antes IndicatorAnalysisTable.vue) ============ -->
        <section class="indicator-analysis">
          <header class="indicator-analysis__header">
            <div>
              <h2>4. Análisis de causas y acciones</h2>
              <p class="subtitle">
                Registro mensual de causas principales, acciones correctivas y seguimiento.
              </p>
            </div>

            <button class="btn-agregar-analisis" type="button" @click="openCreateModal">
              + Agregar análisis
            </button>
          </header>

          <div class="indicator-analysis__wrapper">
            <table>
              <thead>
                <tr>
                  <th>Mes</th>
                  <th>Análisis (causas principales)</th>
                  <th>Acciones a tomar</th>
                  <th>Responsable</th>
                  <th>Fecha de compromiso</th>
                  <th>Seguimiento</th>
                  <th style="width: 90px">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!filteredAnalysis.length">
                  <td colspan="7" class="empty-row">
                    No hay análisis registrados para el periodo seleccionado.
                  </td>
                </tr>

                <tr v-for="item in filteredAnalysis" :key="item.month">
                  <td class="month-cell">{{ item.month }}</td>
                  <td>{{ item.analysis }}</td>
                  <td>{{ item.actions }}</td>
                  <td>{{ item.responsible }}</td>
                  <td>{{ item.commitmentDate }}</td>
                  <td>{{ item.followUp }}</td>
                  <td>
                    <button class="btn-ghost" type="button" @click="openEditModal(item)">
                      ✏️
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Modal -->
          <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
            <div class="modal">
              <header class="modal__header">
                <h3>{{ isEditing ? 'Editar análisis' : 'Nuevo análisis' }}</h3>
                <button class="modal__close" type="button" @click="closeModal">×</button>
              </header>

              <div class="modal__body">
                <div class="form-group">
                  <label for="month">Mes</label>
                  <select
                    id="month"
                    v-model="form.month"
                    :disabled="isEditing"
                  >
                    <option disabled value="">Selecciona un mes</option>
                    <option
                      v-for="m in allMonths"
                      :key="m"
                      :value="m"
                    >
                      {{ m }}
                    </option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="analysis">Análisis (causas principales)</label>
                  <textarea
                    id="analysis"
                    v-model="form.analysisText"
                    rows="3"
                  ></textarea>
                </div>

                <div class="form-group">
                  <label for="actions">Acciones a tomar</label>
                  <textarea
                    id="actions"
                    v-model="form.actions"
                    rows="3"
                  ></textarea>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="responsible">Responsable</label>
                    <input
                      id="responsible"
                      type="text"
                      v-model="form.responsible"
                      placeholder="Ej. Jeyson Martínez – Coordinador TIC"
                    />
                  </div>

                  <div class="form-group">
                    <label for="date">Fecha de compromiso</label>
                    <input
                      id="date"
                      type="date"
                      v-model="form.commitmentDate"
                    />
                  </div>
                </div>

                <div class="form-group">
                  <label for="follow">Seguimiento</label>
                  <textarea
                    id="follow"
                    v-model="form.followUp"
                    rows="2"
                  ></textarea>
                </div>
              </div>

              <footer class="modal__footer">
                <button class="btn-ghost" type="button" @click="closeModal">
                  Cancelar
                </button>
                <button class="btn-primary" type="button" @click="saveAnalysis">
                  Guardar
                </button>
              </footer>
            </div>
          </div>
        </section>

      </div>

      <!-- Columna derecha: gráficas + tickets -->
      <div class="content-right">
        
        <!-- ============ INDICATOR CHART ============ -->
        <section class="indicator-chart">
          <header class="indicator-chart__header">
            <h2>3. Gráfica</h2>
            <!-- <p class="subtitle">
              Total de tickets vs. tickets ejecutados oportunamente por mes.
            </p> -->
          </header>

          <!-- Gráfica simple de barras con líneas SVG -->
          <div class="simple-bar-chart-outer">
            <div class="simple-bar-chart-scroll">
              <div class="simple-bar-chart compact">
                <div class="simple-bar-chart__header">
                  <h3></h3>
                </div>

                <div class="simple-bar-chart__body">
                  <div class="simple-axis-y">
                    <span>120</span>
                    <span>100</span>
                    <span>80</span>
                    <span>60</span>
                    <span>40</span>
                    <span>20</span>
                    <span>0</span>
                  </div>

                  <div class="simple-bars-area">
                    <!-- SVG para las líneas (solo cuando no hay filtro de mes) -->
                    <svg v-if="monthFilter === 'Todos'" class="simple-line-svg" preserveAspectRatio="none" viewBox="0 0 100 180">
                      <!-- Línea azul del índice de cumplimiento -->
                      <polyline
                        :points="linePoints"
                        fill="none"
                        stroke="#2563eb"
                        stroke-width="0.3"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <!-- Línea gris oscuro del % acumulado del año -->
                      <polyline
                        :points="linePointsAcumulado"
                        fill="none"
                        stroke="#374151"
                        stroke-width="0.3"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <!-- Línea verde de la meta -->
                      <polyline
                        :points="linePointsMeta"
                        fill="none"
                        stroke="#004d0d"
                        stroke-width="1"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>

                    <!-- Barras -->
                    <div v-for="(mes, idx) in mesesFiltrados" :key="idx" class="simple-bar-group">
                      <div
                        class="simple-bar simple-bar-total"
                        :style="{ height: (mes.totalVencer / 120 * 100) + '%', width: '28px' }"
                        :title="`${mes.mes}: ${mes.totalVencer} total tickets`"
                      ></div>
                      <div
                        class="simple-bar simple-bar-oportuno"
                        :style="{ height: (mes.atendidosOportuno / 120 * 100) + '%', width: '28px' }"
                        :title="`${mes.mes}: ${mes.atendidosOportuno} oportunos`"
                      ></div>
                      <span class="simple-bar-label">{{ mes.mes.substring(0, 3) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Leyenda -->
            <div class="simple-legend-bottom">
              <div class="legend-item">
                <svg width="20" height="3" style="margin-right: 6px;">
                  <line x1="0" y1="1.5" x2="20" y2="1.5" stroke="#2563eb" stroke-width="2" />
                </svg>
                <span>Índice cumplimiento (%)</span>
              </div>
              <div class="legend-item">
                <svg width="20" height="3" style="margin-right: 6px;">
                  <line x1="0" y1="1.5" x2="20" y2="1.5" stroke="#374151" stroke-width="2" />
                </svg>
                <span>Acumulado año (%)</span>
              </div>
              <div class="legend-item">
                <svg width="20" height="3" style="margin-right: 6px;">
                  <line x1="0" y1="1.5" x2="20" y2="1.5" stroke="#004d0d" stroke-width="2" stroke-dasharray="4 2" />
                </svg>
                <span>Meta (%)</span>
              </div>
              <div class="legend-item">
                <span class="legend-color legend-bar" style="background-color: #1e3a8a;"></span>
                <span>Total tickets</span>
              </div>
              <div class="legend-item">
                <span class="legend-color legend-bar" style="background-color: #60a5fa;"></span>
                <span>Oportunos</span>
              </div>
            </div>
          </div>
        </section>

        <!-- ============ INDICATOR STATUS DONUT (antes IndicatorStatusDonut.vue) ============ -->
        <section class="status-donut">
          <header class="status-donut__header">
            <h2>Estado global del indicador</h2>
            <p class="subtitle">
              Promedio de automatización del periodo filtrado.
            </p>
          </header>

          <div class="status-donut__body">
            <div class="donut-wrapper">
              <div
                class="donut"
                :style="{
                  background: `conic-gradient(${donutColor} ${averageAutomation}%, #e5e7eb 0)`
                }"
              >
                <div class="donut-center">
                  <span class="donut-value">{{ averageAutomation }}%</span>
                  <span class="donut-label">cumplimiento</span>
                </div>
              </div>
            </div>

            <div class="status-info">
              <p class="status-title">Estado</p>
              <p :class="['status-pill', donutStatusClass]">
                {{ donutStatusLabel }}
              </p>

              <ul class="legend">
                <li>
                  <span class="legend-dot legend-dot--good"></span>
                  Adecuado (≥ {{ currentIndicator.meta }}%)
                </li>
                <li>
                  <span class="legend-dot legend-dot--warning"></span>
                  Aceptable (80% – {{ currentIndicator.meta - 1 }}%)
                </li>
                <li>
                  <span class="legend-dot legend-dot--bad"></span>
                  Inaceptable (&lt; 80%)
                </li>
              </ul>
            </div>
          </div>
        </section>

        <!-- ============ TICKETS DEL PERIODO ============ -->
        <section class="tickets-periodo-card">
          <h3>Tickets del periodo</h3>
          <p class="tickets-periodo-desc">Detalle de tickets asociados al indicador por mes.</p>
          
          <div v-if="cargandoTickets" class="loading-tickets">
            Cargando tickets...
          </div>

          <div v-else-if="monthFilter === 'Todos'" class="tickets-periodo-empty">
            <p>Selecciona un mes en el filtro para ver el detalle de los tickets.</p>
          </div>

          <div v-else-if="ticketsPeriodo.length === 0" class="tickets-periodo-empty">
            <p>No hay tickets estratégicos registrados para este mes.</p>
          </div>

          <div v-else class="tickets-list-container">
            <div class="tickets-summary-cards">
              <div class="summary-card card-total">
                <span class="card-label">TOTAL TICKETS</span>
                <span class="card-value">{{ resumenTicketsPeriodo.total || 0 }}</span>
              </div>
              <div class="summary-card card-cerrados">
                <span class="card-label">CERRADOS</span>
                <span class="card-value">{{ resumenTicketsPeriodo.cerrados || 0 }}</span>
              </div>
              <div class="summary-card card-progreso">
                <span class="card-label">EN PROGRESO</span>
                <span class="card-value">{{ resumenTicketsPeriodo.en_progreso || 0 }}</span>
              </div>
              <div class="summary-card card-abiertos">
                <span class="card-label">ABIERTOS</span>
                <span class="card-value">{{ resumenTicketsPeriodo.abiertos || 0 }}</span>
              </div>
            </div>

            <div class="table-scroll-wrapper">
              <table class="tickets-table">
                <thead>
                  <tr>
                    <th>Ticket</th>
                    <th>Estado</th>
                    <th>Responsable</th>
                    <th>Solicitante</th>
                    <th>Macroproceso</th>
                    <th>Tipo</th>
                    <th>Fecha Solicitud</th>
                    <th>Fecha Vencimiento</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="ticket in ticketsPeriodo" :key="ticket.ticket_id">
                    <td class="ticket-id">#{{ ticket.ticket_id }}</td>
                    <td>
                      <span class="status-badge" :class="`status-${ticket.estado}`">
                        {{ ticket.estado_nombre }}
                      </span>
                    </td>
                    <td class="ticket-responsable">{{ ticket.responsable_nombre }}</td>
                    <td class="ticket-solicitante" :title="ticket.from_name">{{ ticket.from_name }}</td>
                    <td class="ticket-macro">{{ ticket.macroproceso_nombre }}</td>
                    <td class="ticket-tipo">{{ ticket.tipo_soporte_nombre }}</td>
                    <td class="ticket-fecha">{{ ticket.receivedAt }}</td>
                    <td class="ticket-fecha">{{ ticket.fecha_vencimiento }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Paginación -->
            <div class="pagination-controls" v-if="totalTickets > itemsPerPage">
              <button 
                class="btn-pagination" 
                :disabled="currentPage === 1" 
                @click="cambiarPagina(currentPage - 1)"
              >
                Anterior
              </button>
              <span class="pagination-info">
                Página {{ currentPage }} de {{ totalPages }}
              </span>
              <button 
                class="btn-pagination" 
                :disabled="currentPage === totalPages" 
                @click="cambiarPagina(currentPage + 1)"
              >
                Siguiente
              </button>
            </div>
          </div>
        </section>

      </div>
    </section>
    </template>
  </main>
</template>

<script setup>
import { computed, ref, reactive, onMounted, watch } from 'vue'
import axios from 'axios'
import Indicators from './Indicators.vue'

const apiUrl = import.meta.env.VITE_API_URL

const selectedView = ref('module') // 'module' o 'informe'
const selectedIndicatorId = ref(1)
const monthFilter = ref('Todos')

// Variables para el modal de análisis
const showModal = ref(false)
const isEditing = ref(false)
const form = reactive({
  month: '',
  analysisText: '',
  actions: '',
  responsible: '',
  commitmentDate: '',
  followUp: ''
})

// Variable para almacenar los datos del backend
const indicadoresEstrategicos = ref(null)
const cargandoDatos = ref(false)

// Variables para tickets del periodo
const ticketsPeriodo = ref([])
const resumenTicketsPeriodo = ref({
  total: 0,
  cerrados: 0,
  en_progreso: 0,
  abiertos: 0
})
const cargandoTickets = ref(false)
const currentPage = ref(1)
const itemsPerPage = ref(5)
const totalTickets = ref(0)
const totalPages = ref(0)

const indicators = ref([
  {
    id: 1,
    name: 'Automatización de actividades de macroprocesos',
    type: 'Estratégico',
    formulaShort:
      '(# soportes ejecutados oportunamente / # soportes que debían ejecutarse) × 100',
    formulaFull:
      '(# support derivados de ACPM, proyectos e informes de gestión para automatización de actividades de macroprocesos ejecutados oportunamente / # support derivados de ACPM, proyectos e informes de gestión para automatización de actividades de macroprocesos que debían ejecutarse) × 100',
    meta: 90,
    acceptableRange: '89% – 80%',
    unacceptableText: '< 80%',
    frequency: 'Mensual',
    owner: 'Coordinador TIC',
    results: [],
    tickets: [],
    analysis: []
  }
  // Aquí puedes ir agregando los otros indicadores (2, 3, 4, 5…)
])

const currentIndicator = computed(
  () =>
    indicators.value.find((i) => i.id === selectedIndicatorId.value) ||
    indicators.value[0]
)

const baseResults = computed(() => currentIndicator.value.results || [])
const baseAnalysis = computed(() => currentIndicator.value.analysis || [])
const baseTickets = computed(() => currentIndicator.value.tickets || [])

/* Meses disponibles */
const allMonths = computed(() => baseResults.value.map((r) => r.month))

/* Resultados filtrados */
const filteredResults = computed(() => {
  if (monthFilter.value === 'Todos') return baseResults.value
  return baseResults.value.filter((r) => r.month === monthFilter.value)
})

/* Análisis filtrado */
const filteredAnalysis = computed(() => {
  if (monthFilter.value === 'Todos') return baseAnalysis.value
  return baseAnalysis.value.filter((a) => a.month === monthFilter.value)
})

/* Tickets filtrados */
const filteredTickets = computed(() => {
  if (monthFilter.value === 'Todos') return []
  return baseTickets.value.filter((t) => t.month === monthFilter.value)
})

/* Promedio de automatización del periodo filtrado */
const averageAutomation = computed(() => {
  const rows = filteredResults.value.filter((r) => r.totalSupports > 0)
  if (!rows.length) return 0
  const sum = rows.reduce((acc, r) => acc + (r.pctAutomation || 0), 0)
  return Math.round(sum / rows.length)
})

/* Info para cabecera */
const indicatorInfo = computed(() => {
  const meta = currentIndicator.value.meta
  let statusLabel = 'Inaceptable'
  let statusClass = 'status-bad'

  if (averageAutomation.value >= meta) {
    statusLabel = 'Adecuado'
    statusClass = 'status-good'
  } else if (averageAutomation.value >= 80) {
    statusLabel = 'Aceptable'
    statusClass = 'status-warning'
  }

  return {
    id: currentIndicator.value.id,
    name: currentIndicator.value.name,
    type: currentIndicator.value.type,
    formulaShort: currentIndicator.value.formulaShort,
    formulaFull: currentIndicator.value.formulaFull,
    meta,
    acceptableRange: currentIndicator.value.acceptableRange,
    unacceptableText: currentIndicator.value.unacceptableText,
    frequency: currentIndicator.value.frequency,
    owner: currentIndicator.value.owner,
    currentValue: averageAutomation.value,
    currentStatusLabel: statusLabel,
    currentStatusClass: statusClass
  }
})


/* Funciones del modal de análisis */
const openCreateModal = () => {
  isEditing.value = false
  form.month = ''
  form.analysisText = ''
  form.actions = ''
  form.responsible = ''
  form.commitmentDate = ''
  form.followUp = ''
  showModal.value = true
}

const openEditModal = (item) => {
  isEditing.value = true
  form.month = item.month
  form.analysisText = item.analysis
  form.actions = item.actions
  form.responsible = item.responsible
  form.commitmentDate = item.commitmentDate
  form.followUp = item.followUp
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

/* Guardar/actualizar análisis desde el modal */
const handleSaveAnalysis = async (payload) => {
  const {
    month,
    analysisText,
    actions,
    responsible,
    commitmentDate,
    followUp
  } = payload

  try {
    const anioActual = new Date().getFullYear()
    const mesNumero = obtenerNumeroMes(month)
    
    // Buscar si ya existe para obtener el ID (si estamos editando, ya deberíamos tenerlo, pero por si acaso)
    let idAnalisis = null
    if (isEditing.value) {
       const existing = indicators.value[0].analysis.find(a => a.month === month)
       if (existing) idAnalisis = existing.id
    }

    const dataToSend = {
      anio: anioActual,
      mes: mesNumero,
      analisis: analysisText,
      acciones: actions,
      responsable: responsible,
      fecha_compromiso: commitmentDate,
      seguimiento: followUp,
      tipo_ticket: 2, // Estratégico
      id: idAnalisis
    }

    const response = await axios.post(
      `${apiUrl}/indicadores/guardar_analisis_causas`,
      dataToSend,
      {
        headers: {
          Accept: "application/json",
        }
      }
    )

    if (response.status === 200) {
      // Recargar análisis
      await cargarAnalisisCausas()
    }
  } catch (error) {
    console.error('Error guardando análisis:', error)
    if (error.response?.data?.message) {
      alert(error.response.data.message)
    }
  }
}

const saveAnalysis = () => {
  if (!form.month) {
    alert('Debes seleccionar un mes.')
    return
  }

  handleSaveAnalysis({
    indicatorId: currentIndicator.value.id,
    month: form.month,
    analysisText: form.analysisText.trim(),
    actions: form.actions.trim(),
    responsible: form.responsible.trim(),
    commitmentDate: form.commitmentDate,
    followUp: form.followUp.trim()
  })

  showModal.value = false
}

/* Totales para la tabla de resultados */
const totals = computed(() => {
  if (!filteredResults.value.length) {
    return {
      projects: 0,
      acpm: 0,
      reports: 0,
      totalSupports: 0,
      supportsOnTime: 0,
      supportsLate: 0,
      supportsOpen: 0,
      avgAutomation: 0,
      avgAccumulated: 0,
      meta: 0,
      avgExecution: 0,
      supportsEntered: 0,
      supportsPending: 0
    }
  }

  const sum = filteredResults.value.reduce(
    (acc, row) => {
      acc.projects += row.projects || 0
      acc.acpm += row.acpm || 0
      acc.reports += row.reports || 0
      acc.totalSupports += row.totalSupports || 0
      acc.supportsOnTime += row.supportsOnTime || 0
      acc.supportsLate += row.supportsLate || 0
      acc.supportsOpen += row.supportsOpen || 0
      acc.pctAutomation += row.pctAutomation || 0
      acc.pctAccumulated += row.pctAccumulated || 0
      acc.meta += row.meta || 0
      acc.pctExecution += row.pctExecutionTickets || 0
      acc.supportsEntered += row.supportsEntered || 0
      acc.supportsPending += row.supportsPending || 0
      return acc
    },
    {
      projects: 0,
      acpm: 0,
      reports: 0,
      totalSupports: 0,
      supportsOnTime: 0,
      supportsLate: 0,
      supportsOpen: 0,
      pctAutomation: 0,
      pctAccumulated: 0,
      meta: 0,
      pctExecution: 0,
      supportsEntered: 0,
      supportsPending: 0
    }
  )

  const count = filteredResults.value.length

  return {
    projects: sum.projects,
    acpm: sum.acpm,
    reports: sum.reports,
    totalSupports: sum.totalSupports,
    supportsOnTime: sum.supportsOnTime,
    supportsLate: sum.supportsLate,
    supportsOpen: sum.supportsOpen,
    avgAutomation: Math.round(sum.pctAutomation / count),
    avgAccumulated: Math.round(sum.pctAccumulated / count),
    meta: Math.round(sum.meta / count),
    avgExecution: Math.round(sum.pctExecution / count),
    supportsEntered: sum.supportsEntered,
    supportsPending: sum.supportsPending
  }
})

const percentageClass = (value) => {
  if (value >= 90) return 'cell-good'
  if (value >= 80) return 'cell-warning'
  return 'cell-bad'
}

// Altura de la gráfica de barras simple (debe coincidir con el CSS)
const SIMPLE_BAR_CHART_HEIGHT = 180;

// Mapea baseResults (todos los meses) a la estructura que espera la gráfica
// Siempre mostramos todos los meses en la gráfica, independiente del filtro
const mesesFiltrados = computed(() => {
  // Si hay un filtro de mes específico, mostrar solo ese mes
  if (monthFilter.value !== 'Todos') {
    return baseResults.value
      .filter(row => row.month === monthFilter.value)
      .map(row => ({
        mes: row.month,
        totalVencer: row.totalSupports || 0,
        atendidosOportuno: row.supportsOnTime || 0,
        indiceCumplimiento: `${row.pctAutomation || 0}%`,
        acumuladoAnio: `${row.pctAccumulated || 0}%`
      }))
  }
  
  // Si está en "Todos", mostrar todos los meses
  return baseResults.value.map(row => ({
    mes: row.month,
    totalVencer: row.totalSupports || 0,
    atendidosOportuno: row.supportsOnTime || 0,
    indiceCumplimiento: `${row.pctAutomation || 0}%`,
    acumuladoAnio: `${row.pctAccumulated || 0}%`
  }))
})

// Calcula los puntos para la línea SVG del índice de cumplimiento (valor numérico, no porcentaje)
const linePoints = computed(() => {
  if (!mesesFiltrados.value.length) return ''
  const totalMeses = mesesFiltrados.value.length
  return mesesFiltrados.value.map((mes, i) => {
    let valor = 0
    // Usar el valor numérico del porcentaje (por ejemplo, 50)
    if (mes.indiceCumplimiento && typeof mes.indiceCumplimiento === 'string') {
      valor = parseFloat(mes.indiceCumplimiento.replace('%','')) || 0
    }
    const y = SIMPLE_BAR_CHART_HEIGHT - (valor * SIMPLE_BAR_CHART_HEIGHT / 120)
    const x = totalMeses > 1 ? (i / (totalMeses - 1)) * 100 : 50
    return `${x},${y}`
  }).join(' ')
})

// Calcula los puntos para la línea gris oscuro del % acumulado del año
const linePointsAcumulado = computed(() => {
  if (!mesesFiltrados.value.length) return ''
  const totalMeses = mesesFiltrados.value.length
  return mesesFiltrados.value.map((mes, i) => {
    let valor = 0
    if (mes.acumuladoAnio && typeof mes.acumuladoAnio === 'string') {
      valor = parseFloat(mes.acumuladoAnio.replace('%','')) || 0
    }
    const y = SIMPLE_BAR_CHART_HEIGHT - (valor * SIMPLE_BAR_CHART_HEIGHT / 120)
    const x = totalMeses > 1 ? (i / (totalMeses - 1)) * 100 : 50
    return `${x},${y}`
  }).join(' ')
})

// Línea verde de meta (igual formato que las otras)
const linePointsMeta = computed(() => {
  const metaValue = currentIndicator.value?.meta
  if (!mesesFiltrados.value.length || metaValue === null || metaValue === undefined) return ''
  const totalMeses = mesesFiltrados.value.length
  const puntos = mesesFiltrados.value.map((_, i) => {
    const valor = parseFloat(metaValue) || 0
    const y = SIMPLE_BAR_CHART_HEIGHT - (valor * SIMPLE_BAR_CHART_HEIGHT / 120)
    const x = totalMeses > 1 ? (i / (totalMeses - 1)) * 100 : 50
    return `${x},${y}`
  })
  return puntos.join(' ')
})

/* Para el gráfico de barras */
const chartPoints = computed(() =>
  filteredResults.value.map((row) => ({
    label: row.month,
    shortLabel: row.month.slice(0, 3),
    automation: row.pctAutomation,
    accumulated: row.pctAccumulated,
    totalSupports: row.totalSupports,
    supportsOnTime: row.supportsOnTime,
    supportsLate: row.supportsLate
  }))
)

const goalPosition = computed(() => {
  const value = currentIndicator.value.meta
  return Math.max(0, Math.min(100, value))
})

// Escala dinámica para las barras basada en el máximo de tickets
const maxTicketsInChart = computed(() => {
  if (!chartPoints.value.length) return 20
  const maxTotal = Math.max(...chartPoints.value.map(p => p.totalSupports || 0))
  // Redondear al múltiplo de 20 más cercano hacia arriba
  return Math.ceil(maxTotal / 20) * 20 || 20
})

const yTicks = computed(() => {
  const max = maxTicketsInChart.value
  const step = max / 5
  return [max, max - step, max - 2*step, max - 3*step, max - 4*step, 0].map(Math.round)
})

const polylinePoints = computed(() => {
  if (!chartPoints.value.length) return ''
  const n = chartPoints.value.length
  return chartPoints.value
    .map((p, i) => {
      const x = (i / (n - 1 || 1)) * 100
      const y = 100 - p.accumulated
      return `${x},${y}`
    })
    .join(' ')
})

/* Para el donut de estado */
const donutStatusLabel = computed(() => {
  if (averageAutomation.value >= currentIndicator.value.meta) return 'Adecuado'
  if (averageAutomation.value >= 80) return 'Aceptable'
  return 'Inaceptable'
})

const donutStatusClass = computed(() => {
  if (averageAutomation.value >= currentIndicator.value.meta) return 'status-good'
  if (averageAutomation.value >= 80) return 'status-warning'
  return 'status-bad'
})

const donutColor = computed(() => {
  if (averageAutomation.value >= currentIndicator.value.meta) return '#16a34a'
  if (averageAutomation.value >= 80) return '#f97316'
  return '#ef4444'
})

/* Para tickets */
const ticketsHeaderText = computed(() => {
  if (monthFilter.value === 'Todos') {
    return 'Detalle de tickets asociados al indicador por mes.'
  }
  return `Tickets que aportan al indicador en ${monthFilter.value}.`
})

const ticketsStats = computed(() => {
  const total = filteredTickets.value.length
  const closed = filteredTickets.value.filter((t) => t.status === 'Cerrado').length
  const inProgress = filteredTickets.value.filter(
    (t) => t.status === 'En progreso'
  ).length
  const open = filteredTickets.value.filter((t) => t.status === 'Abierto').length
  return { total, closed, inProgress, open }
})

const statusChipClass = (status) => {
  if (status === 'Cerrado') return 'chip-good'
  if (status === 'En progreso') return 'chip-warning'
  return 'chip-bad'
}

/* Limpiar filtros */
const resetFilters = () => {
  monthFilter.value = 'Todos'
}

/* Cargar indicadores estratégicos desde el backend */


const cargarAnalisisCausas = async () => {
  try {
    const anioActual = new Date().getFullYear()
    const response = await axios.post(
      `${apiUrl}/indicadores/obtener_analisis_causas`,
      {
        anio: anioActual,
        tipo_ticket: 2 // Estratégico
      },
      {
        headers: {
          Accept: "application/json",
        }
      }
    )

    if (response.status === 200 && response.data.data) {
      const analisisBackend = response.data.data
      
      // Mapear al formato del frontend
      const analisisMapeados = analisisBackend.map(item => ({
        month: obtenerNombreMes(item.mes),
        analysis: item.analisis,
        actions: item.acciones,
        responsible: item.responsable,
        commitmentDate: item.fecha_compromiso,
        followUp: item.seguimiento,
        id: item.id, // Guardar ID para ediciones
        mes_numero: item.mes
      }))

      if (indicators.value[0]) {
        indicators.value[0].analysis = analisisMapeados
      }
    }
  } catch (error) {
    console.error('Error cargando análisis de causas:', error)
  }
}

// Función auxiliar para obtener nombre del mes (si no existe, agregarla)
const obtenerNombreMes = (numeroMes) => {
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  return meses[numeroMes - 1] || ''
}

// Función auxiliar para obtener número de mes
const obtenerNumeroMes = (nombreMes) => {
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  return meses.indexOf(nombreMes) + 1
}



const cargarIndicadoresEstrategicos = async () => {
  try {
    cargandoDatos.value = true
    const anioActual = new Date().getFullYear()
    
    const response = await axios.post(
      `${apiUrl}/indicadores/obtener_indicadores_estrategicos`,
      { anio: anioActual },
      {
        headers: {
          Accept: "application/json",
        }
      }
    )

    if (response.status === 200 && response.data.data) {
      indicadoresEstrategicos.value = response.data.data
      
      // Mapear los datos del backend al formato del frontend
      const indicadoresBackend = response.data.data.indicadores || []
      
      const resultadosMapeados = indicadoresBackend.map(ind => {
        // Calcular porcentaje de ejecución (tickets cerrados / total a ejecutar)
        const totalExecuted = (ind.oportunos || 0) + (ind.no_oportunos || 0)
        const totalSupports = ind.total_completados || 0
        const pctExecution = totalSupports > 0 ? Math.round((totalExecuted / totalSupports) * 100) : 0

        return {
          month: ind.mes,
          projects: ind.proyectos || 0,
          acpm: ind.acpm || 0,
          reports: ind.actividades_informe || 0,
          totalSupports: totalSupports,
          supportsOnTime: ind.oportunos || 0,
          supportsLate: ind.no_oportunos || 0,
          supportsOpen: ind.sin_respuesta || 0,
          pctAutomation: ind.porcentaje || 0,
          pctAccumulated: ind.porcentaje_acumulado || 0,
          meta: ind.porcentaje_meta || 90,
          pctExecutionTickets: pctExecution,
          supportsEntered: ind.total_ingresados || 0,
          supportsPending: ind.tickets_abiertos || 0
        }
      })

      // Actualizar los resultados del indicador
      if (indicators.value[0]) {
        indicators.value[0].results = resultadosMapeados
      }
      
      // Cargar análisis de causas
      await cargarAnalisisCausas()
    }
  } catch (error) {
    console.error('Error cargando indicadores estratégicos:', error)
  } finally {
    cargandoDatos.value = false
  }
}

// Función para cargar tickets del periodo seleccionado
const cargarTicketsPeriodo = async () => {
  if (monthFilter.value === 'Todos') {
    ticketsPeriodo.value = []
    return
  }

  try {
    cargandoTickets.value = true
    const anioActual = new Date().getFullYear()
    const mesNumero = obtenerNumeroMes(monthFilter.value)
    
    const response = await axios.post(
      `${apiUrl}/indicadores/obtener_tickets_periodo`,
      {
        anio: anioActual,
        mes: mesNumero,
        tipo_ticket: 2, // Estratégico
        page: currentPage.value,
        limit: itemsPerPage.value
      },
      {
        headers: {
          Accept: "application/json",
        }
      }
    )

    if (response.status === 200 && response.data.data) {
      ticketsPeriodo.value = response.data.data.tickets || []
      resumenTicketsPeriodo.value = response.data.data.resumen || {
        total: 0,
        cerrados: 0,
        en_progreso: 0,
        abiertos: 0
      }
      // Actualizar paginación
      if (response.data.data.pagination) {
        totalTickets.value = response.data.data.pagination.total_records || 0
        totalPages.value = response.data.data.pagination.total_pages || 0
      }
    }
  } catch (error) {
    console.error('Error cargando tickets del periodo:', error)
    ticketsPeriodo.value = []
  } finally {
    cargandoTickets.value = false
  }
}

const cambiarPagina = (nuevaPagina) => {
  if (nuevaPagina >= 1 && nuevaPagina <= totalPages.value) {
    currentPage.value = nuevaPagina
    cargarTicketsPeriodo()
  }
}

// Watcher para cargar tickets cuando cambia el mes seleccionado
watch(monthFilter, (nuevoMes) => {
  if (nuevoMes && nuevoMes !== 'Todos') {
    currentPage.value = 1 // Resetear página al cambiar mes
    cargarTicketsPeriodo()
  } else {
    ticketsPeriodo.value = []
  }
})

// Cargar datos al montar el componente
onMounted(() => {
  cargarIndicadoresEstrategicos()
})
</script>

<style scoped>
/* ============ ESTILOS DEL MÓDULO PRINCIPAL ============ */
.indicators-module {
  width: 100%;
  margin: 0;
  padding: 18px 32px 30px;
  box-sizing: border-box;
}

/* Header con controles */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 20px 22px;
  background: var(--gtic-surface);
  border-radius: 10px;
  box-shadow: 0 8px 18px rgba(19, 41, 64, 0.08);
  border: 1px solid #e2e6ea;
}

.breadcrumb {
  margin: 0 0 4px 0;
  font-size: 0.78rem;
  color: var(--gtic-text-muted);
}

.header h1 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--gtic-text-main);
  margin: 0;
}

.header-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.year-selector,
.month-selector {
  min-width: 120px;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid gray;
  background: var(--gtic-surface);
  font-size: 0.85rem;
  color: var(--gtic-text-main);
  outline: none;
  cursor: pointer;
}

.year-selector:focus,
.month-selector:focus {
  border-color: var(--gtic-secondary);
  box-shadow: 0 0 0 1px rgba(122, 199, 137, 0.35);
}

.btn-crear-anio {
  padding: 6px 14px;
  background: #2e4360;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-crear-anio:hover {
  background: #22396a;
  box-shadow: 0 2px 8px rgba(34, 57, 106, 0.25);
}

.indicator-selector select {
  min-width: 260px;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid gray;
  background: var(--gtic-surface);
  font-size: 0.85rem;
  color: var(--gtic-text-main);
  outline: none;
}

.indicator-selector select:focus {
  border-color: var(--gtic-secondary);
  box-shadow: 0 0 0 1px rgba(122, 199, 137, 0.35);
}

/* Grid principal */
.content-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: minmax(0, 3.5fr) minmax(0, 2.2fr);
  gap: 16px;
  align-items: flex-start;
}

.content-left,
.content-right {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ============ ESTILOS DE TABLA DE INFORMACIÓN ============ */
.indicator-info {
  background: var(--gtic-surface);
  border-radius: 10px;
  padding: 20px 22px;
  margin-bottom: 16px;
  box-shadow: 0 8px 18px rgba(19, 41, 64, 0.08);
  border: 1px solid #e2e6ea;
}

.indicator-info h2 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--gtic-text-main);
  margin: 0 0 14px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #e2e6ea;
}

.info-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.78rem;
}

.info-table th {
  background-color: #22396a;
  color: white;
  padding: 10px 8px;
  text-align: center;
  font-weight: 600;
  border: 1px solid #132940;
  font-size: 0.75rem;
  line-height: 1.3;
}

.info-table td {
  padding: 10px 8px;
  border: 1px solid #e2e6ea;
  text-align: center;
  color: var(--gtic-text-main);
}

.indicator-name {
  text-align: left;
  font-size: 0.78rem;
  line-height: 1.4;
}

.formula {
  font-size: 0.78rem;
  text-align: left;
  font-style: italic;
  color: var(--gtic-text-main);
}

.meta-adecuado {
  background: #e6f7f2;
  color: #14866d;
  font-weight: 600;
}

.estado-aceptable {
  background: #fff4e3;
  color: #d68c23;
  font-weight: 600;
}

.estado-inaceptable {
  background: #fde2e2;
  color: #d64545;
  font-weight: 600;
}

/* ============ ESTILOS DE INDICATOR HEADER (ANTIGUOS - PUEDEN ELIMINARSE SI NO SE USAN) ============ */
.indicator-header {
  background: white;
  border-radius: 10px;
  padding: 20px 22px;
  box-shadow: 0 8px 18px rgba(19, 41, 64, 0.08);
  border: 1px solid #e2e6ea;
}

.indicator-header__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.indicator-header__title h1 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--gtic-text-main);
  margin: 0;
}

.indicator-header__badge {
  padding: 6px 14px;
  border-radius: 999px;
  background: #2c425c;
  color: #ffffff;
  font-size: 0.7rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.indicator-header__grid {
  display: grid;
  grid-template-columns: minmax(0, 2.2fr) repeat(3, minmax(0, 1.1fr));
  grid-auto-rows: auto;
  gap: 10px 14px;
}

.indicator-header__item {
  min-width: 0;
}

.indicator-header__item--formula {
  grid-column: 1 / span 2;
}

.indicator-header__item--status {
  grid-column: 3 / span 2;
}

.label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--gtic-text-muted);
  margin-bottom: 3px;
}

.info-icon {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  border: 1px solid var(--gtic-accent);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  cursor: default;
  background: #f9fafb;
}

.value {
  font-size: 0.88rem;
  color: var(--gtic-text-main);
  line-height: 1.4;
}

/* Pills de estado */
.value-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 72px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
}

.value-pill--good {
  background: #e6f7f2;
  color: #14866d;
}

.value-pill--warning {
  background: #fff4e3;
  color: #d68c23;
}

.value-pill--bad {
  background: #fde2e2;
  color: #d64545;
}

/* Pill de estado actual */
.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-good {
  background: #e6f7f2;
  color: #14866d;
}

.status-warning {
  background: #fff4e3;
  color: #d68c23;
}

.status-bad {
  background: #fde2e2;
  color: #d64545;
}

/* ============ ESTILOS DE INDICATOR RESULTS TABLE ============ */
.indicator-table {
  background: white;
  border-radius: 10px;
  padding: 18px 20px 20px;
  margin-top: 16px;
  box-shadow: 0 8px 18px rgba(19, 41, 64, 0.06);
  border: 1px solid #e2e6ea;
}

.indicator-table__header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
}

.indicator-table__header h2 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--gtic-text-main);
}

.subtitle {
  margin: 0;
  font-size: 0.82rem;
  color: var(--gtic-text-muted);
}

.indicator-table__wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 900px;
  font-size: 0.78rem;
}

thead th {
  background: #22396a;
  color: white;
  text-align: left;
  padding: 6px 8px;
  position: sticky;
  top: 0;
  z-index: 2;
  white-space: nowrap;
}

tbody td {
  padding: 6px 8px;
  border-bottom: 1px solid #edf0f3;
  white-space: nowrap;
  color: var(--gtic-text-main);
}

tbody tr:nth-child(even) {
  background: #f7f9fb;
}

.sticky-col {
  position: sticky;
  left: 0;
  background: inherit;
  z-index: 1;
  font-weight: 600;
}

.totals-row {
  background: #f0f4ff;
  font-weight: 600;
}

.empty-row {
  text-align: center;
  padding: 16px 0;
  color: var(--gtic-text-muted);
}

.cell-good {
  color: #14866d;
  font-weight: 600;
}

.cell-warning {
  color: #d68c23;
  font-weight: 600;
}

.cell-bad {
  color: #d64545;
  font-weight: 600;
}

/* ============ ESTILOS DE INDICATOR ANALYSIS TABLE ============ */
.indicator-analysis {
  background: var(--gtic-surface);
  border-radius: 10px;
  padding: 18px 20px 20px;
  margin-top: 16px;
  box-shadow: 0 8px 18px rgba(19, 41, 64, 0.06);
  border: 1px solid #e2e6ea;
}

.indicator-analysis__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.indicator-analysis__header h2 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--gtic-text-main);
}

.indicator-analysis__wrapper {
  overflow-x: auto;
}

.month-cell {
  font-weight: 600;
  white-space: nowrap;
}

/* Botón + Agregar análisis para tabla de análisis */
.btn-agregar-analisis {
  background: #2e4360;
  color: #fff;
  border: none;
  border-radius: 22px;
  padding: 7px 22px 7px 18px;
  font-size: 1rem;
  font-weight: 400;
  cursor: pointer;
  transition: background 0.18s;
  box-shadow: none;
  outline: none;
  display: inline-block;
  margin-left: 10px;
}
.btn-agregar-analisis:hover {
  background: #22396a;
}

.btn-ghost {
  border: 1px solid var(--gtic-accent);
  background: #ffffff;
  color: var(--gtic-text-main);
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  cursor: pointer;
}

.btn-ghost:hover {
  background: #f3f4f6;
}

/* Modal */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 750px; /* Matching modal-content-wide */
  max-height: 80vh;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

.modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.modal__header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #333;
}

.modal__close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.2s;
}

.modal__close:hover {
  background: #f0f0f0;
}

.modal__body {
  padding: 20px;
  overflow-y: auto;
}

.modal__footer {
  display: flex;
  justify-content: center;
  gap: 0px;
  margin-top: 8px;
  margin-bottom: 0;
  width: 100%;
  font-size: 0.78rem;
  font-weight: 500;
  color: #22396a;
  letter-spacing: 0.5px;
  user-select: none;
  cursor: pointer;
  font-size: 14px;
  min-width: 18px;
  text-align: center;
  white-space: nowrap;
  flex: 1 1 0;
  background: #f5f5f5;
  color: #333;
  padding: 0; /* Override previous padding */
}

.modal__footer button {
  flex: 1;
  padding: 12px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
}

.modal__footer button.btn-ghost {
  background: #f5f5f5;
  color: #333;
  border-radius: 0 0 0 8px;
}

.modal__footer button.btn-ghost:hover {
  background: #e0e0e0;
}

.modal__footer button.btn-primary {
  background: #4CAF50;
  color: white;
  border-radius: 0 0 8px 0;
}

.modal__footer button.btn-primary:hover {
  background: #45a049;
}


/* Formulario */
.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
}

.form-group label {
  font-size: 0.8rem;
  margin-bottom: 4px;
  color: var(--gtic-text-main);
}

.form-group input,
.form-group select,
.form-group textarea {
  border-radius: 8px;
  border: 1px solid #d1d5db;
  padding: 6px 8px;
  font-size: 0.85rem;
  font-family: inherit;
  color: var(--gtic-text-main);
}

.form-group textarea {
  resize: vertical;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--gtic-secondary);
  box-shadow: 0 0 0 1px rgba(122, 199, 137, 0.35);
}

.form-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 12px;
}

/* ============ ESTILOS DE INDICATOR CHART ============ */
.indicator-chart {
  background: var(--gtic-surface);
  border-radius: 10px;
  padding: 16px 18px 18px;
  box-shadow: 0 8px 18px rgba(19, 41, 64, 0.06);
  border: 1px solid #e2e6ea;
}

.indicator-chart__header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}

.indicator-chart__header h2 {
  margin: 0;
  font-size: 0.98rem;
  font-weight: 600;
  color: var(--gtic-text-main);
}

.indicator-chart__body {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px;
  align-items: stretch;
}

.axis-y {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  font-size: 0.68rem;
  color: var(--gtic-text-muted);
  padding-right: 8px;
  height: 200px;
}

.chart-area {
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 12px;
  height: 200px;
  padding: 8px;
  border-radius: 8px;
  background: repeating-linear-gradient(
    to top,
    #f8fafc 0px,
    #f8fafc 39px,
    #e0e7ef 40px,
    #f8fafc 41px
  );
  border: 1px solid #e2e6ea;
  overflow: visible;
}

.bar-group {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: row;
  gap: 4px;
  align-items: flex-end;
  justify-content: center;
  min-width: 40px;
}

.bar {
  width: 36px;
  min-height: 3px;
  border-radius: 4px 4px 2px 2px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.bar-total {
  background: linear-gradient(180deg, #94a3b8, #64748b);
}

.bar-total:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 10px rgba(100, 116, 139, 0.35);
}

.bar-oportuno {
  background: linear-gradient(180deg, #60a5fa, #3b82f6);
}

.bar-oportuno:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.35);
}

.bar-label {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.68rem;
  color: #4b5563;
  font-weight: 500;
  white-space: nowrap;
}

.line-point {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--gtic-primary);
  border: 2px solid #ffffff;
  transform: translateY(50%);
}

.bar-label {
  position: absolute;
  bottom: -16px;
  font-size: 0.68rem;
  color: #4b5563;
}

.line-svg {
  position: absolute;
  inset: 0 0 18px 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  stroke: var(--gtic-primary);
}

/* ============ ESTILOS DE INDICATOR STATUS DONUT ============ */
.status-donut {
  background: var(--gtic-surface);
  border-radius: 10px;
  padding: 16px 18px 18px;
  box-shadow: 0 8px 18px rgba(19, 41, 64, 0.06);
  border: 1px solid #e2e6ea;
}

.status-donut__header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}

.status-donut__header h2 {
  margin: 0;
  font-size: 0.98rem;
  font-weight: 600;
  color: var(--gtic-text-main);
}

.status-donut__body {
  display: flex;
  align-items: center;
  gap: 16px;
}

.donut-wrapper {
  flex: 0 0 150px;
  display: flex;
  justify-content: center;
}

.donut {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.donut-center {
  width: 86px;
  height: 86px;
  border-radius: 50%;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 1px #e5e7eb;
}

.donut-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--gtic-text-main);
}

.donut-label {
  font-size: 0.72rem;
  color: var(--gtic-text-muted);
}

.status-info {
  flex: 1;
}

.status-title {
  margin: 0 0 4px 0;
  font-size: 0.8rem;
  color: var(--gtic-text-muted);
}

.legend {
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 0.78rem;
  color: var(--gtic-text-main);
}

.legend li {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.legend-dot--good {
  background: #16a34a;
}

.legend-dot--warning {
  background: #f97316;
}

.legend-dot--bad {
  background: #ef4444;
}

/* ============ ESTILOS DE INDICATOR TICKETS LIST ============ */
.tickets-card {
  background: var(--gtic-surface);
  border-radius: 10px;
  padding: 16px 18px 18px;
  margin-top: 12px;
  box-shadow: 0 8px 18px rgba(19, 41, 64, 0.06);
  border: 1px solid #e2e6ea;
}

.tickets-card__header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
}

.tickets-card__header h2 {
  margin: 0;
  font-size: 0.98rem;
  font-weight: 600;
  color: var(--gtic-text-main);
}

.empty-state {
  font-size: 0.8rem;
  color: var(--gtic-text-muted);
  padding: 8px 2px;
}

/* Mini-status */
.summary-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 10px;
}

.summary-pill {
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: #f9fafb;
}

.summary-pill .label {
  font-size: 0.7rem;
  color: var(--gtic-text-muted);
}

.summary-pill .value {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--gtic-text-main);
}

.summary-pill--good {
  background: #e6f7f2;
  border-color: #bbf7d0;
}

.summary-pill--warning {
  background: #fff4e3;
  border-color: #fed7aa;
}

.summary-pill--bad {
  background: #fee2e2;
  border-color: #fecaca;
}

/* Tabla */
.table-wrapper {
  overflow-x: auto;
}

.ticket-id {
  font-weight: 600;
}

/* Chips de estado */
.status-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.74rem;
  font-weight: 600;
}

.chip-good {
  background: #e6f7f2;
  color: #15803d;
}

.chip-warning {
  background: #fff4e3;
  color: #d97706;
}

.chip-bad {
  background: #fee2e2;
  color: #b91c1c;
}

/* ============ RESPONSIVE ============ */
@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 960px) {
  .indicator-header__grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .indicator-header__item--formula,
  .indicator-header__item--status {
    grid-column: auto;
  }
}

@media (max-width: 768px) {
  .module-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .indicator-selector {
    align-items: flex-start;
  }

  .indicators-module {
    padding: 14px 12px 24px;
  }
}

@media (max-width: 640px) {
  .status-donut__body {
    flex-direction: column;
    align-items: flex-start;
  }

  .summary-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .modal {
    max-width: 95vw;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}

/* ============ ESTILOS PARA TICKETS DEL PERIODO ============ */
.tickets-periodo-card {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(19,41,64,0.07);
  border: 1px solid #e2e6ea;
  padding: 22px 18px 18px 18px;
  margin-top: 0;
  display: flex;
  flex-direction: column;
}

.tickets-periodo-card h3 {
  font-size: 1.08rem;
  font-weight: 700;
  color: #22396a;
  margin: 0 0 4px 0;
}

.tickets-periodo-desc {
  font-size: 0.92rem;
  color: #6b7280;
  margin-bottom: 16px;
}

.tickets-periodo-empty {
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  padding: 32px;
  text-align: center;
  color: #64748b;
  font-size: 0.95rem;
}

.loading-tickets {
  text-align: center;
  padding: 32px;
  color: #6b7280;
  font-style: italic;
}

.tickets-list-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
}

/* Summary Cards */
.tickets-summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  width: 100%;
}

.summary-card {
  display: flex;
  flex-direction: column;
  padding: 16px 20px;
  border-radius: 8px;
  border: 1px solid transparent;
  gap: 8px;
}

.card-label {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1;
}

.card-value {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
}

/* Card Variants */
.card-total {
  background: #fff;
  border-color: #e2e8f0;
}
.card-total .card-label { color: #64748b; }
.card-total .card-value { color: #1e293b; }

.card-cerrados {
  background: #d1fae5;
  border-color: #a7f3d0;
}
.card-cerrados .card-label { color: #047857; }
.card-cerrados .card-value { color: #059669; }

.card-progreso {
  background: #fef3c7;
  border-color: #fde68a;
}
.card-progreso .card-label { color: #b45309; }
.card-progreso .card-value { color: #d97706; }

.card-abiertos {
  background: #fee2e2;
  border-color: #fecaca;
}
.card-abiertos .card-label { color: #b91c1c; }
.card-abiertos .card-value { color: #dc2626; }

/* Table Styles */
.table-scroll-wrapper {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  width: 100%;
}

.tickets-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
  min-width: 100%;
}

.tickets-table th {
  text-align: left;
  padding: 10px 12px;
  background: #22396a;
  color: #fff;
  font-weight: 600;
  border-bottom: none;
  white-space: nowrap;
  font-size: 0.8rem;
}

.tickets-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #e2e8f0;
  color: #334155;
  background: #fff;
  vertical-align: middle;
  font-size: 0.82rem;
}

.tickets-table tbody tr:hover td {
  background: #f8fafc;
}

.tickets-table tr:last-child td {
  border-bottom: none;
}

.ticket-id {
  font-weight: 600;
  color: #22396a;
  white-space: nowrap;
}

.ticket-responsable,
.ticket-solicitante {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.ticket-macro,
.ticket-tipo {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

.ticket-fecha {
  white-space: nowrap;
  color: #64748b;
  font-size: 0.8rem;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.72rem;
  font-weight: 600;
  text-align: center;
  white-space: nowrap;
}

.status-1 {
  background: #fee2e2;
  color: #991b1b;
}

.status-2 {
  background: #fef3c7;
  color: #92400e;
}

.status-3, .status-4 {
  background: #dcfce7;
  color: #166534;
}

/* Pagination Controls */
.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
  padding: 0;
}

.btn-pagination {
  padding: 8px 16px;
  border: 1px solid #cbd5e1;
  background: #fff;
  border-radius: 6px;
  color: #475569;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 90px;
}

.btn-pagination:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #22396a;
  color: #22396a;
}

.btn-pagination:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: #f8fafc;
  color: #94a3b8;
}

.pagination-info {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 500;
  min-width: 120px;
  text-align: center;
}

/* ========================================
   ESTILOS PARA GRÁFICA SIMPLE DE BARRAS
   ======================================== */

.simple-bar-chart-outer {
  width: 100%;
  padding: 0;
  overflow: hidden;
}

.simple-bar-chart-scroll {
  overflow-x: auto;
  overflow-y: visible;
  max-width: 100%;
}

.simple-bar-chart {
  background: #fff;
  border-radius: 8px;
  padding: 16px 18px 50px;
  min-width: 500px;
  width: 100%;
}

.simple-bar-chart.compact {
  padding: 8px 12px 40px;
}

.simple-bar-chart__header h3 {
  margin: 0 0 12px;
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
}

.simple-bar-chart__body {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  align-items: start;
}

/* Eje Y */
.simple-axis-y {
  display: grid;
  grid-template-rows: repeat(7, 1fr);
  gap: 8px;
  height: 180px;
  font-size: 0.7rem;
  color: #64748b;
  text-align: right;
  padding-right: 8px;
  padding-top: 2px;
}

.simple-axis-y span {
  display: block;
  line-height: 1;
}

/* Área de barras */
.simple-bars-area {
  position: relative;
  display: flex;
  gap: 12px;
  align-items: flex-end;
  justify-content: flex-start;
  height: 180px;
  padding: 0 8px;
  overflow-x: auto;
  overflow-y: visible;
  background: repeating-linear-gradient(
    to top,
    #e2e8f0 0px,
    #e2e8f0 1px,
    transparent 1px,
    transparent calc((180px / 6))
  );
}

/* SVG para las líneas */
.simple-line-svg {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2;
}

/* Grupo de barras */
.simple-bar-group {
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  justify-content: center;
  position: relative;
  min-width: 32px;
  height: 100%;
}

/* Barra individual */
.simple-bar {
  width: 40px;
  min-height: 2px;
  border-radius: 4px 4px 2px 2px;
  margin: 0 4px 0 4px;
  transition: height 0.2s;
  border: none;
}

.simple-bar:hover {
  opacity: 0.8;
}

.simple-bar-total {
  background: #1e3a8a;
}

.simple-bar-oportuno {
  background: #60a5fa;
  margin-top: 2px;
}

/* Etiquetas de barras */
.simple-bar-label {
  font-size: 0.7rem;
  color: #64748b;
  margin-top: 6px;
  white-space: nowrap;
  text-align: center;
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
}

/* Leyenda inferior */
.simple-legend-bottom {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
  margin-top: 60px;
  font-size: 0.75rem;
  color: #475569;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-color {
  width: 20px;
  height: 12px;
  border-radius: 2px;
  display: inline-block;
}

.legend-bar {
  height: 14px;
  border-radius: 3px;
}
</style>


