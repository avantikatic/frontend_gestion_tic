<template>
  <div class="app">
    <header class="topbar">
      <div class="brand">
        <div class="logo logo-av">ATK</div>
        <div class="title">
          <h1>Gestión de Seguridad y Continuidad TIC</h1>
          <p>Macroproceso TIC</p>
        </div>
      </div>

      <!-- <div class="legend-badges">
        <div class="badge badge-red">
          <span class="badge-dot"></span>
          <span class="badge-text">SEG</span>
        </div>
        <div class="badge badge-blue">
          <span class="badge-dot"></span>
          <span class="badge-text">DISP</span>
        </div>
        <div class="badge badge-green">
          <span class="badge-dot"></span>
          <span class="badge-text">MNT</span>
        </div>
        <div class="badge badge-orange">
          <span class="badge-dot"></span>
          <span class="badge-text">DR</span>
        </div>
      </div> -->
    </header>

    <!-- KPI Cards -->
    <section class="kpi-section">
      <div class="kpi-cards">
        <div class="kpi-card">
          <div class="kpi-label">Total</div>
          <div class="kpi-value">{{ kpiTotal }}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Abiertos</div>
          <div class="kpi-value">{{ kpiAbiertos }}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Mitigados</div>
          <div class="kpi-value">{{ kpiMitigados }}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Cerrados</div>
          <div class="kpi-value">{{ kpiCerrados }}</div>
        </div>
      </div>
      <div class="module-info">
        <div class="module-label">Módulo actual</div>
        <div class="module-name">{{ moduloNombre }}</div>
      </div>
    </section>

    <main class="content">
      <!-- Panel Izquierdo: Módulos -->
      <aside class="left-panel">
        <div class="panel-header">
          <h3>Módulos</h3>
          <p class="panel-subtitle">Selecciona el tipo de registro</p>
        </div>

        <div class="modules-list">
          <div 
            v-for="modulo in modulosGSC" 
            :key="modulo.id" 
            class="module-item" 
            :class="{ active: moduloSeleccionado === modulo.codigo }" 
            @click="setModulo(modulo.codigo)"
          >
            <span class="module-dot" :class="modulo.color_clase"></span>
            <div class="module-info-text">
              <div class="module-title">{{ modulo.nombre }}</div>
              <div class="module-desc">{{ modulo.descripcion }}</div>
            </div>
          </div>
        </div>

        <!-- <div class="panel-actions">
          <button class="btn-export" @click="exportarJSON">Exportar JSON</button>
          <button class="btn-clear" @click="limpiarTodo">Limpiar todo</button>
        </div> -->

        <div class="panel-tip">
          <strong>Tip:</strong> guarda evidencias (ticket/correo/alerta/captura) y controla el estado del caso.
        </div>
      </aside>

      <!-- Panel Derecho: Tabla -->
      <section class="right-panel">
        <div class="panel-header-main">
          <div>
            <h3>{{ moduloNombre }}</h3>
            <p class="panel-subtitle">{{ moduloDescripcion }}</p>
          </div>
          <button class="btn-nuevo" @click="crearRegistro(moduloSeleccionado)">+ Nuevo registro</button>
        </div>

        <div class="filters-section">
          <div class="search-bar">
            <input 
              v-model="q" 
              class="search-input" 
              placeholder="Buscar (ID, resumen, evidencias, sistemas afectados)..."
            />
          </div>

          <div class="filter-tabs">
            <button class="filter-tab" :class="{ active: filtroEstado === 'ALL' }" @click="filtroEstado='ALL'">Todos</button>
            <button class="filter-tab" :class="{ active: filtroEstado === 'ABI' }" @click="filtroEstado='ABI'">Abierto</button>
            <button class="filter-tab" :class="{ active: filtroEstado === 'ANA' }" @click="filtroEstado='ANA'">En análisis</button>
            <button class="filter-tab" :class="{ active: filtroEstado === 'MIT' }" @click="filtroEstado='MIT'">Mitigado</button>
            <button class="filter-tab" :class="{ active: filtroEstado === 'CER' }" @click="filtroEstado='CER'">Cerrado</button>
            <!-- <button class="filter-tab" :class="{ active: filtroEstado === 'SLA' }" @click="filtroEstado='SLA'">SLA afectado</button> -->
          </div>

          <div class="filter-secondary">
            <button class="filter-chip" :class="{ active: filtroEstado === 'EVI' }" @click="filtroEstado='EVI'">Con evidencias</button>
            <button class="filter-chip" :class="{ active: filtroEstado === 'PEN' }" @click="filtroEstado='PEN'">Pendiente evidencias</button>
            <div class="pagination-selector">
              <span>Por página</span>
              <select class="select-pagination" v-model.number="pageSize">
                <option :value="5">5</option>
                <option :value="10">10</option>
                <option :value="20">20</option>
                <option :value="50">50</option>
              </select>
            </div>
          </div>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th class="col-id">ID</th>
                <th class="col-fecha">Fecha</th>
                <th class="col-resumen">Resumen</th>
                <th class="col-estado">Estado</th>
                <th class="col-accion">Acción</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in pageRows" :key="r.id">
                <td class="col-id">
                  <div class="idbox">{{ r.id }}</div>
                </td>
                <td class="col-fecha">
                  <div class="nowrap">{{ fechaResumen(r) }}</div>
                </td>
                <td class="col-resumen">
                  <div class="resumen">{{ resumenRegistro(r) }}</div>
                  <div class="meta" v-if="(r.afectaSistemas && r.afectaSistemas.length) || r.notificarGerencia">
                    <span v-if="r.notificarGerencia" class="miniTag">Notificar gerencia</span>
                    <span v-for="s in (r.afectaSistemas || []).slice(0,3)" :key="s" class="miniTag">{{ s }}</span>
                    <span v-if="(r.afectaSistemas || []).length > 3" class="miniTag">+{{ (r.afectaSistemas || []).length - 3 }}</span>
                  </div>
                </td>
                <td class="col-estado">
                  <div class="stacks">
                    <span class="status" :class="estadoFlujoClass(r)">{{ r.estado || "Abierto" }}</span>
                    <span class="status mini" :class="evidenciaClass(r)">{{ evidenciaTexto(r) }}</span>
                    <span v-if="r.modulo==='DISP' && r.slaAfectado" class="status mini bad">SLA afectado</span>
                  </div>
                </td>
                <td class="col-accion">
                  <button class="link" @click="editarRegistro(r.id)">Editar</button>
                </td>
              </tr>
              <tr v-if="pageRows.length === 0">
                <td colspan="5" class="no-data">No hay registros con estos filtros.</td>
              </tr>
            </tbody>
          </table>

          <div class="pagination" v-if="totalPages > 1">
            <button class="pagination-btn" :disabled="page===1" @click="page=1">«</button>
            <button class="pagination-btn" :disabled="page===1" @click="page--">‹</button>
            <div class="pinfo">
              Página <b>{{ page }}</b> de <b>{{ totalPages }}</b>
              <span class="muted">({{ filteredRows.length }} registros)</span>
            </div>
            <button class="pagination-btn" :disabled="page===totalPages" @click="page++">›</button>
            <button class="pagination-btn" :disabled="page===totalPages" @click="page=totalPages">»</button>
          </div>
        </div>
      </section>
    </main>

    <!-- Modal Rediseñado -->
    <div v-if="modalAbierta" class="modal-overlay" @click.self="cerrarModal">
      <div class="modal-container">
        <!-- Header -->
        <div class="modal-header">
          <div class="modal-header-left">
            <span class="modal-badge" :class="chipClass">{{ draft.modulo }}</span>
            <div class="modal-title-group">
              <h2 class="modal-title">{{ modoModal === 'editar' ? 'Editar registro' : 'Nuevo registro' }}</h2>
              <p class="modal-subtitle">
                ID: <strong>{{ draft.id }}</strong> • {{ humanDate(draft.actualizadoEn || draft.creadoEn) }}
              </p>
            </div>
          </div>
          <!-- <div class="modal-header-right">
            <button class="modal-btn modal-btn-cancel" @click="cerrarModal">Cancelar</button>
            <button class="modal-btn modal-btn-save" @click="onGuardar">Guardar</button>
          </div> -->
        </div>

        <!-- Body -->
        <div class="modal-body">
          <!-- COMÚN -->
          <div class="modal-section">
            <div class="modal-section-header">
              <h3 class="modal-section-title">Información Común</h3>
              <p class="modal-section-desc">Estado · Afecta · Notificación</p>
            </div>
            <div class="modal-grid">
              <div class="modal-field">
                <label class="modal-label">Estado</label>
                <select class="modal-input" v-model="draft.estado">
                  <option v-for="estado in estadosGSC" :key="estado.id" :value="estado.nombre">
                    {{ estado.nombre }}
                  </option>
                </select>
              </div>
              <div class="modal-field">
                <label class="modal-label">Notificar a Gerencia</label>
                <label class="modal-checkbox">
                  <input type="checkbox" v-model="draft.notificarGerencia" />
                  <span>SI/NO</span>
                </label>
              </div>
              <div class="modal-field">
                <label class="modal-label">Evidencia disponible</label>
                <label class="modal-checkbox">
                  <input type="checkbox" v-model="draft.evidencia" />
                  <span>SI si existe soporte verificable</span>
                </label>
              </div>
              <div class="modal-field modal-field-full">
                <label class="modal-label">Sistemas Afectados</label>
                <div class="modal-checkbox-group">
                  <label class="modal-checkbox-item" v-for="sistema in sistemasAfectados" :key="sistema.id">
                    <input type="checkbox" :value="sistema.nombre" v-model="draft.afectaSistemas" />
                    <span>{{ sistema.nombre }}</span>
                  </label>
                </div>
                <p class="modal-field-hint">Marca los sistemas impactados. Si no aplica, deja en blanco.</p>
              </div>
              <div class="modal-field modal-field-full">
                <label class="modal-label">Historial de estado</label>
                <div class="modal-hitos">
                  <div class="modal-hito">
                    <span class="modal-hito-pill">Abierto</span>
                    <span class="modal-hito-val">{{ draft.hitosEstado?.abiertoEn ? humanDate(draft.hitosEstado.abiertoEn) : "—" }}</span>
                  </div>
                  <div class="modal-hito">
                    <span class="modal-hito-pill">Mitigado</span>
                    <span class="modal-hito-val">{{ draft.hitosEstado?.mitigadoEn ? humanDate(draft.hitosEstado.mitigadoEn) : "—" }}</span>
                  </div>
                  <div class="modal-hito">
                    <span class="modal-hito-pill">Cerrado</span>
                    <span class="modal-hito-val">{{ draft.hitosEstado?.cerradoEn ? humanDate(draft.hitosEstado.cerradoEn) : "—" }}</span>
                  </div>
                </div>
                <p class="modal-field-hint">Aún no hay cambios registrados. Se guardará automáticamente cuando cambies el estado.</p>
              </div>
            </div>
          </div>

          <!-- EVIDENCIAS -->
          <div class="modal-section">
            <div class="modal-section-header">
              <div>
                <h3 class="modal-section-title">Evidencias</h3>
                <p class="modal-section-desc">Agrega evidencias verificables (ticket, correo, alertas, capturas)</p>
              </div>
              <button class="modal-btn modal-btn-add" @click="addEvidencia">+ Agregar evidencia</button>
            </div>
            <div v-if="!draft.evidencias || draft.evidencias.length===0" class="modal-empty">
              No hay evidencias cargadas. Puedes agregar ticket, correo, alerta o captura.
            </div>
            <div v-else class="modal-evidencias-list">
              <div v-for="(ev, idx) in draft.evidencias" :key="ev.uid" class="modal-evidencia-card">
                <div class="modal-evidencia-header">
                  <div class="modal-evidencia-title">
                    <strong>Evidencia #{{ idx + 1 }}</strong>
                    <span class="modal-evidencia-tag">{{ ev.tipo }}</span>
                  </div>
                  <button class="modal-btn modal-btn-delete" @click="removeEvidencia(idx)">Eliminar</button>
                </div>
                <div class="modal-grid">
                  <div class="modal-field">
                    <label class="modal-label">Tipo</label>
                    <select class="modal-input" v-model="ev.tipo">
                      <option>Ticket</option>
                      <option>Correo</option>
                      <option>Alerta (Plataforma)</option>
                      <option>Captura</option>
                      <option>Otro</option>
                    </select>
                  </div>
                  <div class="modal-field modal-field-span2">
                    <label class="modal-label">Observación</label>
                    <textarea class="modal-input modal-textarea" rows="2" v-model="ev.observacion" placeholder="Describe la evidencia..."></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- MÓDULO SEG -->
          <div class="modal-section" v-if="draft.modulo==='SEG'">
            <div class="modal-section-header">
              <h3 class="modal-section-title">SEG – Seguridad</h3>
              <p class="modal-section-desc">Campos específicos del módulo</p>
            </div>
            <div class="modal-grid">
              <div class="modal-field">
                <label class="modal-label">Fecha / hora</label>
                <input class="modal-input" type="datetime-local" v-model="draft.fechaHora" />
              </div>
              <div class="modal-field">
                <label class="modal-label">Fuente</label>
                <select class="modal-input" v-model="draft.fuente">
                  <option>Fortinet</option>
                  <option>Kaspersky</option>
                  <option>Microsoft 365</option>
                  <option>Usuario</option>
                  <option>Otro</option>
                </select>
              </div>
              <div class="modal-field">
                <label class="modal-label">Impacto</label>
                <select class="modal-input" v-model="draft.impacto">
                  <option>Alto</option><option>Medio</option><option>Bajo</option>
                </select>
              </div>
              <div class="modal-field modal-field-full">
                <label class="modal-label">Tipo</label>
                <input class="modal-input" v-model="draft.tipo" placeholder="Ej: Phishing, Malware, URL bloqueada..." />
              </div>
              <div class="modal-field modal-field-full">
                <label class="modal-label">Descripción</label>
                <textarea class="modal-input modal-textarea" rows="3" v-model="draft.descripcion" placeholder="Qué pasó, alcance, sistemas afectados..."></textarea>
              </div>
              <div class="modal-field modal-field-full">
                <label class="modal-label">Responsable TIC</label>
                <input class="modal-input" v-model="draft.responsableTIC" placeholder="Ej: Coordinador TIC / Profesional TIC / Auxiliar TIC" />
              </div>
            </div>
          </div>

          <!-- MÓDULO DISP -->
          <div class="modal-section" v-if="draft.modulo==='DISP'">
            <div class="modal-section-header">
              <h3 class="modal-section-title">DISP – Disponibilidad</h3>
              <p class="modal-section-desc">Campos específicos del módulo</p>
            </div>
            <div class="modal-grid">
              <div class="modal-field modal-field-span2">
                <label class="modal-label">Servicio afectado</label>
                <input class="modal-input" v-model="draft.servicioAfectado" placeholder="Ej: DMS, SQL, Internet, Issabel..." />
              </div>
              <div class="modal-field">
                <label class="modal-label">Tiempo indisponible (min)</label>
                <input class="modal-input" type="number" min="0" step="1" v-model.number="draft.tiempoIndisponibleMin" />
              </div>
              <div class="modal-field modal-field-span2">
                <label class="modal-label">Tipo de evento</label>
                <input class="modal-input" v-model="draft.tipoEvento" placeholder="Ej: caída, intermitencia, degradación" />
              </div>
              <div class="modal-field">
                <label class="modal-label">SLA afectado</label>
                <label class="modal-checkbox">
                  <input type="checkbox" v-model="draft.slaAfectado" />
                  <span>SI/NO</span>
                </label>
              </div>
              <div class="modal-field modal-field-full">
                <label class="modal-label">Acciones</label>
                <textarea class="modal-input modal-textarea" rows="3" v-model="draft.acciones" placeholder="Acciones correctivas/preventivas..."></textarea>
              </div>
            </div>
          </div>

          <!-- MÓDULO MNT -->
          <div class="modal-section" v-if="draft.modulo==='MNT'">
            <div class="modal-section-header">
              <h3 class="modal-section-title">MNT – Mantenimientos</h3>
              <p class="modal-section-desc">Rango de fechas y configuración</p>
            </div>
            <div class="modal-grid">
              <div class="modal-field">
                <label class="modal-label">Área</label>
                <input class="modal-input" v-model="draft.area" placeholder="Ej: cuarto sistemas, nube, red..." />
              </div>
              <div class="modal-field modal-field-span2">
                <label class="modal-label">Tipo</label>
                <input class="modal-input" v-model="draft.tipo" placeholder="Ej: parchado, upgrade firmware..." />
              </div>
              <div class="modal-field">
                <label class="modal-label">Fecha inicio</label>
                <input class="modal-input" type="datetime-local" v-model="draft.fechaInicio" />
              </div>
              <div class="modal-field">
                <label class="modal-label">Fecha fin</label>
                <input class="modal-input" type="datetime-local" v-model="draft.fechaFin" />
              </div>
              <div class="modal-field">
                <label class="modal-label">Riesgo</label>
                <select class="modal-input" v-model="draft.riesgo">
                  <option>Alto</option><option>Medio</option><option>Bajo</option>
                </select>
              </div>
              <div class="modal-field modal-field-full">
                <label class="modal-label">Requiere parada</label>
                <label class="modal-checkbox">
                  <input type="checkbox" v-model="draft.requiereParada" />
                  <span>SI/NO</span>
                </label>
              </div>
            </div>
          </div>

          <!-- MÓDULO DR -->
          <div class="modal-section" v-if="draft.modulo==='DR'">
            <div class="modal-section-header">
              <h3 class="modal-section-title">DR – Simulacros</h3>
              <p class="modal-section-desc">Rango de fechas y evaluación</p>
            </div>
            <div class="modal-grid">
              <div class="modal-field modal-field-full">
                <label class="modal-label">Escenario</label>
                <input class="modal-input" v-model="draft.escenario" placeholder="Ej: caída SQL, ransomware, pérdida energía..." />
              </div>
              <div class="modal-field">
                <label class="modal-label">Fecha inicio</label>
                <input class="modal-input" type="datetime-local" v-model="draft.fechaInicio" />
              </div>
              <div class="modal-field">
                <label class="modal-label">Fecha fin</label>
                <input class="modal-input" type="datetime-local" v-model="draft.fechaFin" />
              </div>
              <div class="modal-field"></div>
              <div class="modal-field modal-field-full">
                <label class="modal-label">Objetivo</label>
                <textarea class="modal-input modal-textarea" rows="2" v-model="draft.objetivo" placeholder="Qué se busca validar (RTO/RPO/procedimientos)."></textarea>
              </div>
              <div class="modal-field modal-field-full">
                <label class="modal-label">Resultado</label>
                <textarea class="modal-input modal-textarea" rows="2" v-model="draft.resultado" placeholder="Qué ocurrió y si se cumplió."></textarea>
              </div>
              <div class="modal-field modal-field-full">
                <label class="modal-label">Hallazgos</label>
                <textarea class="modal-input modal-textarea" rows="2" v-model="draft.hallazgos" placeholder="Gaps, fallas, puntos críticos."></textarea>
              </div>
              <div class="modal-field modal-field-full">
                <label class="modal-label">Lecciones aprendidas</label>
                <textarea class="modal-input modal-textarea" rows="2" v-model="draft.leccionesAprendidas" placeholder="Acciones de mejora y próximos pasos."></textarea>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <div class="modal-footer-left">
            <button v-if="modoModal==='editar'" class="modal-btn modal-btn-delete" @click="eliminarRegistro(draft.id)">Eliminar</button>
          </div>
          <div class="modal-footer-right">
            <button class="modal-btn modal-btn-cancel" @click="cerrarModal">Cancelar</button>
            <button class="modal-btn modal-btn-save" @click="onGuardar">Guardar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, reactive, onMounted } from 'vue';
