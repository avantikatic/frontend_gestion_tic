<template>
  <div class="indicators">
    <div class="header">
      <h1>INFORME DE GESTIÓN</h1>
      <div class="header-controls">
        <select v-model="anioActual" @change="cargarIndicadores" class="year-selector">
          <option v-for="year in [2024, 2025, 2026]" :key="year" :value="year">{{ year }}</option>
        </select>
        <button @click="cargarIndicadores" class="refresh-btn" :disabled="cargando">
          {{ cargando ? '🔄 Cargando...' : '🔄 Actualizar' }}
        </button>
      </div>
    </div>

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
                  <!-- <th rowspan="2">Observaciones</th> -->
                </tr>
              </thead>
              <tbody>
                <tr v-for="mes in meses" :key="mes.nombre">
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
        </div>
        <div class="indicadores-col-graficas">
          <section class="simple-bar-chart-outer">
            <div class="simple-bar-chart-scroll">
              <section class="simple-bar-chart compact">
                <header class="simple-bar-chart__header">
                  <h2>Comportamiento mensual de tickets</h2>
                  <p class="subtitle">Comparación de tickets totales vs. tickets cerrados oportunamente</p>
                </header>
                <div class="simple-bar-chart__body">
                  <div class="simple-axis-y">
                    <span v-for="tick in [120, 100, 80, 60, 40, 20, 0]" :key="tick">{{ tick }}</span>
                  </div>
                  <div class="simple-bars-area">
                    <svg class="simple-line-svg" viewBox="0 0 100 180" preserveAspectRatio="none">
                      <polyline :points="linePointsAcumulado" fill="none" stroke="#374151" stroke-width="0.3" stroke-linecap="round" stroke-linejoin="round" />
                      <polyline :points="linePoints" fill="none" stroke="#2563eb" stroke-width="0.3" stroke-linecap="round" stroke-linejoin="round" />
                      <polyline :points="linePointsMeta" fill="none" stroke="#004d0d" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    <div v-for="mes in meses" :key="mes.mes_numero" class="simple-bar-group">
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
                <div class="simple-legend simple-legend-right" style="display: none;"></div>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import apiUrl from "../../config.js"

// Año actual o seleccionado
const anioActual = ref(new Date().getFullYear())
const cargando = ref(false)
const datosIndicadores = ref(null)

// Datos de ejemplo (se sobrescribirán con datos reales)
const meses = ref([])

// Estado del modal de observaciones
const modalObservaciones = ref(false)
const mesSeleccionado = ref(null)
const observacionTexto = ref('')
const guardando = ref(false)

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
      `${apiUrl}/dashboard/obtener_indicadores_gestion`,
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
    }
  } catch (error) {
    console.error('Error cargando indicadores:', error)
  } finally {
    cargando.value = false
  }
}

// Función para abrir el modal de observaciones
const abrirModalObservaciones = async (mes) => {
  mesSeleccionado.value = mes
  observacionTexto.value = ''
  
  try {
    const response = await axios.post(
      `${apiUrl}/dashboard/obtener_observacion_mes`,
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
      `${apiUrl}/dashboard/guardar_observacion_mes`,
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
      console.log('Observación guardada exitosamente')
      cerrarModal()
    }
  } catch (error) {
    console.error('Error guardando observación:', error)
  } finally {
    guardando.value = false
  }
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

onMounted(() => {
  cargarIndicadores()
  setTimeout(() => {
    // Mostrar los datos de los meses en consola para depuración
    console.log('Meses para gráfica:', JSON.parse(JSON.stringify(meses.value)))
  }, 1500)
})
</script>

<style scoped>
.indicators {
  padding: 18px 32px 30px;
  background: #f8f9fa;
  min-height: 100vh;
  box-sizing: border-box;
}

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

.year-selector {
  min-width: 120px;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid var(--gtic-accent);
  background: var(--gtic-surface);
  font-size: 0.85rem;
  color: var(--gtic-text-main);
  outline: none;
  cursor: pointer;
}

.year-selector:focus {
  border-color: var(--gtic-secondary);
  box-shadow: 0 0 0 1px rgba(122, 199, 137, 0.35);
}


.refresh-btn {
  padding: 4px 18px;
  background: #22396a;
  color: #fff;
  border: none;
  border-radius: 18px;
  font-size: 0.92rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: background 0.2s;
  box-shadow: none;
  outline: none;
}

.refresh-btn:hover:not(:disabled) {
  background: #1a2947;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  background: var(--gtic-primary);
  color: black;
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
  background: #22396a;
  color: #fff;
  padding: 10px 8px;
  text-align: center;
  font-weight: 600;
  border: 1px solid #22396a;
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
  padding: 8px 8px;
  border: 1px solid #dde3ef;
  text-align: center;
  color: #22396a;
  background: #fff;
  transition: background 0.2s;
}

.results-table tbody tr:nth-child(even) td {
  background: #f4f8fc;
}

.results-table tbody tr:hover td {
  background: #e7f3ff;
}

.mes-name {
  background: #e7f3ff !important;
  color: #22396a !important;
  font-weight: 700 !important;
  text-align: left;
  padding-left: 14px;
  border-left: 4px solid #5b9bd5;
}

.total-row {
  background: #dbeaf7 !important;
  font-weight: 700;
}

.total-row td {
  font-weight: 700;
  background: #dbeaf7 !important;
  color: #22396a !important;
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
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #e0e0e0;
}

.modal-footer button {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.btn-cancelar {
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
  padding: 16px 18px 60px;
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
  padding-bottom: 0;
  min-width: 0;
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
}
.simple-bar-chart.compact {
  min-width: 0;
  width: 100%;
  max-width: 100%;
  margin: 0 auto 48px auto;
  box-sizing: border-box;
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
.simple-bar-label {
  position: absolute;
  bottom: -18px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.68rem;
  color: #4b5563;
  font-weight: 500;
  margin-top: 2px;
  pointer-events: none;
  white-space: nowrap;
}
.simple-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 14px 32px;
  font-size: 0.68rem;
  margin-top: 10px;
  align-items: center;
  justify-content: center;
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
.simple-legend-right {
  flex-direction: column;
  min-width: 180px;
  margin-top: 0;
  margin-left: 18px;
}
.simple-legend-bottom {
  flex-direction: row;
  justify-content: center;
  width: 100%;
  margin-top: 18px;
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
  padding-bottom: 50px;
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
</style>


