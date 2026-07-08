<template>
  <div class="indicators">
    <!-- 1. INFORMACIÓN DEL INDICADOR -->
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
            <td class="indicator-name">Oportunidad en la ejecución de las actividades de ACPM</td>
            <td>Gestión</td>
            <td class="formula">
              (#Total actividades ejecutadas oportunamente / #Total Actividades con cierre programado) × 100
            </td>
            <td class="meta-adecuado">80%</td>
            <td class="estado-aceptable">79% – 70%</td>
            <td class="estado-inaceptable">&lt; 70%</td>
            <td>Mensual</td>
            <td>RESPONSABLE DEL ÁREA</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- Grid principal -->
    <div class="indicadores-grid">
      <!-- Columna izquierda: resultados + análisis -->
      <div class="indicadores-col-table">

        <!-- 2. RESULTADOS -->
        <div class="results-table-wrapper">
          <h2>2. RESULTADOS</h2>
          <table class="results-table">
            <thead>
              <tr>
                <th class="col-mes">MES</th>
                <th class="col-num"># Total Actividades con cierre programado</th>
                <th class="col-num"># Total actividades ejecutadas oportunamente</th>
                <th class="col-num"># Total actividades ejecutadas fuera de tiempo</th>
                <th class="col-num"># Total actividades sin ejecutar</th>
                <th class="col-pct">Oportunidad en la ejecución de las actividades de ACPM</th>
                <th class="col-pct">Acumulado año</th>
                <th class="col-meta">Meta</th>
                <th class="col-num">Resultado año anterior</th>
                <th class="col-num">Resultado año anterior acumulado</th>
                <th class="col-num"># Total Actividades cerradas vencidas</th>
                <th class="col-num">No total actividades vencidas</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="mes in mesesResultados" :key="mes.numero">
                <td class="mes-name">{{ mes.codigo }}</td>
                <td></td>
                <td></td>
                <td></td>
                <td>0</td>
                <td class="celda-formula">—</td>
                <td class="celda-formula">—</td>
                <td>80%</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
              <tr class="total-row">
                <td class="mes-name"><strong>TOTAL</strong></td>
                <td><strong>0</strong></td>
                <td><strong>0</strong></td>
                <td><strong>0</strong></td>
                <td><strong>0</strong></td>
                <td class="celda-formula">—</td>
                <td class="celda-formula">—</td>
                <td><strong>80%</strong></td>
                <td></td>
                <td></td>
                <td><strong>0</strong></td>
                <td><strong>0</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 4. ANÁLISIS Y ACCIONES -->
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
                <th class="analisis-th analisis-th-mes">MES</th>
                <th class="analisis-th analisis-th-analisis">
                  <div class="analisis-th-title">
                    ANÁLISIS (CAUSAS PRINCIPALES)
                    <span class="info-icon" title="Para llegar a las causas principales:&#10;• Identifique dónde se generan las desviaciones y su pareto.&#10;• Filtre las causas con lluvia de ideas y análisis causa y efecto-7M&#10;• Reduzca las causas a máximo 3 que se encuentren validadas (apoye en la técnica 5 por qué)">i</span>
                  </div>
                </th>
                <th class="analisis-th analisis-th-acciones">
                  <div class="analisis-th-title">
                    ACCIONES A TOMAR FRENTE AL ANÁLISIS
                    <span class="info-icon" title="Liste las acciones con las que se van a eliminar/controlar las causas identificadas.&#10;Puede relacionar alguna ACPM que se encuentre trabajando.">i</span>
                  </div>
                </th>
                <th class="analisis-th analisis-th-responsable">
                  <div class="analisis-th-title">
                    RESPONSABLE (NOMBRE-CARGO)
                    <span class="info-icon" title="Relacione el nombre y cargo del responsable de llevar a cabo las acciones definidas">i</span>
                  </div>
                </th>
                <th class="analisis-th analisis-th-fecha">
                  <div class="analisis-th-title">
                    FECHA DE COMPROMISO
                    <span class="info-icon" title="Indique la fecha (DD/MM/AAAA) en que la acción quedará ejecutada">i</span>
                  </div>
                </th>
                <th class="analisis-th analisis-th-seguimiento">
                  <div class="analisis-th-title">
                    SEGUIMIENTO
                    <span class="info-icon" title="Relacione el estado de cumplimiento de las acciones definidas">i</span>
                  </div>
                </th>
                <th class="analisis-th analisis-th-actions"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="mes in MESES_LISTA" :key="mes.numero">
                <td class="analisis-td analisis-td-mes">{{ mes.nombre }}</td>
                <template v-if="getAnalisisMes(mes.numero)">
                  <td class="analisis-td">{{ getAnalisisMes(mes.numero).analisis }}</td>
                  <td class="analisis-td">{{ getAnalisisMes(mes.numero).acciones }}</td>
                  <td class="analisis-td">{{ getAnalisisMes(mes.numero).responsable }}</td>
                  <td class="analisis-td analisis-td-fecha">{{ getAnalisisMes(mes.numero).fecha_compromiso }}</td>
                  <td class="analisis-td">{{ getAnalisisMes(mes.numero).seguimiento }}</td>
                  <td class="analisis-td analisis-td-actions">
                    <button class="btn-editar-analisis" @click="abrirModalAnalisis(getAnalisisMes(mes.numero))" title="Editar">✏️</button>
                  </td>
                </template>
                <template v-else>
                  <td class="analisis-td"></td>
                  <td class="analisis-td"></td>
                  <td class="analisis-td"></td>
                  <td class="analisis-td analisis-td-fecha"></td>
                  <td class="analisis-td"></td>
                  <td class="analisis-td analisis-td-actions"></td>
                </template>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

      <!-- Columna derecha: gráfica + estado -->
      <div class="indicadores-col-graficas">
        <section class="simple-bar-chart-outer">
          <div class="simple-bar-chart-scroll">
            <section class="simple-bar-chart compact">
              <header class="simple-bar-chart__header">
                <h2>3. Gráfica</h2>
              </header>
              <div class="simple-bar-chart__body">
                <div class="simple-axis-y">
                  <span v-for="tick in [100, 80, 60, 40, 20, 0]" :key="tick">{{ tick }}</span>
                </div>
                <div class="simple-bars-area">
                  <div v-for="mes in mesesResultados" :key="mes.numero" class="simple-bar-group">
                    <div class="simple-bar simple-bar-total" style="height: 0%; width: 28px;" :title="`${mes.nombre}: Sin datos`"></div>
                    <div class="simple-bar simple-bar-oportuno" style="height: 0%; width: 28px;"></div>
                    <span class="simple-bar-label">{{ mes.nombreCorto }}</span>
                  </div>
                </div>
              </div>
              <div class="simple-legend simple-legend-bottom">
                <div class="legend-item"><span class="legend-bar legend-bar-total"></span> Total actividades con cierre programado</div>
                <div class="legend-item"><span class="legend-bar legend-bar-oportuno"></span> Ejecutadas oportunamente</div>
              </div>
            </section>
          </div>
        </section>

        <section class="indicador-torta-card">
          <h3>Estado global del indicador</h3>
          <p class="indicador-torta-desc">Promedio de oportunidad del periodo filtrado.</p>
          <div class="indicador-torta-flex">
            <svg viewBox="0 0 120 120" width="110" height="110" class="indicador-torta-svg">
              <circle cx="60" cy="60" r="54" fill="#f4f8fc" stroke="#e5e7eb" stroke-width="15" />
              <circle cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" stroke-width="8" />
              <text x="60" y="66" text-anchor="middle" font-size="28" font-weight="bold" fill="#22396a">0%</text>
              <text x="60" y="86" text-anchor="middle" font-size="12" fill="#22396a">cumplimiento</text>
            </svg>
            <div class="indicador-torta-estado">
              <span class="indicador-torta-estado-badge inaceptable">Sin datos</span>
              <ul class="indicador-torta-leyenda">
                <li><span class="indicador-torta-dot adecuado"></span> Adecuado (≥ 80%)</li>
                <li><span class="indicador-torta-dot aceptable"></span> Aceptable (70% – 79%)</li>
                <li><span class="indicador-torta-dot inaceptable"></span> Inaceptable (&lt; 70%)</li>
              </ul>
            </div>
          </div>
        </section>
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
                <label for="mes-analisis-op">Mes *</label>
                <select id="mes-analisis-op" v-model="formAnalisis.mes" required :disabled="!!analisisEditando" class="form-select">
                  <option value="">Seleccione un mes</option>
                  <option v-for="mes in MESES_LISTA" :key="mes.numero" :value="mes.numero">{{ mes.nombre }}</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label for="analisis-op">Análisis (Causas Principales) *</label>
              <textarea id="analisis-op" v-model="formAnalisis.analisis" placeholder="Identifique dónde se generan las desviaciones y su pareto..." rows="4" required class="form-textarea"></textarea>
            </div>
            <div class="form-group">
              <label for="acciones-op">Acciones a Tomar Frente al Análisis *</label>
              <textarea id="acciones-op" v-model="formAnalisis.acciones" placeholder="Liste las acciones con las que se van a eliminar/controlar las causas..." rows="4" required class="form-textarea"></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="responsable-op">Responsable (Nombre-Cargo) *</label>
                <input type="text" id="responsable-op" v-model="formAnalisis.responsable" placeholder="Ej: Juan Pérez - Coordinador TIC" required class="form-input" />
              </div>
              <div class="form-group">
                <label for="fecha-op">Fecha de Compromiso *</label>
                <input type="date" id="fecha-op" v-model="formAnalisis.fecha_compromiso" required class="form-input" />
              </div>
            </div>
            <div class="form-group">
              <label for="seguimiento-op">Seguimiento *</label>
              <textarea id="seguimiento-op" v-model="formAnalisis.seguimiento" placeholder="Relacione el estado de cumplimiento de las acciones definidas..." rows="3" required class="form-textarea"></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button @click="cerrarModalAnalisis" class="btn-cancelar">Cancelar</button>
          <button @click="guardarAnalisis" class="btn-guardar">Guardar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  anioProp: { type: Number, default: null },
  mesProp: { type: [String, Number], default: '' },
})