import axios from 'axios';
import apiUrl from "../../config.js";

const LS_KEY = "avantika_gestion_continuidad_tic_v2";

// Variables reactivas para datos desde BD
const estadosGSC = ref([]);
const sistemasAfectados = ref([]);
const modulosGSC = ref([]);

// Funciones para obtener datos desde la API
const obtenerEstadosGSC = async () => {
  try {
    const response = await axios.post(
      `${apiUrl}/gestion-continuidad/obtener_estados_gsc`, 
      {},
      {
        headers: {
          Accept: "application/json",
        }
      }
    );
    if (response.status === 200) {
      estadosGSC.value = response.data.data || [];
    }
  } catch (error) {
    console.error('Error al obtener estados GSC:', error);
  }
};

const obtenerSistemasAfectados = async () => {
  try {
    const response = await axios.post(
      `${apiUrl}/gestion-continuidad/obtener_sistemas_afectados_gsc`, 
      {},
      {
        headers: {
          Accept: "application/json",
        }
      }
    );
    if (response.status === 200) {
      sistemasAfectados.value = response.data.data || [];
    }
  } catch (error) {
    console.error('Error al obtener sistemas afectados GSC:', error);
  }
};

const obtenerModulosGSC = async () => {
  try {
    const response = await axios.post(
      `${apiUrl}/gestion-continuidad/obtener_modulos_gsc`, 
      {},
      {
        headers: {
          Accept: "application/json",
        }
      }
    );
    if (response.status === 200) {
      modulosGSC.value = response.data.data || [];
      // Seleccionar el primer módulo automáticamente
      if (modulosGSC.value.length > 0) {
        moduloSeleccionado.value = modulosGSC.value[0].codigo;
      }
    }
  } catch (error) {
    console.error('Error al obtener módulos GSC:', error);
  }
};

