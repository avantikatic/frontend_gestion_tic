<template>
  <main class="indicators-module">
    <!-- Cabecera del módulo (título y selector) -->
    <header class="module-header">
      <div>
        <p class="breadcrumb">Gestión TIC / Indicadores</p>
        <h1>{{ selectedView === 'informe' ? 'Informe de Gestión' : currentIndicator.name }}</h1>
      </div>

      <div class="indicator-selector">
        <label for="viewSelect">Indicador</label>
        <select id="viewSelect" v-model="selectedView">
          <option value="module">Automatización de actividades de macroprocesos</option>
          <option value="informe">Informe de Gestión</option>
        </select>
      </div>
    </header>

    <!-- Mostrar componente Indicators cuando se selecciona 'Informe de Gestión' -->
    <Indicators v-if="selectedView === 'informe'" />

    <!-- Contenido del módulo de indicadores -->
    <template v-else>
    <!-- Filtro por mes -->
    <section class="filters-row">
      <div class="filters-row__group">
        <label for="monthFilter">Mes</label>
        <select
          id="monthFilter"
          v-model="monthFilter"
        >
          <option value="Todos">Todos</option>
          <option
            v-for="m in allMonths"
            :key="m"
            :value="m"
          >
            {{ m }}
          </option>
        </select>
      </div>

      <button
        type="button"
        class="btn-ghost-small"
        @click="resetFilters"
      >
        Limpiar filtros
      </button>
    </section>

    <!-- ============ INDICATOR HEADER (antes IndicatorHeader.vue) ============ -->
    <section class="indicator-header">
      <header class="indicator-header__title">
        <h1>{{ indicatorInfo.name }}</h1>
        <span class="indicator-header__badge">{{ indicatorInfo.type }}</span>
      </header>

      <div class="indicator-header__grid">
        <div class="indicator-header__item indicator-header__item--formula">
          <span class="label">
            Fórmula
            <span
              class="info-icon"
              :title="indicatorInfo.formulaFull || indicatorInfo.formulaShort"
            >i</span>
          </span>
          <p class="value">
            {{ indicatorInfo.formulaShort }}
          </p>
        </div>

        <div class="indicator-header__item">
          <span class="label">Meta (Estado adecuado)</span>
          <p class="value-pill value-pill--good">
            {{ indicatorInfo.meta }}%
          </p>
        </div>

        <div class="indicator-header__item">
          <span class="label">Estado aceptable</span>
          <p class="value-pill value-pill--warning">
            {{ indicatorInfo.acceptableRange }}
          </p>
        </div>

        <div class="indicator-header__item">
          <span class="label">Estado inaceptable</span>
          <p class="value-pill value-pill--bad">
            {{ indicatorInfo.unacceptableText }}
          </p>
        </div>

        <div class="indicator-header__item">
          <span class="label">Frecuencia de seguimiento</span>
          <p class="value">{{ indicatorInfo.frequency }}</p>
        </div>

        <div class="indicator-header__item">
          <span class="label">Responsable del indicador</span>
          <p class="value">{{ indicatorInfo.owner }}</p>
        </div>

        <div class="indicator-header__item indicator-header__item--status">
          <span class="label">Estado actual del indicador</span>
          <p :class="['status-pill', indicatorInfo.currentStatusClass]">
            {{ indicatorInfo.currentStatusLabel }} · {{ indicatorInfo.currentValue }}%
          </p>
        </div>
      </div>
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
                  <td>{{ row.meta }}%</td>
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
                  <td>{{ totals.meta }}%</td>
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

            <button class="btn-primary" type="button" @click="openCreateModal">
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
                      Editar
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
        
        <!-- ============ INDICATOR CHART (antes IndicatorChart.vue) ============ -->
        <section class="indicator-chart">
          <header class="indicator-chart__header">
            <h2>% Automatización por mes</h2>
            <p class="subtitle">
              Cumplimiento mensual frente a la meta del {{ currentIndicator.meta }}%.
            </p>
          </header>

          <div class="indicator-chart__body">
            <div class="axis-y">
              <span v-for="tick in yTicks" :key="tick">{{ tick }}%</span>
            </div>

            <div class="chart-area">
              <div
                class="goal-line"
                :style="{ bottom: goalPosition + '%' }"
              ></div>

              <div
                v-for="point in chartPoints"
                :key="point.label"
                class="bar-group"
              >
                <div
                  class="bar"
                  :style="{ height: point.automation + '%' }"
                  :title="`${point.label}: ${point.automation}%`"
                ></div>

                <div
                  class="line-point"
                  :style="{ bottom: point.accumulated + '%' }"
                  :title="`${point.label} - Acumulado: ${point.accumulated}%`"
                ></div>

                <span class="bar-label">{{ point.shortLabel }}</span>
              </div>

              <svg class="line-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                <polyline
                  :points="polylinePoints"
                  fill="none"
                  stroke-width="1.2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
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

        <!-- ============ INDICATOR TICKETS LIST (antes IndicatorTicketsList.vue) ============ -->
        <section class="tickets-card">
          <header class="tickets-card__header">
            <h2>Tickets del periodo</h2>
            <p class="subtitle">
              {{ ticketsHeaderText }}
            </p>
          </header>

          <div v-if="monthFilter === 'Todos' || filteredTickets.length === 0" class="empty-state">
            <p v-if="monthFilter === 'Todos'">
              Selecciona un mes en el filtro para ver el detalle de los tickets.
            </p>
            <p v-else>
              No se registran tickets asociados al indicador en {{ monthFilter }}.
            </p>
          </div>

          <template v-else>
            <!-- Mini-status -->
            <div class="summary-row">
              <div class="summary-pill">
                <span class="label">Total tickets</span>
                <span class="value">{{ ticketsStats.total }}</span>
              </div>
              <div class="summary-pill summary-pill--good">
                <span class="label">Cerrados</span>
                <span class="value">{{ ticketsStats.closed }}</span>
              </div>
              <div class="summary-pill summary-pill--warning">
                <span class="label">En progreso</span>
                <span class="value">{{ ticketsStats.inProgress }}</span>
              </div>
              <div class="summary-pill summary-pill--bad">
                <span class="label">Abiertos</span>
                <span class="value">{{ ticketsStats.open }}</span>
              </div>
            </div>

            <!-- Tabla de tickets -->
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Ticket</th>
                    <th>Estado</th>
                    <th>Responsable</th>
                    <th>Solicitante</th>
                    <th>Macroproceso</th>
                    <th>Tipo</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="t in filteredTickets" :key="t.id">
                    <td class="ticket-id">#{{ t.id }}</td>
                    <td>
                      <span :class="['status-chip', statusChipClass(t.status)]">
                        {{ t.status }}
                      </span>
                    </td>
                    <td>{{ t.assignee }}</td>
                    <td>{{ t.requester }}</td>
                    <td>{{ t.macroprocess }}</td>
                    <td>{{ t.category }}</td>
                    <td>{{ t.date }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </section>

      </div>
    </section>
    </template>
  </main>
</template>

<script setup>
import { computed, ref, reactive } from 'vue'
import Indicators from './Indicators.vue'

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
    results: [
      {
        month: 'Enero',
        projects: 1,
        acpm: 0,
        reports: 0,
        totalSupports: 1,
        supportsOnTime: 1,
        supportsLate: 0,
        supportsOpen: 0,
        pctAutomation: 100,
        pctAccumulated: 100,
        meta: 90,
        pctExecutionTickets: 100,
        supportsEntered: 1,
        supportsPending: 0
      },
      {
        month: 'Febrero',
        projects: 7,
        acpm: 0,
        reports: 0,
        totalSupports: 7,
        supportsOnTime: 7,
        supportsLate: 0,
        supportsOpen: 0,
        pctAutomation: 100,
        pctAccumulated: 100,
        meta: 90,
        pctExecutionTickets: 100,
        supportsEntered: 6,
        supportsPending: 0
      },
      {
        month: 'Marzo',
        projects: 1,
        acpm: 1,
        reports: 0,
        totalSupports: 2,
        supportsOnTime: 2,
        supportsLate: 0,
        supportsOpen: 0,
        pctAutomation: 100,
        pctAccumulated: 100,
        meta: 90,
        pctExecutionTickets: 100,
        supportsEntered: 3,
        supportsPending: 0
      },
      {
        month: 'Abril',
        projects: 2,
        acpm: 0,
        reports: 0,
        totalSupports: 2,
        supportsOnTime: 2,
        supportsLate: 0,
        supportsOpen: 0,
        pctAutomation: 100,
        pctAccumulated: 100,
        meta: 90,
        pctExecutionTickets: 100,
        supportsEntered: 2,
        supportsPending: 0
      },
      {
        month: 'Mayo',
        projects: 2,
        acpm: 0,
        reports: 0,
        totalSupports: 2,
        supportsOnTime: 2,
        supportsLate: 0,
        supportsOpen: 0,
        pctAutomation: 100,
        pctAccumulated: 100,
        meta: 90,
        pctExecutionTickets: 100,
        supportsEntered: 2,
        supportsPending: 0
      },
      {
        month: 'Junio',
        projects: 6,
        acpm: 0,
        reports: 0,
        totalSupports: 6,
        supportsOnTime: 5,
        supportsLate: 1,
        supportsOpen: 0,
        pctAutomation: 83,
        pctAccumulated: 95,
        meta: 90,
        pctExecutionTickets: 100,
        supportsEntered: 6,
        supportsPending: 0
      },
      {
        month: 'Julio',
        projects: 3,
        acpm: 1,
        reports: 0,
        totalSupports: 4,
        supportsOnTime: 4,
        supportsLate: 0,
        supportsOpen: 0,
        pctAutomation: 100,
        pctAccumulated: 96,
        meta: 90,
        pctExecutionTickets: 100,
        supportsEntered: 4,
        supportsPending: 0
      },
      {
        month: 'Agosto',
        projects: 3,
        acpm: 3,
        reports: 0,
        totalSupports: 6,
        supportsOnTime: 5,
        supportsLate: 1,
        supportsOpen: 0,
        pctAutomation: 83,
        pctAccumulated: 93,
        meta: 90,
        pctExecutionTickets: 100,
        supportsEntered: 7,
        supportsPending: 0
      },
      {
        month: 'Septiembre',
        projects: 2,
        acpm: 1,
        reports: 0,
        totalSupports: 3,
        supportsOnTime: 3,
        supportsLate: 0,
        supportsOpen: 0,
        pctAutomation: 100,
        pctAccumulated: 94,
        meta: 90,
        pctExecutionTickets: 100,
        supportsEntered: 4,
        supportsPending: 0
      },
      {
        month: 'Octubre',
        projects: 2,
        acpm: 3,
        reports: 0,
        totalSupports: 5,
        supportsOnTime: 5,
        supportsLate: 0,
        supportsOpen: 0,
        pctAutomation: 100,
        pctAccumulated: 95,
        meta: 90,
        pctExecutionTickets: 100,
        supportsEntered: 5,
        supportsPending: 0
      },
      {
        month: 'Noviembre',
        projects: 2,
        acpm: 2,
        reports: 0,
        totalSupports: 4,
        supportsOnTime: 2,
        supportsLate: 0,
        supportsOpen: 2,
        pctAutomation: 50,
        pctAccumulated: 90,
        meta: 90,
        pctExecutionTickets: 50,
        supportsEntered: 4,
        supportsPending: 0
      },
      {
        month: 'Diciembre',
        projects: 0,
        acpm: 0,
        reports: 0,
        totalSupports: 0,
        supportsOnTime: 0,
        supportsLate: 0,
        supportsOpen: 0,
        pctAutomation: 0,
        pctAccumulated: 90,
        meta: 90,
        pctExecutionTickets: 0,
        supportsEntered: 0,
        supportsPending: 0
      }
    ],
    // Tickets de ejemplo (aquí luego iría lo que traigas de tu backend)
    tickets: [
      {
        id: 1023,
        month: 'Mayo',
        status: 'Cerrado',
        assignee: 'Jeyson Martínez',
        requester: 'Coordinación Ventas',
        macroprocess: 'Macroproceso Comercial',
        category: 'Proyecto',
        date: '08/05/2025'
      },
      {
        id: 1031,
        month: 'Mayo',
        status: 'Cerrado',
        assignee: 'Víctor Nieto',
        requester: 'Coordinación Logística',
        macroprocess: 'Macroproceso Cadena de Suministro',
        category: 'ACPM',
        date: '15/05/2025'
      },
      {
        id: 980,
        month: 'Junio',
        status: 'Cerrado',
        assignee: 'Heyder Martínez',
        requester: 'Coordinación Finanzas',
        macroprocess: 'Macroproceso Financiero',
        category: 'Proyecto',
        date: '03/06/2025'
      },
      {
        id: 981,
        month: 'Junio',
        status: 'En progreso',
        assignee: 'Jeyson Martínez',
        requester: 'Dirección General',
        macroprocess: 'Macroproceso Estratégico',
        category: 'Informe de gestión',
        date: '10/06/2025'
      },
      {
        id: 990,
        month: 'Noviembre',
        status: 'Abierto',
        assignee: 'Víctor Nieto',
        requester: 'Coordinación Operaciones',
        macroprocess: 'Macroproceso Operativo',
        category: 'Proyecto',
        date: '05/11/2025'
      }
    ],
    analysis: [
      {
        month: 'Enero',
        analysis:
          'Durante el mes de Enero el indicador se cumplió al 100% sin presentar desviaciones.',
        actions:
          'Mantener las acciones implementadas y continuar con el seguimiento mensual del indicador.',
        responsible: 'Jeyson Martínez – Coordinador TIC',
        commitmentDate: '2025-04-29',
        followUp:
          'Revisión mensual del resultado del indicador y verificación del cumplimiento de las actividades programadas.'
      },
      {
        month: 'Febrero',
        analysis:
          'En Febrero el indicador se mantuvo en 100%, confirmando la efectividad de las acciones del periodo anterior.',
        actions:
          'Conservar los controles actuales y documentar buenas prácticas identificadas durante el mes.',
        responsible: 'Jeyson Martínez – Coordinador TIC',
        commitmentDate: '2025-04-29',
        followUp:
          'Seguimiento mensual y registro de posibles riesgos que puedan afectar la oportunidad de cierre de los support.'
      },
      {
        month: 'Junio',
        analysis:
          'En Junio el indicador descendió a 83%, debido a una dependencia de información externa asignada a otra área.',
        actions:
          '1) Coordinar con mayor anticipación actividades que involucren a otras áreas. 2) Definir plazos de entrega de información y responsables claros. 3) Establecer recordatorios automáticos para actividades críticas.',
        responsible: 'Jeyson Martínez – Coordinador TIC',
        commitmentDate: '2025-07-30',
        followUp:
          'Revisar mensualmente los casos con desviación y validar si se cumplieron los plazos comprometidos posteriores al plan de acción.'
      }
    ]
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

/* Guardar/actualizar análisis desde el modal */
const handleSaveAnalysis = (payload) => {
  const {
    indicatorId,
    month,
    analysisText,
    actions,
    responsible,
    commitmentDate,
    followUp
  } = payload

  const indicator = indicators.value.find((i) => i.id === indicatorId)
  if (!indicator) return

  const idx = indicator.analysis.findIndex((a) => a.month === month)
  const newEntry = {
    month,
    analysis: analysisText,
    actions,
    responsible,
    commitmentDate,
    followUp
  }

  if (idx === -1) indicator.analysis.push(newEntry)
  else indicator.analysis[idx] = newEntry
}

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

/* Para el gráfico de barras */
const chartPoints = computed(() =>
  filteredResults.value.map((row) => ({
    label: row.month,
    shortLabel: row.month.slice(0, 3),
    automation: row.pctAutomation,
    accumulated: row.pctAccumulated
  }))
)

const goalPosition = computed(() => {
  const value = currentIndicator.value.meta
  return Math.max(0, Math.min(100, value))
})

const yTicks = [100, 80, 60, 40, 20, 0]

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
</script>

<style scoped>
/* ============ ESTILOS DEL MÓDULO PRINCIPAL ============ */
.indicators-module {
  width: 100%;
  margin: 0;
  padding: 18px 32px 30px;
  box-sizing: border-box;
}

.module-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 12px;
}