const MESES_LISTA = [
  { numero: 1,  nombre: 'Enero',      nombreCorto: 'Ene' },
  { numero: 2,  nombre: 'Febrero',    nombreCorto: 'Feb' },
  { numero: 3,  nombre: 'Marzo',      nombreCorto: 'Mar' },
  { numero: 4,  nombre: 'Abril',      nombreCorto: 'Abr' },
  { numero: 5,  nombre: 'Mayo',       nombreCorto: 'May' },
  { numero: 6,  nombre: 'Junio',      nombreCorto: 'Jun' },
  { numero: 7,  nombre: 'Julio',      nombreCorto: 'Jul' },
  { numero: 8,  nombre: 'Agosto',     nombreCorto: 'Ago' },
  { numero: 9,  nombre: 'Septiembre', nombreCorto: 'Sep' },
  { numero: 10, nombre: 'Octubre',    nombreCorto: 'Oct' },
  { numero: 11, nombre: 'Noviembre',  nombreCorto: 'Nov' },
  { numero: 12, nombre: 'Diciembre',  nombreCorto: 'Dic' },
]

const anioActual = computed(() => props.anioProp || new Date().getFullYear())

const mesesResultados = computed(() => {
  const year2d = String(anioActual.value).slice(-2)
  const base = MESES_LISTA.map(m => ({
    ...m,
    codigo: `${String(m.numero).padStart(2, '0')}/${year2d}`,
  }))
  if (!props.mesProp) return base
  return base.filter(m => m.numero === Number(props.mesProp))
})