// Cargar datos al montar el componente
onMounted(async () => {
  await obtenerEstadosGSC();
  await obtenerSistemasAfectados();
  await obtenerModulosGSC();
});

const SISTEMAS_CRITICOS = [
  "DMS (ERP)",
  "Salesforce (CRM)",
  "Open Comex",
  "GOSEM",
  "Weru",
  "Microsoft 365",
  "Planta Telefónica Issabel",
  "Internet"
];

// Utilidades
function uid() {
  return ("R-" + Math.random().toString(16).slice(2) + "-" + Date.now().toString(16)).toUpperCase();
}
function uidMini() {
  return ("E-" + Math.random().toString(16).slice(2) + "-" + Date.now().toString(16)).toUpperCase();
}
function nowLocalDatetime() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { registros: [] };
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.registros)) return { registros: [] };
    return { registros: parsed.registros };
  } catch {
    return { registros: [] };
  }
}
function saveState(state) {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

// Estado
const registros = ref(loadState().registros);

watch(
  registros,
  (val) => saveState({ registros: val }),
  { deep: true }
);

// UI state
const moduloSeleccionado = ref("");
const modalAbierta = ref(false);
const modoModal = ref("crear");
const draft = reactive({});

// filtros
const q = ref("");
const filtroEstado = ref("ALL");
const page = ref(1);
const pageSize = ref(10);

watch([moduloSeleccionado, q, filtroEstado, pageSize], () => {
  page.value = 1;
});

function setModulo(m) {
  moduloSeleccionado.value = m;
}

const moduloNombre = computed(() => {
  const modulo = modulosGSC.value.find(m => m.codigo === moduloSeleccionado.value);
  return modulo ? `${modulo.nombre} (${modulo.codigo})` : "";
});

const moduloDescripcion = computed(() => {
  const modulo = modulosGSC.value.find(m => m.codigo === moduloSeleccionado.value);
  return modulo ? `Registra ${modulo.descripcion}` : "";
});

// KPIs
function estadoCode(st) {
  const s = (st || "Abierto").toLowerCase();
  if (s.includes("abier")) return "ABI";
  if (s.includes("anál") || s.includes("anal")) return "ANA";
  if (s.includes("mit")) return "MIT";
  if (s.includes("cerr")) return "CER";
  return "ABI";
}

const kpiTotal = computed(() => registros.value.length);
const kpiAbiertos = computed(() => registros.value.filter(r => estadoCode(r?.estado) === "ABI").length);
const kpiMitigados = computed(() => registros.value.filter(r => estadoCode(r?.estado) === "MIT").length);
const kpiCerrados = computed(() => registros.value.filter(r => estadoCode(r?.estado) === "CER").length);

// Normalización
function normalizeRecord(r) {
  const x = { ...r };
  if (!x.estado) x.estado = "Abierto";
  if (x.notificarGerencia === undefined) x.notificarGerencia = false;
  if (!Array.isArray(x.evidencias)) x.evidencias = [];
  if (!Array.isArray(x.afectaSistemas)) x.afectaSistemas = [];
  if (x.evidencia === undefined) x.evidencia = false;
  return x;
}

// Crear registro
function crearRegistro(modulo) {
  const base = normalizeRecord({
    id: uid(),
    modulo,
    creadoEn: new Date().toISOString(),
    actualizadoEn: new Date().toISOString(),
    evidencia: false,
    evidencias: [],
    afectaSistemas: [],
    notificarGerencia: false,
    estado: "Abierto",
  });

  let borrador = null;

  if (modulo === "SEG") {
    borrador = {
      ...base,
      fechaHora: nowLocalDatetime(),
      fuente: "Fortinet",
      tipo: "",
      impacto: "Medio",
      descripcion: "",
      responsableTIC: "",
    };
  } else if (modulo === "DISP") {
    borrador = {
      ...base,
      servicioAfectado: "",
      tipoEvento: "",
      tiempoIndisponibleMin: 0,
      slaAfectado: false,
      acciones: "",
    };
  } else if (modulo === "MNT") {
    const now = nowLocalDatetime();
    borrador = {
      ...base,
      area: "",
      tipo: "",
      fechaInicio: now,
      fechaFin: now,
      requiereParada: false,
      riesgo: "Bajo",
    };
  } else {
    const now = nowLocalDatetime();
    borrador = {
      ...base,
      escenario: "",
      fechaInicio: now,
      fechaFin: now,
      objetivo: "",
      resultado: "",
      hallazgos: "",
      leccionesAprendidas: "",
    };
  }

  modoModal.value = "crear";
  Object.keys(draft).forEach(k => delete draft[k]);
  Object.assign(draft, borrador);
  modalAbierta.value = true;
}

function editarRegistro(id) {
  const found = registros.value.find(r => r.id === id);
  if (!found) return;
  modoModal.value = "editar";
  Object.keys(draft).forEach(k => delete draft[k]);
  Object.assign(draft, JSON.parse(JSON.stringify(normalizeRecord(found))));
  modalAbierta.value = true;
}

function cerrarModal() {
  modalAbierta.value = false;
}

function onGuardar() {
  if (!draft.estado) draft.estado = "Abierto";

  if (draft.modulo === "SEG") {
    if (!draft.fechaHora) return alert("En SEG la fecha/hora es obligatoria.");
  }

  if (draft.modulo === "MNT" || draft.modulo === "DR") {
    const a = new Date(draft.fechaInicio);
    const b = new Date(draft.fechaFin);
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) {
      return alert("En MNT/DR el rango de fechas es obligatorio.");
    }
    if (b.getTime() < a.getTime()) {
      return alert("La fecha fin debe ser posterior o igual a la fecha inicio.");
    }
  }

  const copy = normalizeRecord({ ...draft, actualizadoEn: new Date().toISOString() });
  const idx = registros.value.findIndex(r => r.id === copy.id);
  if (idx === -1) registros.value.unshift(copy);
  else registros.value.splice(idx, 1, copy);
  cerrarModal();
}

