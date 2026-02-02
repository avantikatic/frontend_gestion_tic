<template>
  <div class="indicators">
    <div v-if="cargando" class="loading">
      Cargando indicadores...
    </div>

    <div v-else>
    <!-- Sección 1: Información del Indicador -->
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
            <td class="indicator-name">
              Cumplimiento en la ejecución de actividades de incidentes de soporte
              (Desarrollos, Hardware, Software, Requisición de compra)
            </td>
            <td>Gestión</td>
            <td class="formula">
              (#Actividades de incidentes de soporte ejecutadas oportunamente/#Actividades de
              incidentes de soporte a cumplir)*100
            </td>
            <td class="meta-adecuado">{{ porcentajeMetaDisplay }}</td>
            <td class="estado-aceptable">84%-70%</td>
            <td class="estado-inaceptable">< 70%</td>
            <td>Semanal</td>
            <td>Coordinador TIC</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- Sección 2: Resultados y Gráfica (gráfica debajo de la tabla) -->
      <div class="indicadores-grid">
        <div class="indicadores-col-table">
          <div class="results-table-wrapper">
            <h2>2. RESULTADOS</h2>
            <table class="results-table">
              <thead>
                <tr>
                  <th rowspan="2">MES</th>
                  <th rowspan="2">Nº total de Tickets a vencer en el mes</th>
                  <th rowspan="2">Nº de Tickets cerradas oportunamente</th>
                  <th rowspan="2">Nº de Tickets cerradas fuera de tiempo</th>
                  <th rowspan="2">Nº de Total de Tickets a vencer sin registrar en el mes</th>
                  <th rowspan="2">Índice de cumplimiento en la gestión oportuna</th>
                  <th rowspan="2">% Acumulado año</th>
                  <th rowspan="2">Meta</th>
                  <th rowspan="2">Nº total de Tickets que ingresaron en el mes</th>
                  <th rowspan="2">Nº Tickets abiertos pendientes del mes</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="mes in mesesFiltrados" :key="mes.nombre">
                  <td class="mes-name">{{ mes.nombre }}</td>
                  <td>{{ mes.totalVencer }}</td>
                  <td>{{ mes.cerradasOportunamente }}</td>
                  <td>{{ mes.cerradasFueraTiempo }}</td>
                  <td>{{ mes.sinRegistrar }}</td>
                  <td :class="getIndicadorClass(mes.indiceCumplimiento)">
                    {{ mes.indiceCumplimiento }}
                  </td>
                  <td>{{ mes.acumuladoAnio }}</td>
                  <td>{{ porcentajeMetaDisplay }}</td>
                  <td>{{ mes.totalIngresaron }}</td>
                  <td>{{ mes.ticketsAbiertos }}</td>
                  <td class="observaciones-cell">
                    <button @click="abrirModalObservaciones(mes)" class="btn-observaciones">
                      📝
                    </button>
                  </td>
                </tr>
                <tr class="total-row">
                  <td class="mes-name"><strong>TOTAL</strong></td>
                  <td><strong>{{ totales.totalVencer }}</strong></td>
                  <td><strong>{{ totales.cerradasOportunamente }}</strong></td>
                  <td><strong>{{ totales.cerradasFueraTiempo }}</strong></td>
                  <td><strong>{{ totales.sinRegistrar }}</strong></td>
                  <td :class="getIndicadorClass(totales.indiceCumplimiento)">
                    <strong>{{ totales.indiceCumplimiento }}</strong>
                  </td>
                  <td><strong>{{ totales.acumuladoAnio }}</strong></td>
                  <td><strong>{{ porcentajeMetaDisplay }}</strong></td>
                  <td></td>
                  <td><strong>{{ totales.ticketsAbiertos }}</strong></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- Tabla de análisis de causas y acciones - Aprovechando el espacio -->
          <div style="margin-top: 24px;">
            <table class="analisis-causas-table">
              <caption class="analisis-caption">
              <div class="analisis-caption-content">
                <div>
                  Análisis de causas y acciones
                  <div class="analisis-subtitle">Registro mensual de causas principales, acciones correctivas y seguimiento.</div>
                </div>
                <button type="button" class="btn-agregar-analisis" @click="abrirModalAnalisis(null)">+ Agregar análisis</button>
              </div>
              </caption>
              <thead>
                <tr class="analisis-header-row">
                  <th rowspan="2" class="analisis-th analisis-th-mes">MES</th>
                  <th class="analisis-th analisis-th-analisis">
                    <div class="analisis-th-title">
                      ANÁLISIS (CAUSAS PRINCIPALES)
                      <span
                        class="info-icon"
                        title="Para llegar a las causas principales:&#10;• Identifique dónde se generan las desviaciones y su pareto.&#10;• Filtre las causas con lluvia de ideas y análisis causa y efecto-7M&#10;• Reduzca las causas a máximo 3 que se encuentren validadas (apoye en la técnica 5 por qué)"
                      >i</span>
                    </div>
                  </th>
                  <th class="analisis-th analisis-th-acciones">
                    <div class="analisis-th-title">
                      ACCIONES A TOMAR FRENTE AL ANÁLISIS
                      <span
                        class="info-icon"
                        title="Liste las acciones con las que se van a eliminar/controlar las causas identificadas.&#10;Puede relacionar alguna ACPM que se encuentre trabajando."
                      >i</span>
                    </div>
                  </th>
                  <th class="analisis-th analisis-th-responsable">
                    <div class="analisis-th-title">
                      RESPONSABLE (NOMBRE-CARGO)
                      <span
                        class="info-icon"
                        title="Relacione el nombre y cargo del responsable de llevar a cabo las acciones definidas"
                      >i</span>
                    </div>
                  </th>
                  <th class="analisis-th analisis-th-fecha">
                    <div class="analisis-th-title">
                      FECHA DE COMPROMISO
                      <span
                        class="info-icon"
                        title="Indique la fecha (DD/MM/AAAA) en que la acción quedará ejecutada"
                      >i</span>
                    </div>
                  </th>
                  <th class="analisis-th analisis-th-seguimiento">
                    <div class="analisis-th-title">
                      SEGUIMIENTO
                      <span
                        class="info-icon"
                        title="Relacione el estado de cumplimiento de las acciones definidas"
                      >i</span>
                    </div>
                  </th>
                  <th rowspan="2" class="analisis-th analisis-th-actions">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="analisisFiltrados.length === 0">
                  <td colspan="7" class="analisis-empty-message">
                    No hay análisis registrados para este periodo.
                  </td>
                </tr>
                <tr v-for="(item, index) in analisisFiltrados" :key="index">
                  <td class="analisis-td analisis-td-mes">{{ item.mes }}</td>
                  <td class="analisis-td">{{ item.analisis }}</td>
                  <td class="analisis-td">{{ item.acciones }}</td>
                  <td class="analisis-td">{{ item.responsable }}</td>
                  <td class="analisis-td analisis-td-fecha">{{ item.fecha_compromiso }}</td>
                  <td class="analisis-td">{{ item.seguimiento }}</td>
                  <td class="analisis-td analisis-td-actions">
                    <button class="btn-editar-analisis" @click="abrirModalAnalisis(item)" title="Editar análisis">
                      ✏️
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="indicadores-col-graficas">
          <section class="simple-bar-chart-outer">
            <div class="simple-bar-chart-scroll">
              <section class="simple-bar-chart compact">
                <header class="simple-bar-chart__header">
                  <h2>3. Gráfica</h2>
                  <!-- <p class="subtitle">Comparación de tickets totales vs. tickets cerrados oportunamente</p> -->
                </header>
                <div class="simple-bar-chart__body">
                  <div class="simple-axis-y">
                    <span v-for="tick in [120, 100, 80, 60, 40, 20, 0]" :key="tick">{{ tick }}</span>
                  </div>
                  <div class="simple-bars-area">
                    <svg class="simple-line-svg" viewBox="0 0 100 180" preserveAspectRatio="none" v-if="!mesSeleccionadoFiltro">
                      <polyline :points="linePointsAcumulado" fill="none" stroke="#374151" stroke-width="0.3" stroke-linecap="round" stroke-linejoin="round" />
                      <polyline :points="linePoints" fill="none" stroke="#2563eb" stroke-width="0.3" stroke-linecap="round" stroke-linejoin="round" />
                      <polyline :points="linePointsMeta" fill="none" stroke="#004d0d" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    <div v-for="mes in mesesFiltrados" :key="mes.mes_numero" class="simple-bar-group">
                      <div
                        class="simple-bar simple-bar-total"
                        :style="{ height: (mes.totalVencer / 120 * 100) + '%', width: '28px' }"
                        :title="`${mes.nombre}: Total ${mes.totalVencer} tickets`"
                      ></div>
                      <div
                        class="simple-bar simple-bar-oportuno"
                        :style="{ height: (mes.cerradasOportunamente / 120 * 100) + '%', width: '28px' }"
                        :title="`${mes.nombre}: ${mes.cerradasOportunamente} oportunos`"
                      ></div>
                        <span class="simple-bar-label">{{ mes.nombre.slice(0, 3) }}</span>
                    </div>
                  </div>
                </div>
                <div class="simple-legend simple-legend-bottom">
                  <div class="legend-item"><span class="legend-color legend-blue"></span> Índice de cumplimiento</div>
                  <div class="legend-item"><span class="legend-color legend-gray"></span> % Acumulado año</div>
                  <div class="legend-item"><span class="legend-color legend-green"></span> Meta</div>
                  <div class="legend-item"><span class="legend-bar legend-bar-total"></span> Total tickets a vencer</div>
                  <div class="legend-item"><span class="legend-bar legend-bar-oportuno"></span> Tickets cerrados oportunamente</div>
                </div>
              </section>
            </div>
          </section>

          <section class="indicador-torta-card">
            <h3>Estado global del indicador</h3>
            <p class="indicador-torta-desc">Promedio de cumplimiento del periodo filtrado.</p>
            <div class="indicador-torta-flex">
              <svg viewBox="0 0 120 120" width="110" height="110" class="indicador-torta-svg">
                <circle cx="60" cy="60" r="54" fill="#f4f8fc" stroke="#e5e7eb" stroke-width="15" />
                <circle
                  cx="60" cy="60" r="54"
                  fill="none"
                  :stroke="getEstadoColor(totales.indiceCumplimiento)"
                  stroke-width="8"
                  :stroke-dasharray="circumferencia"
                  :stroke-dashoffset="circumferencia - (circumferencia * cumplimientoGlobal / 100)"
                  stroke-linecap="round"
                  transform="rotate(-90 60 60)"
                />
                <text x="60" y="66" text-anchor="middle" font-size="28" font-weight="bold" fill="#22396a">{{ cumplimientoGlobal }}%</text>
                <text x="60" y="86" text-anchor="middle" font-size="12" fill="#22396a">cumplimiento</text>
              </svg>
              <div class="indicador-torta-estado">
                <span class="indicador-torta-estado-badge" :class="getEstadoClass(totales.indiceCumplimiento)">
                  {{ getEstadoTexto(totales.indiceCumplimiento) }}
                </span>
                <ul class="indicador-torta-leyenda">
                  <li><span class="indicador-torta-dot adecuado"></span> Adecuado (≥ 85%)</li>
                  <li><span class="indicador-torta-dot aceptable"></span> Aceptable (70% - 84%)</li>
                  <li><span class="indicador-torta-dot inaceptable"></span> Inaceptable (&lt; 70%)</li>
                </ul>
              </div>
            </div>
          </section>

          <!-- Nueva Card: Tickets del periodo -->
          <section class="tickets-periodo-card">
            <h3>Tickets del periodo</h3>
            <p class="tickets-periodo-desc">Detalle de tickets asociados al indicador por mes.</p>
            
            <div v-if="cargandoTickets" class="loading-tickets">
              Cargando tickets...
            </div>

            <div v-else-if="!mesSeleccionadoFiltro" class="tickets-periodo-empty">
              <p>Selecciona un mes en el filtro para ver el detalle de los tickets.</p>
            </div>

            <div v-else-if="ticketsPeriodo.length === 0" class="tickets-periodo-empty">
              <p>No hay tickets de gestión registrados para este mes.</p>
            </div>

            <div v-else class="tickets-list-container">
              <div class="tickets-summary-cards">
                <div class="summary-card card-total">
                  <span class="card-label">TOTAL TICKETS</span>
                  <span class="card-value">{{ resumenTicketsPeriodo.total }}</span>
                </div>
                <div class="summary-card card-cerrados">
                  <span class="card-label">CERRADOS</span>
                  <span class="card-value">{{ resumenTicketsPeriodo.cerrados }}</span>
                </div>
                <div class="summary-card card-progreso">
                  <span class="card-label">EN PROGRESO</span>
                  <span class="card-value">{{ resumenTicketsPeriodo.en_progreso }}</span>
                </div>
                <div class="summary-card card-abiertos">
                  <span class="card-label">ABIERTOS</span>
                  <span class="card-value">{{ resumenTicketsPeriodo.abiertos }}</span>
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
      </div>
    </div>

    <!-- Modal de Observaciones -->
    <div v-if="modalObservaciones" class="modal-overlay" @click="cerrarModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Observaciones - {{ mesSeleccionado?.nombre }} {{ anioActual }}</h3>
          <button @click="cerrarModal" class="btn-close">✕</button>
        </div>
        <div class="modal-body">
          <textarea
            v-model="observacionTexto"
            placeholder="Escribe las observaciones del mes..."
            rows="6"
          ></textarea>
        </div>
        <div class="modal-footer">
          <button @click="cerrarModal" class="btn-cancelar">Cancelar</button>
          <button @click="guardarObservacion" class="btn-guardar" :disabled="guardando">
            {{ guardando ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Análisis de Causas y Acciones -->
    <div v-if="modalAnalisis" class="modal-overlay" @click="cerrarModalAnalisis">
      <div class="modal-content modal-content-wide" @click.stop>
        <div class="modal-header">
          <h3>{{ analisisEditando ? 'Editar' : 'Agregar' }} Análisis de Causas y Acciones</h3>
          <button @click="cerrarModalAnalisis" class="btn-close">✕</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="guardarAnalisis" class="form-analisis">
            <div class="form-row">
              <div class="form-group">
                <label for="mes-analisis">Mes *</label>
                <select 
                  id="mes-analisis" 
                  v-model="formAnalisis.mes" 
                  required
                  :disabled="analisisEditando"
                  class="form-select"
                >
                  <option value="">Seleccione un mes</option>
                  <option v-for="mes in listaMeses" :key="mes.numero" :value="mes.numero">
                    {{ mes.nombre }}
                  </option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label for="analisis">Análisis (Causas Principales) *</label>
              <textarea 
                id="analisis"
                v-model="formAnalisis.analisis" 
                placeholder="Identifique dónde se generan las desviaciones y su pareto..."
                rows="4"
                required
                class="form-textarea"
              ></textarea>
            </div>

            <div class="form-group">
              <label for="acciones">Acciones a Tomar Frente al Análisis *</label>
              <textarea 
                id="acciones"
                v-model="formAnalisis.acciones" 
                placeholder="Liste las acciones con las que se van a eliminar/controlar las causas..."
                rows="4"
                required
                class="form-textarea"
              ></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="responsable">Responsable (Nombre-Cargo) *</label>
                <input 
                  type="text"
                  id="responsable"
                  v-model="formAnalisis.responsable" 
                  placeholder="Ej: Juan Pérez - Coordinador TIC"
                  required
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label for="fecha-compromiso">Fecha de Compromiso *</label>
                <input 
                  type="date"
                  id="fecha-compromiso"
                  v-model="formAnalisis.fecha_compromiso" 
                  required
                  class="form-input"
                />
              </div>
            </div>

            <div class="form-group">
              <label for="seguimiento">Seguimiento *</label>
              <textarea 
                id="seguimiento"
                v-model="formAnalisis.seguimiento" 
                placeholder="Relacione el estado de cumplimiento de las acciones definidas..."
                rows="3"
                required
                class="form-textarea"
              ></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button @click="cerrarModalAnalisis" class="btn-cancelar">Cancelar</button>
          <button @click="guardarAnalisis" class="btn-guardar" :disabled="guardandoAnalisis">
            {{ guardandoAnalisis ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal para crear año -->
    <div v-if="mostrarModalAnio" class="modal-overlay" @click.self="cerrarModalAnio">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Crear Nuevo Año</h3>
          <button @click="cerrarModalAnio" class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="guardarNuevoAnio" class="form-analisis">
            <div class="form-group">
              <label for="nuevo-anio">Año *</label>
              <input 
                type="number"
                id="nuevo-anio"
                v-model="nuevoAnio.anio" 
                placeholder="Ej: 2024"
                required
                min="1900"
                max="2100"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="descripcion-anio">Descripción (Opcional)</label>
              <input 
                type="text"
                id="descripcion-anio"
                v-model="nuevoAnio.descripcion" 
                placeholder="Ej: Año fiscal 2024"
                class="form-input"
              />
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button @click="cerrarModalAnio" class="btn-cancelar">Cancelar</button>
          <button @click="guardarNuevoAnio" class="btn-guardar" :disabled="guardandoAnio">
            {{ guardandoAnio ? 'Creando...' : 'Crear Año' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'
import apiUrl from "../../config.js"

// Props recibidos del componente padre
const props = defineProps({
  anioProp: {
    type: Number,
    default: null
  },
  mesProp: {
    type: [String, Number],
    default: ''
  }
})

// Emits para comunicar con el componente padre
const emit = defineEmits(['update:loading', 'update:anios'])

// Año actual o seleccionado
const anioActual = ref(props.anioProp)
const mesSeleccionadoFiltro = ref(props.mesProp)
const cargando = ref(false)
const datosIndicadores = ref(null)

// Watch para sincronizar props con el estado interno
watch(() => props.anioProp, (newVal) => {
  if (newVal) anioActual.value = newVal
})

watch(() => props.mesProp, (newVal) => {
  mesSeleccionadoFiltro.value = newVal
})

// Watch para emitir el estado de carga
watch(cargando, (newVal) => {
  emit('update:loading', newVal)
})

// Variables para gestión dinámica de años
const aniosDisponibles = ref([])
const mostrarModalAnio = ref(false)
const nuevoAnio = ref({
  anio: null,
  descripcion: ''
})
const guardandoAnio = ref(false)

// Estado para tickets del periodo
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

// Datos de ejemplo (se sobrescribirán con datos reales)
const meses = ref([])

// Función para abrir el modal de observaciones
const abrirModalObservaciones = async (mes) => {
  mesSeleccionado.value = mes
  observacionTexto.value = ''

  try {
    const response = await axios.post(
      `${apiUrl}/indicadores/obtener_observacion_mes`,
      {
        anio: anioActual.value,
        mes: mes.mes_numero
      },
      {
        headers: {
          Accept: "application/json",
        }
      }
    )

    if (response.status === 200 && response.data.data) {
      observacionTexto.value = response.data.data.observaciones || ''
    }
  } catch (error) {
    console.error('Error cargando observación:', error)
  }

  modalObservaciones.value = true
}

// Función para cerrar el modal
const cerrarModal = () => {
  modalObservaciones.value = false
  mesSeleccionado.value = null
  observacionTexto.value = ''
}

// Función para guardar la observación
const guardarObservacion = async () => {
  if (!mesSeleccionado.value) return

  try {
    guardando.value = true
    const response = await axios.post(
      `${apiUrl}/indicadores/guardar_observacion_mes`,
      {
        anio: anioActual.value,
        mes: mesSeleccionado.value.mes_numero,
        observaciones: observacionTexto.value
      },
      {
        headers: {
          Accept: "application/json",
        }
      }
    )

    if (response.status === 200) {
      cerrarModal()
    }
  } catch (error) {
    console.error('Error guardando observación:', error)
  } finally {
    guardando.value = false
  }
}

// Estado del modal de observaciones

const modalObservaciones = ref(false)
const mesSeleccionado = ref(null)
const observacionTexto = ref('')
const guardando = ref(false)

// Estado del modal de análisis de causas
const modalAnalisis = ref(false)
const analisisEditando = ref(null)
const guardandoAnalisis = ref(false)
const formAnalisis = ref({
  mes: '',
  analisis: '',
  acciones: '',
  responsable: '',
  fecha_compromiso: '',
  seguimiento: ''
})

// Lista de meses para el selector
const listaMeses = [
  { numero: 1, nombre: 'Enero' },
  { numero: 2, nombre: 'Febrero' },
  { numero: 3, nombre: 'Marzo' },
  { numero: 4, nombre: 'Abril' },
  { numero: 5, nombre: 'Mayo' },
  { numero: 6, nombre: 'Junio' },
  { numero: 7, nombre: 'Julio' },
  { numero: 8, nombre: 'Agosto' },
  { numero: 9, nombre: 'Septiembre' },
  { numero: 10, nombre: 'Octubre' },
  { numero: 11, nombre: 'Noviembre' },
  { numero: 12, nombre: 'Diciembre' }
]

const acciones_list = ref([])

const porcentajeMeta = computed(() => {
  if (!datosIndicadores.value || !datosIndicadores.value.indicadores?.length) return null
  // Tomar el primer mes, ya que es igual para todos|
  return datosIndicadores.value.indicadores[0].porcentaje_meta
})

const porcentajeMetaDisplay = computed(() => {
  return porcentajeMeta.value !== null && porcentajeMeta.value !== undefined
    ? `${porcentajeMeta.value}%`
    : '—'
})

// Watcher para cargar tickets cuando cambia el mes seleccionado
watch(mesSeleccionadoFiltro, (nuevoMes) => {
  if (nuevoMes) {
    currentPage.value = 1 // Resetear página al cambiar mes
    cargarTicketsPeriodo()
  } else {
    ticketsPeriodo.value = []
  }
})

const mesesFiltrados = computed(() => {
  if (!meses.value.length) return []
  if (!mesSeleccionadoFiltro.value) return meses.value
  return meses.value.filter(m => m.mes_numero === mesSeleccionadoFiltro.value)
})

const analisisFiltrados = computed(() => {
  if (!acciones_list.value) return []
  if (!mesSeleccionadoFiltro.value) return acciones_list.value
  
  // Filtrar por mes seleccionado (comparando números)
  return acciones_list.value.filter(item => item.mes === mesSeleccionadoFiltro.value)
})

const totales = computed(() => {
  if (!datosIndicadores.value) {
    return {
      totalVencer: 0,
      cerradasOportunamente: 0,
      cerradasFueraTiempo: 0,
      sinRegistrar: 0,
      indiceCumplimiento: '0%',
      acumuladoAnio: '0%',
      meta: porcentajeMetaDisplay.value,
      totalIngresaron: 0,
      ticketsAbiertos: 0,
    }
  }

  // Si hay filtro de mes, calcular totales solo para ese mes
  if (mesSeleccionadoFiltro.value) {
    const mesData = meses.value.find(m => m.mes_numero === mesSeleccionadoFiltro.value)
    if (mesData) {
      return {
        totalVencer: mesData.totalVencer,
        cerradasOportunamente: mesData.cerradasOportunamente,
        cerradasFueraTiempo: mesData.cerradasFueraTiempo,
        sinRegistrar: mesData.sinRegistrar,
        indiceCumplimiento: mesData.indiceCumplimiento,
        acumuladoAnio: mesData.acumuladoAnio, // Mantener acumulado o mostrar solo del mes? Generalmente acumulado es anual.
        meta: porcentajeMetaDisplay.value,
        totalIngresaron: mesData.totalIngresaron,
        ticketsAbiertos: mesData.ticketsAbiertos,
      }
    }
  }

  const totals = datosIndicadores.value.totales

  // Calcular la suma de tickets abiertos
  const sumaTicketsAbiertos = meses.value.reduce((sum, mes) => sum + (mes.ticketsAbiertos || 0), 0)

  return {
    totalVencer: totals.total_completados,
    cerradasOportunamente: totals.oportunos,
    cerradasFueraTiempo: totals.no_oportunos,
    sinRegistrar: totals.sin_respuesta,
    indiceCumplimiento: `${totals.porcentaje_global}%`,
    acumuladoAnio: `${totals.porcentaje_global}%`,
    meta: porcentajeMetaDisplay.value,
    totalIngresaron: totals.total_ingresados,
    ticketsAbiertos: sumaTicketsAbiertos,
  }
})

// Constantes para la gráfica

// Eje Y fijo hasta 20, ticks cada 5
const maxScale = 20
const yTicks = [20, 15, 10, 5, 0]

// Función para calcular la altura de las barras basada en la cantidad real
function calcularAlturaBarra(valor) {
  if (!valor || valor === 0) return 0
  // Si valor = 8 y maxScale = 20, entonces altura = (8/20)*100 = 40%
  // Visualmente la barra llega hasta 8 en el eje Y
  const porcentaje = (valor / maxScale) * 100
  return Math.min(porcentaje, 100)
}

function getIndicadorClass(valor) {
  if (valor === '#¡DIV/0!' || valor === '' || valor === null) return ''

  const porcentaje = parseFloat(valor)

  if (porcentaje >= 85) return 'adecuado'
  if (porcentaje >= 70) return 'aceptable'
  return 'inaceptable'
}

async function cargarIndicadores() {
  try {
    cargando.value = true
    const response = await axios.post(
      `${apiUrl}/indicadores/obtener_indicadores_gestion`,
      {
        anio: anioActual.value
      },
      {
        headers: {
          Accept: "application/json",
        }
      }
    )

    if (response.status === 200) {
      datosIndicadores.value = response.data.data

      // Mapear los datos del backend al formato de la tabla
      meses.value = datosIndicadores.value.indicadores.map(ind => ({
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
        ticketsAbiertos: ind.tickets_abiertos
      }))
      
      // Cargar análisis de causas
      await cargarAnalisisCausas()
    }
  } catch (error) {
    console.error('Error cargando indicadores:', error)
  } finally {
    cargando.value = false
  }
}

// Función para cargar tickets del periodo seleccionado
const cargarTicketsPeriodo = async () => {
  if (!mesSeleccionadoFiltro.value) {
    ticketsPeriodo.value = []
    return
  }

  try {
    cargandoTickets.value = true
    const response = await axios.post(
      `${apiUrl}/indicadores/obtener_tickets_periodo`,
      {
        anio: anioActual.value,
        mes: mesSeleccionadoFiltro.value,
        tipo_ticket: 1, // Gestión
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



// Funciones para análisis de causas y acciones
const cargarAnalisisCausas = async () => {
  try {
    const response = await axios.post(
      `${apiUrl}/indicadores/obtener_analisis_causas`,
      {
        anio: anioActual.value
      },
      {
        headers: {
          Accept: "application/json",
        }
      }
    )

    if (response.status === 200 && response.data.data) {
      acciones_list.value = response.data.data
    }
  } catch (error) {
    console.error('Error cargando análisis de causas:', error)
    acciones_list.value = []
  }
}

const abrirModalAnalisis = (analisis = null) => {
  analisisEditando.value = analisis
  
  if (analisis) {
    // Modo edición
    formAnalisis.value = {
      mes: analisis.mes,
      analisis: analisis.analisis || '',
      acciones: analisis.acciones || '',
      responsable: analisis.responsable || '',
      fecha_compromiso: analisis.fecha_compromiso || '',
      seguimiento: analisis.seguimiento || ''
    }
  } else {
    // Modo creación
    formAnalisis.value = {
      mes: '',
      analisis: '',
      acciones: '',
      responsable: '',
      fecha_compromiso: '',
      seguimiento: ''
    }
  }
  
  modalAnalisis.value = true
}

const cerrarModalAnalisis = () => {
  modalAnalisis.value = false
  analisisEditando.value = null
  formAnalisis.value = {
    mes: '',
    analisis: '',
    acciones: '',
    responsable: '',
    fecha_compromiso: '',
    seguimiento: ''
  }
}

const guardarAnalisis = async () => {
  try {
    guardandoAnalisis.value = true
    
    const payload = {
      anio: anioActual.value,
      mes: parseInt(formAnalisis.value.mes),
      analisis: formAnalisis.value.analisis,
      acciones: formAnalisis.value.acciones,
      responsable: formAnalisis.value.responsable,
      fecha_compromiso: formAnalisis.value.fecha_compromiso,
      seguimiento: formAnalisis.value.seguimiento
    }

    if (analisisEditando.value) {
      payload.id = analisisEditando.value.id
    }

    const response = await axios.post(
      `${apiUrl}/indicadores/guardar_analisis_causas`,
      payload,
      {
        headers: {
          Accept: "application/json",
        }
      }
    )

    if (response.status === 200) {
      await cargarAnalisisCausas()
      cerrarModalAnalisis()
    }
  } catch (error) {
    console.error('Error guardando análisis:', error)
    if (error.response?.data?.message) {
      alert(error.response.data.message)
    }
  } finally {
    guardandoAnalisis.value = false
  }
}

// Función auxiliar para obtener nombre del mes
const obtenerNombreMes = (numeroMes) => {
  const mes = listaMeses.find(m => m.numero === numeroMes)
  return mes ? mes.nombre : ''
}

// Función auxiliar para formatear fecha
const formatearFecha = (fecha) => {
  if (!fecha) return ''
  const date = new Date(fecha)
  const dia = String(date.getDate()).padStart(2, '0')
  const mes = String(date.getMonth() + 1).padStart(2, '0')
  const anio = date.getFullYear()
  return `${dia}/${mes}/${anio}`
}

// Calcular el máximo de tickets del año para escalar las barras a porcentaje
const maxTickets = computed(() => {
  if (!meses.value.length) return 1
  return Math.max(...meses.value.map(m => m.totalVencer || 0), 1)
})

// Altura de la gráfica de barras simple (debe coincidir con el CSS)
const SIMPLE_BAR_CHART_HEIGHT = 180;

// Calcula los puntos para la línea SVG del índice de cumplimiento (valor numérico, no porcentaje)
const linePoints = computed(() => {
  if (!meses.value.length) return ''
  return meses.value.map((mes, i) => {
    let valor = 0
    // Usar el valor numérico del porcentaje (por ejemplo, 50)
    if (mes.indiceCumplimiento && typeof mes.indiceCumplimiento === 'string') {
      valor = parseFloat(mes.indiceCumplimiento.replace('%','')) || 0
    }
    const y = SIMPLE_BAR_CHART_HEIGHT - (valor * SIMPLE_BAR_CHART_HEIGHT / 120)
    const x = (i / 11) * 100
    return `${x},${y}`
  }).join(' ')
})

// Calcula los puntos para la línea gris oscuro del % acumulado del año
const linePointsAcumulado = computed(() => {
  if (!meses.value.length) return ''
  return meses.value.map((mes, i) => {
    let valor = 0
    if (mes.acumuladoAnio && typeof mes.acumuladoAnio === 'string') {
      valor = parseFloat(mes.acumuladoAnio.replace('%','')) || 0
    }
    const y = SIMPLE_BAR_CHART_HEIGHT - (valor * SIMPLE_BAR_CHART_HEIGHT / 120)
    const x = (i / 11) * 100
    return `${x},${y}`
  }).join(' ')
})

// Línea verde de meta (igual formato que las otras)
const linePointsMeta = computed(() => {
  if (!meses.value.length || porcentajeMeta.value === null || porcentajeMeta.value === undefined) return ''
  const puntos = meses.value.map((_, i) => {
    const valor = parseFloat(porcentajeMeta.value) || 0
    const y = SIMPLE_BAR_CHART_HEIGHT - (valor * SIMPLE_BAR_CHART_HEIGHT / 120)
    const x = (i / 11) * 100
    return `${x},${y}`
  })
  return puntos.join(' ')
})

// Para la gráfica de torta
const cumplimientoGlobal = computed(() => {
  if (!totales.value || !totales.value.indiceCumplimiento) return 0;
  const val = parseFloat(totales.value.indiceCumplimiento);
  return isNaN(val) ? 0 : Math.round(val);
});
const circumferencia = 2 * Math.PI * 54;

function getEstadoColor(valor) {
  const pct = parseFloat(valor);
  if (pct >= 85) return '#22c55e'; // verde
  if (pct >= 70) return '#f59e42'; // naranja
  return '#ef4444'; // rojo
}
function getEstadoClass(valor) {
  const pct = parseFloat(valor);
  if (pct >= 85) return 'adecuado';
  if (pct >= 70) return 'aceptable';
  return 'inaceptable';
}
function getEstadoTexto(valor) {
  const pct = parseFloat(valor);
  if (pct >= 85) return 'Adecuado';
  if (pct >= 70) return 'Aceptable';
  return 'Inaceptable';
}

// Funciones para gestión de años
const cargarAniosDisponibles = async () => {
  try {
    const response = await axios.post(
      `${apiUrl}/indicadores/obtener_anios`,
      {},
      {
        headers: {
          Accept: "application/json",
        }
      }
    )

    if (response.status === 200 && response.data.data) {
      aniosDisponibles.value = response.data.data.map(a => a.anio)
      emit('update:anios', aniosDisponibles.value)
      
      // Si hay años disponibles y el año actual no está en la lista, seleccionar el primero
      if (aniosDisponibles.value.length > 0 && !aniosDisponibles.value.includes(anioActual.value)) {
        anioActual.value = aniosDisponibles.value[0]
      }
    }
  } catch (error) {
    console.error('Error cargando años disponibles:', error)
    // Dejar la lista vacía si hay error
    aniosDisponibles.value = []
    emit('update:anios', [])
  }
}

const abrirModalCrearAnio = () => {
  nuevoAnio.value = {
    anio: null,
    descripcion: ''
  }
  mostrarModalAnio.value = true
}

const cerrarModalAnio = () => {
  mostrarModalAnio.value = false
  nuevoAnio.value = {
    anio: null,
    descripcion: ''
  }
}

const guardarNuevoAnio = async () => {
  if (!nuevoAnio.value.anio) {
    alert('Por favor ingrese un año válido')
    return
  }

  // Validar que sea un número de 4 dígitos
  const anioNum = parseInt(nuevoAnio.value.anio)
  if (isNaN(anioNum) || anioNum < 1900 || anioNum > 2100) {
    alert('El año debe ser un número entre 1900 y 2100')
    return
  }

  guardandoAnio.value = true

  try {
    const response = await axios.post(
      `${apiUrl}/indicadores/crear_anio`,
      {
        anio: anioNum,
        descripcion: nuevoAnio.value.descripcion
      },
      {
        headers: {
          Accept: "application/json",
        }
      }
    )

    if (response.status === 200) {
      alert('Año creado exitosamente')
      cerrarModalAnio()
      await cargarAniosDisponibles()
      // Seleccionar el año recién creado
      anioActual.value = anioNum
      cargarIndicadores()
    }
  } catch (error) {
    console.error('Error creando año:', error)
    if (error.response?.data?.message) {
      alert(error.response.data.message)
    } else {
      alert('Error al crear el año')
    }
  } finally {
    guardandoAnio.value = false
  }
}

onMounted(async () => {
  await cargarAniosDisponibles()
  if (anioActual.value) {
    cargarIndicadores()
  }
  // setTimeout(() => {
  //   // Mostrar los datos de los meses en consola para depuración
  //   console.log('Meses para gráfica:', JSON.parse(JSON.stringify(meses.value)))
  // }, 1500)
})

// Exponer funciones y variables para que el componente padre pueda acceder a ellas
defineExpose({
  cargarIndicadores,
  abrirModalCrearAnio,
  anioActual,
  mesSeleccionadoFiltro
})
</script>

<style scoped>
.indicators {
  padding: 0;
  background: transparent;
  box-sizing: border-box;
}

.loading {
  text-align: center;
  padding: 40px;
  font-size: 0.9rem;
  color: var(--gtic-text-muted);
}

section {
  background: var(--gtic-surface);
  border-radius: 10px;
  padding: 20px 22px;
  margin-bottom: 16px;
  box-shadow: 0 8px 18px rgba(19, 41, 64, 0.08);
  border: 1px solid #e2e6ea;
}

h2 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--gtic-text-main);
  margin: 0 0 14px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #e2e6ea;
}

/* Tabla de información del indicador */
.info-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.78rem;
}

.info-table th {
  /* background: var(--gtic-primary); */
  background-color: #266148;
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

/* Tabla de resultados */
.results-table-wrapper {
  overflow-x: auto;
}

.results-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.78rem;
  min-width: 1400px;
  border: 1px solid #b4c6e7;
  box-shadow: 0 2px 8px rgba(19, 41, 64, 0.04);
}

.results-table thead th {
  background: #266148;
  color: #fff;
  padding: 5px 8px;
  text-align: center;
  font-weight: 600;
  border: 1px solid #266148;
  font-size: 0.78rem;
  line-height: 1.3;
  white-space: nowrap;
}

.observaciones-header {
  background: #5b9bd5 !important;
  border: 1px solid #4178b8 !important;
}

.sub-header {
  background: #5b9bd5 !important;
  border: 1px solid #4178b8 !important;
  font-size: 0.74rem;
}


.results-table tbody td {
  padding: 1px 6px;
  border: 1px solid #dde3ef;
  text-align: center;
  color: #266148;
  background: #f7f9fb;
  transition: background 0.2s;
}

.results-table tbody tr:nth-child(even) td {
  background: #f4f8fc;
}

.mes-name {
  background: #f7f9fb !important;
  color: #266148 !important;
  font-weight: 700 !important;
  text-align: left;
  padding-left: 14px;
  border-left: 4px solid #266148;
}

.total-row {
  background: #dbeaf7 !important;
  font-weight: 700;
}

.total-row td {
  font-weight: 700;
  background: #f7f9fb !important;
  color: #266148 !important;
}

.results-table tbody td strong {
  font-weight: 700;
}

.observaciones-cell {
  min-width: 15px;
  text-align: left;
  justify-items: left;
  background: #e7f3ff;
}

.observaciones-cell {
  min-width: 15px;
  text-align: left;
  justify-items: left;
  background: #e7f3ff;
}

/* Clases de estado según porcentaje */
.adecuado {
  background: #e6f7f2;
  color: #14866d;
  font-weight: 600;
}

.aceptable {
  background: #fff4e3;
  color: #d68c23;
  font-weight: 600;
}

.inaceptable {
  background: #fde2e2;
  color: #d64545;
  font-weight: 600;
}

@media print {
  .indicators {
    background: white;
    padding: 0;
  }

  section {
    box-shadow: none;
    page-break-inside: avoid;
  }
}

/* Estilos del modal de observaciones */
.modal-overlay {
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

.modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #333;
}

.btn-close {
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

.btn-close:hover {
  background: #f0f0f0;
}

.modal-body {
  padding: 20px;
}

.modal-body textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
  font-size: 14px;
  resize: vertical;
  min-height: 150px;
}

.modal-body textarea:focus {
  outline: none;
  border-color: #4CAF50;
}

.modal-footer {
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
}

.btn-cancelar:hover {
  background: #e0e0e0;
}

.modal-footer button:not(.btn-cancelar) {
  background: #4CAF50;
  color: white;
}

.modal-footer button:not(.btn-cancelar):hover:not(:disabled) {
  background: #45a049;
}

.modal-footer button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-observaciones {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 4px;
  transition: background 0.2s;
}

.btn-observaciones:hover {
  background: #f0f0f0;
}

.observaciones-cell {
  text-align: center;
}

/* Estilos de la gráfica de barras */
.indicator-chart {
  background: var(--gtic-surface);
  border-radius: 10px;
  padding: 16px 18px 18px;
  box-shadow: 0 8px 18px rgba(19, 41, 64, 0.06);
  border: 1px solid #e2e6ea;
  margin-top: 20px;
}

.indicator-chart__header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}

.indicator-chart__header h2 {
  margin: 0;
  font-size: 0.98rem;
  font-weight: 600;
  color: var(--gtic-text-main);
}

.indicator-chart__header .subtitle {
  margin: 0;
  font-size: 0.78rem;
  color: var(--gtic-text-muted);
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
  padding-top: 4px;
  padding-bottom: 18px;
  height: 140px;
}

.chart-area {
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 140px;
  padding: 0 8px 0 8px;
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
  z-index: 1;
}

.bar-group {
  flex: 1;
  position: relative;
  display: flex;
  gap: 3px;
  align-items: flex-end;
  justify-content: center;
}

.bar {
  width: 40%;
  min-height: 2px;
  border-radius: 6px 6px 2px 2px;
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
  background: linear-gradient(180deg, var(--gtic-secondary), var(--gtic-primary));
}

.bar-oportuno:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.35);
}

.bar-label {
  position: absolute;
  bottom: -16px;
  font-size: 0.68rem;
  color: #4b5563;
  font-weight: 500;
}

/* NUEVOS ESTILOS PARA LA GRÁFICA SIMPLE */
.simple-bar-chart {
  background: var(--gtic-surface);
  border-radius: 10px;
  padding: 16px 18px 50px;
  box-shadow: 0 8px 18px rgba(19, 41, 64, 0.06);
  border: 1px solid #e2e6ea;
  margin-top: 20px;
}
.simple-bar-chart__header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}
.simple-bar-chart__header h2 {
  margin: 0;
  font-size: 0.98rem;
  font-weight: 600;
  color: var(--gtic-text-main);
}
.simple-bar-chart__header .subtitle {
  margin: 0;
  font-size: 0.78rem;
  color: var(--gtic-text-muted);
}
.simple-bar-chart__body {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px;
  align-items: end;
  height: 140px;
  margin-bottom: 0;
  padding-bottom: 0;
}
.simple-axis-y {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  font-size: 0.68rem;
  color: var(--gtic-text-muted);
  height: 180px;
  padding-right: 8px;
}
.simple-bars-area {
  position: relative;
  display: flex;
  gap: 10px;
  height: 180px;
  border-radius: 8px;
  background: repeating-linear-gradient(
    to top,
    #f8fafc 0px,
    #f8fafc 49px,
    #e0e7ef 50px,
    #f8fafc 51px
  );
  border: 1px solid #e2e6ea;
  margin-bottom: 0;
  min-width: 0;
  width: 100%;
  overflow-x: auto;
  overflow-y: visible; /* Permitir que las etiquetas sean visibles */
}
.simple-bar-chart.compact {
  min-width: 0;
  width: 100%;
  max-width: 100%;
  margin: 0 auto 24px auto; /* Reducir margen inferior */
  box-sizing: border-box;
  padding-bottom: 18px; /* Espacio para leyenda */
}
.simple-bar-group {
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  justify-content: center;
  position: relative;
  min-width: 32px;
}
.simple-bar {
  width: 40px;
  min-height: 2px;
  border-radius: 4px 4px 2px 2px;
  margin: 0 4px 0 4px;
  transition: height 0.2s;
  border: none;
}
.simple-bar-total {
  background: #1e3a8a;
}
.simple-bar-oportuno {
  background: #60a5fa;
  margin-top: 2px;
}


.simple-line-svg {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2;
}

.results-table-wrapper {
  overflow-x: auto;
}

/* Leyenda de la gráfica */
.simple-bar-chart__body-with-legend {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 24px;
}
.simple-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  font-size: 0.68rem;
  margin-top: 10px;
  align-items: center;
  justify-content: center;
}
.simple-legend-bottom {
  flex-direction: row;
  justify-content: center;
  width: 100%;
  margin-top: 60px;
  margin-left: 0;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 4px;
}
.legend-color {
  display: inline-block;
  width: 18px;
  height: 4px;
  border-radius: 2px;
}
.legend-blue {
  background: #2563eb;
}
.legend-gray {
  background: #374151;
}
.legend-green {
  background: #004d0d;
}
.legend-bar {
  display: inline-block;
  width: 18px;
  height: 10px;
  border-radius: 2px;
  margin-right: 2px;
}
.legend-bar-total {
  background: #1e3a8a;
}
.legend-bar-oportuno {
  background: #60a5fa;
}
/* Layout de 2 columnas para tabla y gráficas */
.indicadores-grid {
  display: grid;
  grid-template-columns: 2fr 1.1fr;
  gap: 24px;
  align-items: flex-start;
  margin-bottom: 18px;
}
.indicadores-col-table {
  min-width: 0;
}
.indicadores-col-graficas {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-width: 0;
}

/* Card de estado global del indicador */
.indicador-torta-card {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(19,41,64,0.07);
  border: 1px solid #e2e6ea;
  padding: 22px 18px 18px 18px;
  margin-top: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.indicador-torta-card h3 {
  font-size: 1.08rem;
  font-weight: 700;
  color: #22396a;
  margin: 0 0 4px 0;
  text-align: center;
}
.indicador-torta-desc {
  font-size: 0.92rem;
  color: #6b7280;
  margin-bottom: 12px;
  text-align: center;
}
.indicador-torta-flex {
  display: flex;
  align-items: center;
  gap: 18px;
}
.indicador-torta-svg {
  display: block;
}
.indicador-torta-estado {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}
.indicador-torta-estado-badge {
  display: inline-block;
  padding: 3px 16px;
  border-radius: 999px;
  font-size: 0.98rem;
  font-weight: 700;
  color: #fff;
  background: #22396a;
  margin-bottom: 4px;
}

/* Card Tickets del periodo */
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
  color: #266148;
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

.month-selector {
  min-width: 140px;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid gray;
  background: var(--gtic-surface);
  font-size: 0.85rem;
  color: var(--gtic-text-main);
  outline: none;
  cursor: pointer;
}

.month-selector:focus {
  border-color: var(--gtic-secondary);
  box-shadow: 0 0 0 1px rgba(122, 199, 137, 0.35);
}

.indicador-torta-estado-badge.adecuado {
  background: #22c55e;
}
.indicador-torta-estado-badge.aceptable {
  background: #f59e42;
}
.indicador-torta-estado-badge.inaceptable {
  background: #ef4444;
}
.indicador-torta-leyenda {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 0.92rem;
  color: #22396a;
}
.indicador-torta-leyenda li {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 2px;
}
.indicador-torta-dot {
  display: inline-block;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  margin-right: 2px;
}
.indicador-torta-dot.adecuado {
  background: #22c55e;
}
.indicador-torta-dot.aceptable {
  background: #f59e42;
}
.indicador-torta-dot.inaceptable {
  background: #ef4444;
}
/* Compactar gráfica y permitir scroll horizontal */

/* Ajuste para que la gráfica nunca se sobrepase y solo tenga scroll si es necesario */
.simple-bar-chart-outer {
  width: 100%;
  overflow-x: auto;
  padding-bottom: 30px;
  box-sizing: border-box;
}
.simple-bar-chart-scroll {
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
}
.simple-bar-chart.compact {
  min-width: 0;
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
}

.simple-bar-group {
  min-width: 0;
}
.simple-bar {
  width: 22px !important;
  min-width: 12px;
  max-width: 32px;
}
@media (max-width: 900px) {
  .simple-bar-chart.compact {
    min-width: 0;
    width: 100%;
    max-width: 100%;
  }
}

/* Estilos para tabla de análisis de causas y acciones */
.analisis-causas-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #b4c6e7;
  box-shadow: 0 2px 8px rgba(19, 41, 64, 0.04);
}

.analisis-caption {
  caption-side: top;
  text-align: left;
  font-weight: bold;
  font-size: 1.05rem;
  color: #22396a;
  padding-bottom: 8px;
}

.analisis-caption-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.analisis-subtitle {
  font-weight: 400;
  font-size: 0.98rem;
  color: #4b5563;
  margin-top: 2px;
}

.analisis-header-row {
  background: #266148;
  color: #fff;
}

.analisis-th {
  text-align: center;
  vertical-align: middle;
  font-size: 0.78rem;
  padding: 12px 8px;
  border: 1px solid #266148;
  font-weight: 600;
}

.analisis-th-mes {
  min-width: 70px;
}

.analisis-th-analisis {
  min-width: 220px;
}

.analisis-th-acciones {
  min-width: 180px;
}

.analisis-th-responsable {
  min-width: 140px;
}

.analisis-th-fecha {
  min-width: 120px;
}

.analisis-th-seguimiento {
  min-width: 120px;
}

.analisis-th-title {
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.analisis-empty-message {
  text-align: center;
  padding: 16px;
  color: #6b7280;
  background: #f4fcf5;
}

/* Nombres de los meses debajo de la gráfica de barras */
.simple-bar-month-labels {
  display: flex;
  justify-content: center;
  margin-top: 50px;
  width: 100%;
  font-size: 0.68rem;
  font-weight: 500;
  color: #22396a;
  letter-spacing: 0.5px;
  user-select: none;
}
.simple-bar-month-label {
  min-width: 2px;
  text-align: center;
  white-space: nowrap;
  flex: 1 1 0;
}

/* Etiquetas de meses en la gráfica de barras - CORREGIDO */
.simple-bar-label {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.68rem;
  color: #4b5563;
  font-weight: 500;
  margin-top: 4px;
  pointer-events: none;
  white-space: nowrap;
  z-index: 10;
}

/* Botón + Agregar análisis para tabla de análisis */
.btn-agregar-analisis {
  background: #266148;
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
  background: #357a5c;
}

/* Icono de información en cabeceras de tabla */
.info-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid white;
  background: #5392ce;
  color: #fff;
  font-size: 11px;
  font-weight: bold;
  font-style: normal;
  margin-left: 6px;
  cursor: help;
  user-select: none;
  transition: background 0.2s;
}
.info-icon:hover {
  background: #22396a;
}

/* Estilos para modal de análisis de causas y acciones */
.modal-content-wide {
  max-width: 750px;
}

.form-analisis {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 0.88rem;
  font-weight: 600;
  color: #22396a;
}

.form-select,
.form-input,
.form-textarea {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-family: inherit;
  font-size: 0.88rem;
  color: #374151;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-select:focus,
.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #5b9bd5;
  box-shadow: 0 0 0 3px rgba(91, 155, 213, 0.1);
}

.form-select:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
  color: #9ca3af;
}

.form-textarea {
  resize: vertical;
  min-height: 90px;
  line-height: 1.5;
}

.form-input[type="date"] {
  cursor: pointer;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  margin-top: 0;
}

.modal-footer button {
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 100px;
}

.btn-cancelar {
  background: #e5e7eb;
  color: #374151;
}

.btn-cancelar:hover {
  background: #d1d5db;
}

.btn-guardar {
  background: #2e4360;
  color: white;
}

.btn-guardar:hover:not(:disabled) {
  background: #22396a;
  box-shadow: 0 2px 8px rgba(34, 57, 106, 0.25);
}

.btn-guardar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Botón editar en tabla de análisis */
.btn-editar-analisis {
  background: #266148;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-editar-analisis:hover {
  background: #4178b8;
  box-shadow: 0 2px 6px rgba(65, 120, 184, 0.3);
  transform: translateY(-1px);
}

.analisis-td {
  text-align: left;
  padding: 8px 10px !important;
  font-size: 0.78rem;
  color: #374151;
  line-height: 1.4;
}

.analisis-td-mes {
  text-align: center;
  font-weight: 600;
  background: #f7f9fb !important;
  color: #266148;
}

.analisis-td-fecha {
  text-align: center;
  font-size: 0.78rem;
  color: #374151;
}

.analisis-td-actions {
  text-align: center;
  background: #f9fafb !important;
  padding: 6px !important;
}

/* Estilos para la lista de tickets */
.loading-tickets {
  text-align: center;
  padding: 32px;
  color: #6b7280;
  font-style: italic;
}

.tickets-list-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Summary Cards */
.tickets-summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 3px;
}