// Análisis local (sin backend aún)
const analisisList = ref([])
const modalAnalisis = ref(false)
const analisisEditando = ref(null)
const formAnalisis = ref({ mes: '', analisis: '', acciones: '', responsable: '', fecha_compromiso: '', seguimiento: '' })

const getAnalisisMes = (num) => analisisList.value.find(a => a.mes === num) ?? null

const abrirModalAnalisis = (item) => {
  analisisEditando.value = item
  formAnalisis.value = item
    ? { ...item }
    : { mes: '', analisis: '', acciones: '', responsable: '', fecha_compromiso: '', seguimiento: '' }
  modalAnalisis.value = true
}

const cerrarModalAnalisis = () => {
  modalAnalisis.value = false
  analisisEditando.value = null
}

const guardarAnalisis = () => {
  const f = formAnalisis.value
  if (!f.mes || !f.analisis || !f.acciones || !f.responsable || !f.fecha_compromiso) return
  if (analisisEditando.value) {
    const idx = analisisList.value.findIndex(a => a.mes === analisisEditando.value.mes)
    if (idx !== -1) analisisList.value[idx] = { ...f }
  } else {
    const idx = analisisList.value.findIndex(a => a.mes === f.mes)
    if (idx !== -1) analisisList.value[idx] = { ...f }
    else analisisList.value.push({ ...f })
  }
  cerrarModalAnalisis()
}
</script>