.breadcrumb {
  margin: 0 0 4px 0;
  font-size: 0.78rem;
  color: var(--gtic-text-muted);
}

.module-header h1 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--gtic-text-main);
}

.selectors-group {
  display: flex;
  gap: 16px;
  align-items: flex-end;
}

.indicator-selector {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.indicator-selector label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--gtic-text-muted);
}

.indicator-selector select {
  min-width: 260px;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid var(--gtic-accent);
  background: var(--gtic-surface);
  font-size: 0.85rem;
  color: var(--gtic-text-main);
  outline: none;
}

.indicator-selector select:focus {
  border-color: var(--gtic-secondary);
  box-shadow: 0 0 0 1px rgba(122, 199, 137, 0.35);
}

/* Filtros */
.filters-row {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  margin-bottom: 14px;
}

.filters-row__group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.filters-row__group label {
  font-size: 0.74rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--gtic-text-muted);
}

.filters-row__group select {
  min-width: 150px;
  padding: 6px 8px;
  border-radius: 8px;
  border: 1px solid var(--gtic-accent);
  background: var(--gtic-surface);
  font-size: 0.82rem;
  color: var(--gtic-text-main);
}

.btn-ghost-small {
  border: 1px solid var(--gtic-accent);
  background: #ffffff;
  color: var(--gtic-text-main);
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.78rem;
  cursor: pointer;
}