function eliminarRegistro(id) {
  if (!confirm("¿Seguro que deseas eliminar este registro?")) return;
  registros.value = registros.value.filter(r => r.id !== id);
  cerrarModal();
}

function exportarJSON() {
  const payload = { registros: registros.value, exportadoEn: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "gestion_continuidad_tic.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function limpiarTodo() {
  if (!confirm("¿Seguro que deseas eliminar TODOS los registros?")) return;
  registros.value = [];
  cerrarModal();
  localStorage.removeItem(LS_KEY);
}

// Helpers tabla
function fechaResumen(r) {
  const pick = (v) => (v ? String(v).replace("T", " ") : "");
  if (r.modulo === "SEG") return pick(r.fechaHora) || "—";
  if (r.modulo === "MNT" || r.modulo === "DR") {
    const a = pick(r.fechaInicio);
    const b = pick(r.fechaFin);
    return a && b ? `${a} → ${b}` : "—";
  }
  const d = new Date(r.actualizadoEn || r.creadoEn || 0);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

function resumenRegistro(r) {
  if (r.modulo === "SEG") return `${r.fuente || "—"} · ${r.tipo || "—"} · ${r.descripcion || "—"}`.trim();
  if (r.modulo === "DISP") return `${r.servicioAfectado || "—"} · ${r.tipoEvento || "—"} · ${r.acciones || "—"}`.trim();
  if (r.modulo === "MNT") return `${r.area || "—"} · ${r.tipo || "—"} · Riesgo: ${r.riesgo || "—"}`.trim();
  return `${r.escenario || "—"} · ${r.resultado || "—"}`.trim();
}

function evidenciaTexto(r) {
  const n = Array.isArray(r.evidencias) ? r.evidencias.length : 0;
  if (n > 0) return `Evidencias: ${n}`;
  return r.evidencia ? "Evidencia marcada" : "Pendiente evidencias";
}

function evidenciaClass(r) {
  const n = Array.isArray(r.evidencias) ? r.evidencias.length : 0;
  if (n > 0) return "ok";
  return "warn";
}

function estadoFlujoClass(r) {
  const st = (r.estado || "Abierto").toLowerCase();
  if (st.includes("cerr")) return "ok";
  if (st.includes("mit")) return "ok";
  if (st.includes("anál") || st.includes("anal")) return "warn";
  return "warn";
}

function haystack(r) {
  const parts = [];
  parts.push(r.id || "", r.modulo || "", r.estado || "");
  parts.push((r.afectaSistemas || []).join(" "));
  parts.push(r.notificarGerencia ? "notificar gerencia" : "");
  if (r.modulo === "SEG") parts.push(r.fuente || "", r.tipo || "", r.descripcion || "", r.responsableTIC || "");
  if (r.modulo === "DISP") parts.push(r.servicioAfectado || "", r.tipoEvento || "", r.acciones || "");
  if (r.modulo === "MNT") parts.push(r.area || "", r.tipo || "", r.riesgo || "");
  if (r.modulo === "DR") parts.push(r.escenario || "", r.resultado || "", r.hallazgos || "", r.leccionesAprendidas || "");
  if (Array.isArray(r.evidencias)) {
    for (const ev of r.evidencias) {
      parts.push(ev.tipo || "", ev.observacion || "");
    }
  }
  return parts.join(" ").toLowerCase();
}

// Filtrado
const baseRows = computed(() => {
  return [...registros.value]
    .map(normalizeRecord)
    .filter(r => r?.modulo === moduloSeleccionado.value)
    .sort((a,b) => new Date(b.actualizadoEn || b.creadoEn || 0) - new Date(a.actualizadoEn || a.creadoEn || 0));
});

const filteredRows = computed(() => {
  const term = q.value.trim().toLowerCase();
  
  return baseRows.value.filter(r => {
    const code = estadoCode(r.estado);
    
    if (["ABI","ANA","MIT","CER"].includes(filtroEstado.value) && filtroEstado.value !== code) return false;
    if (filtroEstado.value === "SLA" && !(r.modulo === "DISP" && r.slaAfectado)) return false;
    
    const evCount = Array.isArray(r.evidencias) ? r.evidencias.length : 0;
    if (filtroEstado.value === "EVI" && evCount === 0) return false;
    if (filtroEstado.value === "PEN" && evCount > 0) return false;
    
    if (!term) return true;
    return haystack(r).includes(term);
  });
});

const totalPages = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / pageSize.value)));

