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
            <td class="meta-adecuado">85%</td>
            <td class="estado-aceptable">84%-70%</td>
            <td class="estado-inaceptable">< 70%</td>
            <td>Semanal</td>
            <td>Coordinador TIC</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- Sección 2: Resultados -->
    <section class="results">
      <h2>2. RESULTADOS</h2>
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
              <td>{{ mes.meta }}</td>
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
              <td><strong>{{ totales.meta }}</strong></td>
              <td></td>
              <td><strong>{{ totales.ticketsAbiertos }}</strong></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
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

const totales = computed(() => {
  if (!datosIndicadores.value) {
    return {
      totalVencer: 0,
      cerradasOportunamente: 0,
      cerradasFueraTiempo: 0,
      sinRegistrar: 0,
      indiceCumplimiento: '0%',
      acumuladoAnio: '0%',
      meta: '85%',
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
    meta: '85%',
    totalIngresaron: totals.total_ingresados,
    ticketsAbiertos: sumaTicketsAbiertos,
  }
})

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
        meta: '85%',
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

onMounted(() => {
  cargarIndicadores()
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
  padding: 6px 14px;
  background: var(--gtic-primary);
  color: white;
  border: none;
  border-radius: 999px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: #1c2d41;
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
}

.results-table thead th {
  background: var(--gtic-primary);
  color:  black;
  padding: 8px 6px;
  text-align: center;
  font-weight: 600;
  border: 1px solid #132940;
  font-size: 0.74rem;
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
  padding: 6px 8px;
  border: 1px solid #e2e6ea;
  text-align: center;
  color: var(--gtic-text-main);
}

.results-table tbody tr:nth-child(even) {
  background: #f7f9fb;
}

.mes-name {
  background: #b4d7ee;
  font-weight: 600;
  text-align: left;
  padding-left: 12px;
}

.total-row {
  background: #b4d7ee;
  font-weight: 600;
}

.total-row td {
  font-weight: 600;
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
</style>