.btn-ghost-small:hover {
  background: #f3f4f6;
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

/* ============ ESTILOS DE INDICATOR HEADER ============ */
.indicator-header {
  background: var(--gtic-surface);
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
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--gtic-primary);
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
  background: var(--gtic-surface);
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
  background: var(--gtic-primary);
  color: black;
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

/* Botones */
.btn-primary {
  border: none;
  background: var(--gtic-primary);
  color: #ffffff;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 0.8rem;
  cursor: pointer;
}

.btn-primary:hover {
  background: #1c2d41;
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
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 40;
}

.modal {
  width: 100%;
  max-width: 720px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.35);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #e5e7eb;
}

.modal__header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--gtic-text-main);
}

.modal__close {
  border: none;
  background: none;
  font-size: 1.3rem;
  cursor: pointer;
  color: var(--gtic-text-muted);
}

.modal__body {
  padding: 16px 18px;
  overflow-y: auto;
}

.modal__footer {
  padding: 12px 18px 14px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
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
  padding-right: 4px;
}

.chart-area {
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 200px;
  padding: 4px 4px 18px;
  border-radius: 8px;
  background: linear-gradient(
    to top,
    #f8fafc 0%,
    #f8fafc 50%,
    #ffffff 100%
  );
  border: 1px solid #e2e6ea;
  overflow: hidden;
}

.goal-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 0;
  border-top: 1.5px dashed #f97316;
}

.bar-group {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.bar {
  width: 60%;
  border-radius: 6px 6px 2px 2px;
  background: linear-gradient(
    180deg,
    var(--gtic-secondary),
    var(--gtic-primary)
  );
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.bar:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.35);
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
</style>