const pageRows = computed(() => {
  const p = Math.min(page.value, totalPages.value);
  const start = (p - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredRows.value.slice(start, end);
});

// Modal helpers
const chipClass = computed(() => {
  if (draft.modulo === "SEG") return "c-seg";
  if (draft.modulo === "DISP") return "c-disp";
  if (draft.modulo === "MNT") return "c-mnt";
  return "c-dr";
});

function humanDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function addEvidencia() {
  if (!draft.evidencias) draft.evidencias = [];
  draft.evidencias.push({
    uid: uidMini(),
    tipo: "Ticket",
    observacion: ""
  });
}

function removeEvidencia(idx) {
  draft.evidencias.splice(idx, 1);
}

</script>

<style scoped>
.app {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.topbar {
  background-color: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo {
  width:40px; height:40px; border-radius:12px;
  display:grid; place-items:center;
  background: #1f3150;
  border: 1px solid rgba(255,255,255,.2);
  color:#fff; font-weight:900;
  font-size: 11px;
}

.logo-av {
  background-color: #1f3150;
  color: white;
}

.title h1 {
  margin:0; 
  font-size:15px; 
  color:#1f3150;
  font-weight: 600;
}

.title p {
  margin:2px 0 0; 
  font-size:12px; 
  color: #64748b;
}

.legend-badges {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  background: #fff;
}

.badge-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.badge-red .badge-dot {
  background-color: #ef4444;
}

.badge-blue .badge-dot {
  background-color: #3b82f6;
}

.badge-green .badge-dot {
  background-color: #10b981;
}

.badge-orange .badge-dot {
  background-color: #f59e0b;
}

.badge-text {
  font-size: 13px;
  font-weight: 600;
  color: #1f3150;
}

/* KPI Section */
.kpi-section {
  background: #fff;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.kpi-cards {
  display: flex;
  gap: 1rem;
}

.kpi-card {
  min-width: 110px;
  padding: 0.875rem 1.25rem;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  text-align: left;
}

.kpi-label {
  font-size: 11px;
  color: #64748b;
  margin-bottom: 0.375rem;
  font-weight: 500;
}

.kpi-value {
  font-size: 32px;
  font-weight: 700;
  color: #1f3150;
  line-height: 1;
}

.module-info {
  text-align: right;
}

.module-label {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 0.25rem;
}

.module-name {
  font-size: 16px;
  font-weight: 700;
  color: #1f3150;
}

/* Main Content */
.content {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 1.5rem;
  padding: 1.5rem;
  max-width: 100%;
  margin: 0;
}

/* Left Panel */
.left-panel {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
  height: fit-content;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #1f3150;
}

.panel-subtitle {
  margin: 0.25rem 0 0;
  font-size: 12px;
  color: #64748b;
}

.modules-list {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.module-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.module-item:hover {
  background: #f8fafc;
}

.module-item.active {
  background: #f0fdf4;
  border-color: #10b981;
}

.module-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
}

.module-dot-red {
  background-color: #ef4444;
}

.module-dot-blue {
  background-color: #3b82f6;
}

.module-dot-green {
  background-color: #10b981;
}

.module-dot-orange {
  background-color: #f59e0b;
}

.module-info-text {
  flex: 1;
}

.module-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f3150;
  margin-bottom: 0.125rem;
}

.module-desc {
  font-size: 12px;
  color: #64748b;
}

.panel-actions {
  margin-top: 1.5rem;
  display: flex;
  gap: 0.75rem;
}

.btn-export {
  flex: 1;
  padding: 0.625rem 1rem;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #1f3150;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-export:hover {
  background: #f8fafc;
}

.btn-clear {
  flex: 1;
  padding: 0.625rem 1rem;
  border-radius: 6px;
  border: 1px solid #fee2e2;
  background: #fef2f2;
  color: #dc2626;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-clear:hover {
  background: #fee2e2;
}

.panel-tip {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 6px;
  font-size: 12px;
  color: #475569;
  line-height: 1.5;
}

.panel-tip strong {
  color: #1f3150;
}

/* Right Panel */
.right-panel {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
}

.panel-header-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.panel-header-main h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #1f3150;
}

.btn-nuevo {
  padding: 0.625rem 1.25rem;
  border-radius: 6px;
  border: none;
  background: #10b981;
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-nuevo:hover {
  background: #059669;
}

.filters-section {
  margin-bottom: 1.5rem;
}

.filter-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.filter-tab {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #64748b;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-tab:hover {
  background: #f8fafc;
}

.filter-tab.active {
  background: #1f3150;
  color: white;
  border-color: #1f3150;
}

.filter-secondary {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}

.filter-chip {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #64748b;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-chip:hover {
  background: #f8fafc;
}

.pagination-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
  font-size: 13px;
  color: #64748b;
}

.select-pagination {
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #1f3150;
  font-size: 13px;
  cursor: pointer;
}

:root {
  --border: #e2e8f0;
  --text: #1f3150;
  --muted: #64748b;
  --panel: #ffffff;
  --panel-2: #f8fafc;
  --ring: rgba(16, 185, 129, 0.1);
  --green: #10b981;
  --danger: #ef4444;
  --shadow: rgba(0,0,0,0.05);
  --radius: 12px;
}

.app {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.topbar {
  background-color: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo {
  width:40px; height:40px; border-radius:12px;
  display:grid; place-items:center;
  background: #1f3150;
  border: 1px solid rgba(255,255,255,.2);
  color:#fff; font-weight:900;
  font-size: 11px;
}

.logo-av {
  background-color: #1f3150;
  color: white;
}

.title h1 {
  margin:0; 
  font-size:15px; 
  color:#1f3150;
  font-weight: 600;
}

.title p {
  margin:2px 0 0; 
  font-size:12px; 
  color: #64748b;
}

.legend-badges {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  background: #fff;
}

.badge-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.badge-red .badge-dot {
  background-color: #ef4444;
}

.badge-blue .badge-dot {
  background-color: #3b82f6;
}

.badge-green .badge-dot {
  background-color: #10b981;
}

.badge-orange .badge-dot {
  background-color: #f59e0b;
}

.badge-text {
  font-size: 13px;
  font-weight: 600;
  color: #1f3150;
}

/* KPI Section */
.kpi-section {
  background: #fff;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.kpi-cards {
  display: flex;
  gap: 1rem;
}

.kpi-card {
  min-width: 110px;
  padding: 0.875rem 1.25rem;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  text-align: left;
}

.kpi-label {
  font-size: 11px;
  color: #64748b;
  margin-bottom: 0.375rem;
  font-weight: 500;
}

.kpi-value {
  font-size: 32px;
  font-weight: 700;
  color: #1f3150;
  line-height: 1;
}

.module-info {
  text-align: right;
}

.module-label {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 0.25rem;
}

.module-name {
  font-size: 16px;
  font-weight: 700;
  color: #1f3150;
}

/* Main Content */
.content {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 1.5rem;
  padding: 1.5rem;
  max-width: 100%;
  margin: 0;
}

/* Left Panel */
.left-panel {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
  height: fit-content;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #1f3150;
}

.panel-subtitle {
  margin: 0.25rem 0 0;
  font-size: 12px;
  color: #64748b;
}

.modules-list {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.module-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.module-item:hover {
  background: #f8fafc;
}

.module-item.active {
  background: #f0fdf4;
  border-color: #10b981;
}

.module-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
}

.module-dot-red {
  background-color: #ef4444;
}

.module-dot-blue {
  background-color: #3b82f6;
}

.module-dot-green {
  background-color: #10b981;
}

.module-dot-orange {
  background-color: #f59e0b;
}

.module-info-text {
  flex: 1;
}

.module-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f3150;
  margin-bottom: 0.125rem;
}

.module-desc {
  font-size: 12px;
  color: #64748b;
}

.panel-actions {
  margin-top: 1.5rem;
  display: flex;
  gap: 0.75rem;
}

.btn-export {
  flex: 1;
  padding: 0.625rem 1rem;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #1f3150;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-export:hover {
  background: #f8fafc;
  border-color: rgba(16, 185, 129, 0.35);
}

.btn-clear {
  flex: 1;
  padding: 0.625rem 1rem;
  border-radius: 6px;
  border: 1px solid #fee2e2;
  background: #fef2f2;
  color: #dc2626;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-clear:hover {
  background: #fee2e2;
}

.panel-tip {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 6px;
  font-size: 12px;
  color: #475569;
  line-height: 1.5;
}

.panel-tip strong {
  color: #1f3150;
}

/* Right Panel */
.right-panel {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
}

.panel-header-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.panel-header-main h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #1f3150;
}

.btn-nuevo {
  padding: 0.625rem 1.25rem;
  border-radius: 6px;
  border: none;
  background: #10b981;
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-nuevo:hover {
  background: #059669;
}

.filters-section {
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.search-bar {
  width: 100%;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  font-size: 14px;
  outline: none;
}

.search-input:focus {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.filter-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-tab {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #64748b;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-tab:hover {
  background: #f8fafc;
}

.filter-tab.active {
  background: #1f3150;
  color: white;
  border-color: #1f3150;
}

.filter-secondary {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}

.filter-chip {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #64748b;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-chip:hover {
  background: #f8fafc;
}

.filter-chip.active {
  background: #1f3150;
  color: white;
  border-color: #1f3150;
}

.pagination-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
  font-size: 13px;
  color: #64748b;
}

.select-pagination {
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #1f3150;
  font-size: 13px;
  cursor: pointer;
  outline: none;
}

.table-container {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 980px;
}

.data-table thead {
  background: #f8fafc;
}

.data-table th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  border-bottom: 1px solid #e2e8f0;
}

.data-table td {
  padding: 1rem;
  font-size: 13px;
  color: #1f3150;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: top;
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.col-id { width: 250px; }
.col-fecha { width: 190px; }
.col-resumen { width: auto; }
.col-estado { width: 260px; }
.col-accion { width: 100px; text-align: right; }

.idbox {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  word-break: break-word;
  line-height: 1.25;
}

.nowrap {
  white-space: nowrap;
}

.resumen {
  color: #1f3150;
  line-height: 1.35;
  white-space: normal;
  word-break: break-word;
}

.meta {
  margin-top: 8px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.miniTag {
  font-size: 11px;
  color: #64748b;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  padding: 4px 8px;
  border-radius: 999px;
}

.stacks {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: flex-start;
}

.status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #64748b;
  white-space: nowrap;
}

.status.mini {
  padding: 5px 9px;
  font-size: 11px;
}

.status.ok {
  border-color: rgba(16, 185, 129, 0.35);
  background: rgba(16, 185, 129, 0.12);
  color: #10b981;
}

.status.warn {
  border-color: rgba(245, 158, 11, 0.35);
  background: rgba(245, 158, 11, 0.12);
  color: #f59e0b;
}

.status.bad {
  border-color: rgba(239, 68, 68, 0.35);
  background: rgba(239, 68, 68, 0.10);
  color: #ef4444;
}

.link {
  appearance: none;
  border: none;
  background: transparent;
  color: #3b82f6;
  cursor: pointer;
  font-weight: 600;
  padding: 0;
  font-size: 13px;
  text-decoration: underline;
}

.link:hover {
  color: #2563eb;
}

.no-data {
  text-align: center;
  color: #94a3b8;
  padding: 3rem 1rem;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8fafc;
  justify-content: space-between;
}

.pagination-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #64748b;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #10b981;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pinfo {
  font-size: 13px;
  color: #1f3150;
}

.muted {
  color: #64748b;
}

/* ========== MODAL REDISEÑADO ========== */

/* Overlay del modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  overflow-y: auto;
}

/* Contenedor principal del modal */
.modal-container {
  width: 100%;
  max-width: 1600px;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  overflow: hidden;
}

/* Header del modal */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  border-bottom: 2px solid #f1f5f9;
  background: linear-gradient(to bottom, #ffffff, #f8fafc);
  flex-shrink: 0;
}

.modal-header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  min-width: 0;
}

.modal-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.modal-badge.c-seg {
  background: rgba(239, 68, 68, 0.15);
  color: #dc2626;
  border: 2px solid rgba(239, 68, 68, 0.3);
}

.modal-badge.c-disp {
  background: rgba(59, 130, 246, 0.15);
  color: #2563eb;
  border: 2px solid rgba(59, 130, 246, 0.3);
}

.modal-badge.c-mnt {
  background: rgba(16, 185, 129, 0.15);
  color: #059669;
  border: 2px solid rgba(16, 185, 129, 0.3);
}

.modal-badge.c-dr {
  background: rgba(245, 158, 11, 0.15);
  color: #d97706;
  border: 2px solid rgba(245, 158, 11, 0.3);
}

.modal-title-group {
  flex: 1;
  min-width: 0;
}

.modal-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.3;
}