<style scoped>
.indicators {
  padding: 0;
  background: transparent;
  box-sizing: border-box;
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

/* ── Info table ── */
.info-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.78rem;
  overflow-x: auto;
  display: block;
}
.info-table th {
  background-color: #038581;
  color: white;
  padding: 10px 8px;
  text-align: center;
  font-weight: 600;
  border: 1px solid #026b67;
  font-size: 0.75rem;
  line-height: 1.3;
}
.info-table td {
  padding: 10px 8px;
  border: 1px solid #e2e6ea;
  text-align: center;
  color: var(--gtic-text-main);
}
.indicator-name { text-align: left; font-size: 0.78rem; line-height: 1.4; }
.formula        { font-size: 0.78rem; text-align: left; font-style: italic; }
.meta-adecuado  { background: #e6f7f2; color: #14866d; font-weight: 600; }
.estado-aceptable  { background: #fff4e3; color: #d68c23; font-weight: 600; }
.estado-inaceptable { background: #fde2e2; color: #d64545; font-weight: 600; }

/* ── Grid ── */
.indicadores-grid {
  display: grid;
  grid-template-columns: 2fr 1.1fr;
  gap: 24px;
  align-items: flex-start;
  margin-bottom: 18px;
}
.indicadores-col-table    { min-width: 0; }
.indicadores-col-graficas { display: flex; flex-direction: column; gap: 18px; min-width: 0; }

/* ── Results table ── */
.results-table-wrapper { overflow-x: auto; }
.results-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.78rem;
  min-width: 900px;
  border: 1px solid #b4c6e7;
  box-shadow: 0 2px 8px rgba(19, 41, 64, 0.04);
}
.results-table thead th {
  background: #038581;
  color: #fff;
  padding: 8px 10px;
  text-align: center;
  font-weight: 600;
  border: 1px solid #026b67;
  font-size: 0.75rem;
  line-height: 1.4;
  white-space: normal;
  vertical-align: middle;
}
.results-table .col-mes  { width: 80px; min-width: 70px; }
.results-table .col-num  { width: 130px; min-width: 110px; }
.results-table .col-pct  { width: 120px; min-width: 100px; }
.results-table .col-meta { width: 65px;  min-width: 55px; }
.results-table tbody td {
  padding: 4px 6px;
  border: 1px solid #dde3ef;
  text-align: center;
  color: #038581;
  background: #f7f9fb;
}
.results-table tbody tr:nth-child(even) td { background: #f4f8fc; }
.mes-name {
  background: #f7f9fb !important;
  color: #038581 !important;
  font-weight: 700 !important;
  text-align: left;
  padding-left: 14px !important;
  border-left: 4px solid #038581;
}
.total-row td { font-weight: 700; background: #f7f9fb !important; color: #038581 !important; }
.celda-formula { color: #9ca3af !important; font-style: italic; }

/* ── Analysis table ── */
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
.analisis-subtitle { font-weight: 400; font-size: 0.98rem; color: #4b5563; margin-top: 2px; }
.analisis-header-row { background: #038581; color: #fff; }
.analisis-th {
  text-align: center;
  vertical-align: middle;
  font-size: 0.78rem;
  padding: 12px 8px;
  border: 1px solid #026b67;
  font-weight: 600;
}
.analisis-th-mes        { min-width: 90px; }
.analisis-th-analisis   { min-width: 220px; }
.analisis-th-acciones   { min-width: 180px; }
.analisis-th-responsable{ min-width: 140px; }
.analisis-th-fecha      { min-width: 120px; }
.analisis-th-seguimiento{ min-width: 120px; }
.analisis-th-title {
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.analisis-td {
  text-align: left;
  padding: 8px 10px !important;
  font-size: 0.78rem;
  color: #374151;
  line-height: 1.4;
  border: 1px solid #dde3ef;
}
.analisis-td-mes {
  text-align: center;
  font-weight: 600;
  background: #f7f9fb !important;
  color: #038581;
}
.analisis-td-fecha   { text-align: center; }
.analisis-td-actions { text-align: center; background: #f9fafb !important; padding: 6px !important; }

/* Info icon */
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
  cursor: help;
  user-select: none;
  transition: background 0.2s;
  flex-shrink: 0;
}
.info-icon:hover { background: #22396a; }

/* Botones */
.btn-agregar-analisis {
  background: #038581;
  color: #fff;
  border: none;
  border-radius: 22px;
  padding: 7px 22px 7px 18px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.18s;
}
.btn-agregar-analisis:hover { background: #026b67; }

.btn-editar-analisis {
  background: #038581;
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
.btn-editar-analisis:hover { background: #4178b8; transform: translateY(-1px); }

/* Chart */
.simple-bar-chart-outer {
  background: var(--gtic-surface);
  border-radius: 10px;
  border: 1px solid #e2e6ea;
  box-shadow: 0 8px 18px rgba(19, 41, 64, 0.06);
  overflow-x: auto;
  padding-bottom: 30px;
}
.simple-bar-chart-scroll { width: 100%; }
.simple-bar-chart.compact { min-width: 0; width: 100%; max-width: 100%; margin: 0 auto; box-sizing: border-box; }
.simple-bar-chart__header { padding: 16px 18px 0; }
.simple-bar-chart__header h2 { margin: 0 0 12px 0; }
.simple-bar-chart__body {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px;
  align-items: stretch;
  padding: 0 18px;
  min-height: 180px;
}
.simple-axis-y {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  font-size: 0.68rem;
  color: var(--gtic-text-muted);
  padding-right: 4px;
  padding-bottom: 18px;
  padding-top: 4px;
}
.simple-bars-area {
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 16px;
  height: 180px;
  padding: 0 8px 20px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #e2e6ea;
  overflow: visible;
}
.simple-bar-group {
  position: relative;
  display: flex;
  gap: 4px;
  align-items: flex-end;
  justify-content: center;
}
.simple-bar {
  min-height: 2px;
  border-radius: 4px 4px 0 0;
  transition: height 0.4s ease;
}
.simple-bar-total   { background: #1e3a8a; }
.simple-bar-oportuno{ background: #60a5fa; }
.simple-bar-label {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.65rem;
  color: #4b5563;
  white-space: nowrap;
}
.simple-legend-bottom {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
  margin: 8px 18px 0;
  font-size: 0.78rem;
  color: #4b5563;
}
.legend-item { display: flex; align-items: center; gap: 6px; }
.legend-bar {
  display: inline-block;
  width: 14px;
  height: 12px;
  border-radius: 2px;
}
.legend-bar-total   { background: #1e3a8a; }
.legend-bar-oportuno{ background: #60a5fa; }

/* Status donut */
.indicador-torta-card {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(19, 41, 64, 0.07);
  border: 1px solid #e2e6ea;
  padding: 22px 18px 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.indicador-torta-card h3 { font-size: 1.08rem; font-weight: 700; color: #22396a; margin: 0 0 4px; text-align: center; }
.indicador-torta-desc   { font-size: 0.92rem; color: #6b7280; margin-bottom: 12px; text-align: center; }
.indicador-torta-flex   { display: flex; align-items: center; gap: 18px; }
.indicador-torta-estado { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; }
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
.indicador-torta-estado-badge.inaceptable { background: #ef4444; }
.indicador-torta-estado-badge.aceptable   { background: #f59e42; }
.indicador-torta-estado-badge.adecuado    { background: #22c55e; }
.indicador-torta-leyenda    { list-style: none; padding: 0; margin: 0; font-size: 0.92rem; color: #22396a; }
.indicador-torta-leyenda li { display: flex; align-items: center; gap: 7px; margin-bottom: 2px; }
.indicador-torta-dot { display: inline-block; width: 13px; height: 13px; border-radius: 50%; }
.indicador-torta-dot.adecuado   { background: #22c55e; }
.indicador-torta-dot.aceptable  { background: #f59e42; }
.indicador-torta-dot.inaceptable{ background: #ef4444; }

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: auto;
}
.modal-content-wide { max-width: 750px; }
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}
.modal-header h3 { margin: 0; font-size: 1.1rem; color: #333; }
.btn-close {
  background: none;
  border: none;
  font-size: 1.3rem;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px; height: 30px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 4px;
  transition: background 0.2s;
}
.btn-close:hover { background: #f0f0f0; }
.modal-body { padding: 20px; }
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
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
.btn-cancelar { background: #e5e7eb; color: #374151; }
.btn-cancelar:hover { background: #d1d5db; }
.btn-guardar  { background: #2e4360; color: white; }
.btn-guardar:hover { background: #22396a; }

.form-analisis { display: flex; flex-direction: column; gap: 16px; }
.form-row      { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-group    { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 0.88rem; font-weight: 600; color: #22396a; }
.form-select,
.form-input,
.form-textarea {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-family: inherit;
  font-size: 0.88rem;
  color: #374151;
  transition: border-color 0.2s;
}
.form-select:focus,
.form-input:focus,
.form-textarea:focus { outline: none; border-color: #5b9bd5; }
.form-select:disabled { background: #f3f4f6; cursor: not-allowed; color: #9ca3af; }
.form-textarea { resize: vertical; min-height: 90px; line-height: 1.5; }
</style>