.summary-card {
  display: flex;
  flex-direction: column;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid transparent;
}

.card-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
}

.card-value {
  font-size: 1.5rem;
  font-weight: 600;
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
  background: #ecfdf5; /* Light Green */
  border-color: #d1fae5;
}
.card-cerrados .card-label { color: #059669; }
.card-cerrados .card-value { color: #059669; }

.card-progreso {
  background: #fffbeb; /* Light Orange/Yellow */
  border-color: #fef3c7;
}
.card-progreso .card-label { color: #d97706; }
.card-progreso .card-value { color: #d97706; }

.card-abiertos {
  background: #fef2f2; /* Light Red */
  border-color: #fee2e2;
}
.card-abiertos .card-label { color: #dc2626; }
.card-abiertos .card-value { color: #dc2626; }


/* Table Styles */
.table-scroll-wrapper {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.tickets-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  min-width: 800px; /* Ensure scroll on small screens */
}

.tickets-table th {
  text-align: left;
  padding: 12px 16px;
  background: #266148;
  color: white;
  font-weight: 700;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}

.tickets-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  background: #fff;
  vertical-align: middle;
}

.tickets-table tr:last-child td {
  border-bottom: none;
}

.ticket-id {
  font-weight: 600;
  color: #22396a;
}

.ticket-responsable,
.ticket-solicitante,
.ticket-macro,
.ticket-tipo {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}

.ticket-fecha {
  white-space: nowrap;
  color: #64748b;
}

.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-align: center;
  min-width: 80px;
}

.status-1 { /* Abierto */
  background: #fee2e2;
  color: #991b1b;
}

.status-2 { /* En Proceso */
  background: #fef3c7;
  color: #92400e;
}

.status-3, .status-4 { /* Completado / Cerrado */
  background: #dcfce7;
  color: #166534;
}

/* Pagination Controls */
.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.btn-pagination {
  padding: 6px 12px;
  border: 1px solid #cbd5e1;
  background: #fff;
  border-radius: 6px;
  color: #475569;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-pagination:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #94a3b8;
}

.btn-pagination:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f8fafc;
}

.pagination-info {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 500;
}
</style>