.modal-subtitle {
  margin: 0.25rem 0 0;
  font-size: 13px;
  color: #64748b;
  font-family: ui-monospace, monospace;
}

.modal-header-right {
  display: flex;
  gap: 0.75rem;
  flex-shrink: 0;
}

/* Body del modal */
.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  background: #f8fafc;
}

/* Sección del modal */
.modal-section {
  background: #ffffff;
  border-radius: 16px;
  padding: 1.5rem 2rem;
  margin-bottom: 1.5rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.modal-section:last-child {
  margin-bottom: 0;
}

.modal-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f1f5f9;
}

.modal-section-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.modal-section-desc {
  margin: 0.25rem 0 0;
  font-size: 13px;
  color: #64748b;
}

/* Grid del modal - 3 columnas */
.modal-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
}

@media (max-width: 1200px) {
  .modal-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .modal-grid {
    grid-template-columns: 1fr;
  }
}

/* Campo del formulario */
.modal-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.modal-field-full {
  grid-column: 1 / -1;
}

.modal-field-span2 {
  grid-column: span 2;
}

@media (max-width: 768px) {
  .modal-field-span2 {
    grid-column: auto;
  }
}

.modal-label {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 0.25rem;
}

.modal-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  color: #0f172a;
  background: #ffffff;
  transition: all 0.2s ease;
  font-family: inherit;
}

.modal-input:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
}

.modal-textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
  line-height: 1.5;
}

.modal-field-hint {
  margin: 0.5rem 0 0;
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.4;
}

/* Checkbox */
.modal-checkbox {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.75rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  background: #ffffff;
  transition: all 0.2s ease;
}

.modal-checkbox:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.modal-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.modal-checkbox span {
  font-size: 14px;
  color: #475569;
}

.modal-checkbox-group {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.625rem;
}

.modal-checkbox-item {
  display: flex;
  align-items: center;
  gap: 0.1rem;
  padding: 0.625rem 0.875rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 11px;
  color: #475569;
}

.modal-checkbox-item:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.modal-checkbox-item input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

/* Hitos de estado */
.modal-hitos {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}

.modal-hito {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  flex: 1;
  min-width: 150px;
}

.modal-hito-pill {
  padding: 0.25rem 0.625rem;
  background: #10b981;
  color: #ffffff;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.modal-hito-val {
  font-size: 12px;
  color: #475569;
  font-weight: 500;
}

/* Evidencias */
.modal-empty {
  padding: 2rem;
  text-align: center;
  background: #f8fafc;
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  color: #64748b;
  font-size: 14px;
}

.modal-evidencias-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.modal-evidencia-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}

.modal-evidencia-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
}

.modal-evidencia-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.modal-evidencia-title strong {
  font-size: 14px;
  color: #0f172a;
}

.modal-evidencia-tag {
  padding: 0.25rem 0.75rem;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
}

.modal-evidencia-card .modal-grid {
  padding: 1.5rem;
  background: #f8fafc;
}

/* Botones */
.modal-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-btn-cancel {
  background: #f8fafc;
  color: #64748b;
  border-color: #e2e8f0;
}

.modal-btn-cancel:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #475569;
}

.modal-btn-save {
  background: #10b981;
  color: #ffffff;
  border-color: #10b981;
}

.modal-btn-save:hover {
  background: #059669;
  border-color: #059669;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.modal-btn-add {
  background: #10b981;
  color: #ffffff;
  border-color: #10b981;
  padding: 0.625rem 1.25rem;
  font-size: 13px;
}

.modal-btn-add:hover {
  background: #059669;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.modal-btn-delete {
  background: #fef2f2;
  color: #dc2626;
  border-color: #fecaca;
}

.modal-btn-delete:hover {
  background: #fee2e2;
  border-color: #fca5a5;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
}

/* Footer del modal */
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  border-top: 2px solid #f1f5f9;
  background: linear-gradient(to top, #ffffff, #f8fafc);
  flex-shrink: 0;
}

.modal-footer-left {
  display: flex;
  gap: 0.75rem;
}

.modal-footer-right {
  display: flex;
  gap: 0.75rem;
}

/* Responsive */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 1rem;
  }

  .modal-container {
    max-width: 100%;
    border-radius: 16px;
  }

  .modal-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .modal-header-right {
    width: 100%;
    justify-content: flex-end;
  }

  .modal-body {
    padding: 1.5rem;
  }

  .modal-section {
    padding: 1rem 1.5rem;
  }

  .modal-footer {
    flex-direction: column;
    gap: 1rem;
  }

  .modal-footer-left,
  .modal-footer-right {
    width: 100%;
    justify-content: stretch;
  }

  .modal-btn {
    flex: 1;
    justify-content: center;
  }
}
</style>