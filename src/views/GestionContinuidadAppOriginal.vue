<template>
  <section class="wrap">
    <DashboardRegistros
      :registros="registros"
      :modulo-seleccionado="moduloSeleccionado"
      @cambiar-modulo="setModulo"
    />

    <div class="layout">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="side-title">
          <h3>Módulos</h3>
          <p>Selecciona el tipo de registro</p>
        </div>

        <div class="nav">
          <button class="navbtn" :class="{ active: moduloSeleccionado==='SEG' }" @click="setModulo('SEG')">
            <span class="dot seg"></span>
            <div class="txt"><b>Seguridad</b><small>Eventos SEG</small></div>
          </button>

          <button class="navbtn" :class="{ active: moduloSeleccionado==='DISP' }" @click="setModulo('DISP')">
            <span class="dot disp"></span>
            <div class="txt"><b>Disponibilidad</b><small>Servicios / SLA</small></div>
          </button>

          <button class="navbtn" :class="{ active: moduloSeleccionado==='MNT' }" @click="setModulo('MNT')">
            <span class="dot mnt"></span>
            <div class="txt"><b>Mantenimiento</b><small>Planificados / correctivos</small></div>
          </button>

          <button class="navbtn" :class="{ active: moduloSeleccionado==='DR' }" @click="setModulo('DR')">
            <span class="dot dr"></span>
            <div class="txt"><b>Simulacros</b><small>DR / Contingencia</small></div>
          </button>
        </div>

        <div class="side-actions">
          <button class="btn" @click="exportarJSON">Exportar JSON</button>
          <button class="btn btn-danger" @click="limpiarTodo">Limpiar todo</button>
        </div>

        <div class="note">
          <b>Tip:</b> guarda evidencias (ticket/correo/alerta/captura) y controla el estado del caso.
        </div>
      </aside>

      <!-- Main -->
      <section class="main">
        <div class="main-head">
          <div class="mh-left">
            <h3>{{ moduloNombre }}</h3>
            <p>{{ moduloDescripcion }}</p>
          </div>

          <div class="mh-right">
            <button class="btn btn-green btn-big" @click="crearRegistro(moduloSeleccionado)">
              + Nuevo registro
            </button>
          </div>
        </div>

        <!-- Filtros -->
        <div class="filters">
          <div class="search">
            <span class="icon">⌕</span>
            <input
              class="searchInput"
              v-model="q"
              placeholder="Buscar (ID, resumen, evidencias, sistemas afectados)..."
            />
          </div>

          <div class="chips">
            <button class="chip" :class="{ on: filtroEstado==='ALL' }" @click="filtroEstado='ALL'">Todos</button>
            <button class="chip" :class="{ on: filtroEstado==='ABI' }" @click="filtroEstado='ABI'">Abierto</button>
            <button class="chip" :class="{ on: filtroEstado==='ANA' }" @click="filtroEstado='ANA'">En análisis</button>
            <button class="chip" :class="{ on: filtroEstado==='MIT' }" @click="filtroEstado='MIT'">Mitigado</button>
            <button class="chip" :class="{ on: filtroEstado==='CER' }" @click="filtroEstado='CER'">Cerrado</button>
            <button class="chip" :class="{ on: filtroEstado==='SLA' }" @click="filtroEstado='SLA'">SLA afectado</button>
            <button class="chip" :class="{ on: filtroEstado==='EVI' }" @click="filtroEstado='EVI'">Con evidencias</button>
            <button class="chip" :class="{ on: filtroEstado==='PEN' }" @click="filtroEstado='PEN'">Pendiente evidencias</button>
          </div>

          <div class="perpage">
            <span class="muted">Por página</span>
            <select class="select" v-model.number="pageSize">
              <option :value="5">5</option>
              <option :value="10">10</option>
              <option :value="20">20</option>
            </select>
          </div>
        </div>

        <!-- Tabla -->
        <div class="table-wrap">
          <div class="table-scroll">
            <table class="table">
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
                  <td class="mono col-id">
                    <div class="idbox">{{ r.id }}</div>
                  </td>

                  <td class="col-fecha">
                    <div class="nowrap">{{ fechaResumen(r) }}</div>
                  </td>

                  <td class="col-resumen">
                    <div class="resumen">
                      {{ resumenRegistro(r) }}
                    </div>

                    <div class="meta" v-if="(r.afectaSistemas && r.afectaSistemas.length) || r.notificarGerencia">
                      <span v-if="r.notificarGerencia" class="miniTag">Notificar gerencia</span>
                      <span v-for="s in (r.afectaSistemas || []).slice(0,3)" :key="s" class="miniTag">
                        {{ s }}
                      </span>
                      <span v-if="(r.afectaSistemas || []).length > 3" class="miniTag">
                        +{{ (r.afectaSistemas || []).length - 3 }}
                      </span>
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
                  <td colspan="5" class="empty">No hay registros con estos filtros.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="pager" v-if="totalPages > 1">
            <button class="btn btn-big" :disabled="page===1" @click="page=1">«</button>
            <button class="btn btn-big" :disabled="page===1" @click="page--">‹</button>

            <div class="pinfo">
              Página <b>{{ page }}</b> de <b>{{ totalPages }}</b>
              <span class="muted">({{ filteredRows.length }} registros)</span>
            </div>

            <button class="btn btn-big" :disabled="page===totalPages" @click="page++">›</button>
            <button class="btn btn-big" :disabled="page===totalPages" @click="page=totalPages">»</button>
          </div>
        </div>
      </section>
    </div>

    <!-- Modal -->
    <ModalRegistro
      v-if="modalAbierta"
      :modo="modoModal"
      :registro-inicial="registroBorrador"
      @cerrar="cerrarModal"
      @guardar="guardarRegistro"
      @eliminar="eliminarRegistro"
    />
  </section>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import DashboardRegistros from "./components/DashboardRegistros.vue";
import ModalRegistro from "./components/ModalRegistro.vue";

const LS_KEY = "avantika_gestion_continuidad_tic_v2";

function uid() {
  return ("R-" + Math.random().toString(16).slice(2) + "-" + Date.now().toString(16)).toUpperCase();
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

const registros = ref(loadState().registros);

watch(
  registros,
  (val) => saveState({ registros: val }),
  { deep: true }
);

// UI state
const moduloSeleccionado = ref("SEG");
const modalAbierta = ref(false);
const modoModal = ref("crear");
const registroBorrador = ref(null);

// filtros
const q = ref("");
const filtroEstado = ref("ALL"); // ALL|ABI|ANA|MIT|CER|SLA|EVI|PEN
const page = ref(1);
const pageSize = ref(10);

watch([moduloSeleccionado, q, filtroEstado, pageSize], () => {
  page.value = 1;
});

function setModulo(m) {
  moduloSeleccionado.value = m;
}

const moduloNombre = computed(() => {
  if (moduloSeleccionado.value === "SEG") return "Seguridad (SEG)";
  if (moduloSeleccionado.value === "DISP") return "Disponibilidad (DISP)";
  if (moduloSeleccionado.value === "MNT") return "Mantenimientos (MNT)";
  return "Simulacros DR (DR)";
});
const moduloDescripcion = computed(() => {
  if (moduloSeleccionado.value === "SEG") return "Registra eventos de seguridad, acciones y evidencias.";
  if (moduloSeleccionado.value === "DISP") return "Registra afectación de servicios, tiempos y SLA.";
  if (moduloSeleccionado.value === "MNT") return "Registra mantenimientos con rango de fechas y riesgo.";
  return "Registra simulacros con resultados, hallazgos y lecciones.";
});

function normalizeRecord(r) {
  const x = { ...r };
  if (!x.estado) x.estado = "Abierto";
  if (x.notificarGerencia === undefined) x.notificarGerencia = false;
  if (!Array.isArray(x.evidencias)) x.evidencias = [];
  if (!Array.isArray(x.afectaSistemas)) x.afectaSistemas = [];
  if (x.evidencia === undefined) x.evidencia = false;
  return x;
}

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

  let draft = null;

  if (modulo === "SEG") {
    draft = {
      ...base,
      fechaHora: nowLocalDatetime(),
      fuente: "Fortinet",
      tipo: "",
      impacto: "Medio",
      descripcion: "",
      responsableTIC: "",
    };
  } else if (modulo === "DISP") {
    draft = {
      ...base,
      servicioAfectado: "",
      tipoEvento: "",
      tiempoIndisponibleMin: 0,
      slaAfectado: false,
      acciones: "",
    };
  } else if (modulo === "MNT") {
    const now = nowLocalDatetime();
    draft = {
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
    draft = {
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
  registroBorrador.value = draft;
  modalAbierta.value = true;
}

function editarRegistro(id) {
  const found = registros.value.find(r => r.id === id);
  if (!found) return;
  modoModal.value = "editar";
  registroBorrador.value = JSON.parse(JSON.stringify(normalizeRecord(found)));
  modalAbierta.value = true;
}

function cerrarModal() {
  modalAbierta.value = false;
  registroBorrador.value = null;
}

function guardarRegistro(registro) {
  const copy = normalizeRecord({ ...registro, actualizadoEn: new Date().toISOString() });
  const idx = registros.value.findIndex(r => r.id === copy.id);
  if (idx === -1) registros.value.unshift(copy);
  else registros.value.splice(idx, 1, copy);
  cerrarModal();
}

function eliminarRegistro(id) {
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
  registros.value = [];
  cerrarModal();
  localStorage.removeItem(LS_KEY);
}

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
      parts.push(
        ev.tipo || "", ev.origen || "", ev.ticketNumero || "",
        ev.correoAsunto || "", ev.correoRemitente || "",
        ev.alertaAsunto || "", ev.referencia || "",
        ev.observacion || "", ev.fileName || ""
      );
    }
  }
  return parts.join(" ").toLowerCase();
}

const baseRows = computed(() => {
  return [...registros.value]
    .map(normalizeRecord)
    .filter(r => r?.modulo === moduloSeleccionado.value)
    .sort((a,b) => new Date(b.actualizadoEn || b.creadoEn || 0) - new Date(a.actualizadoEn || a.creadoEn || 0));
});

function mapFiltroToEstadoCode(st) {
  const s = (st || "Abierto").toLowerCase();
  if (s.includes("abier")) return "ABI";
  if (s.includes("anál") || s.includes("anal")) return "ANA";
  if (s.includes("mit")) return "MIT";
  if (s.includes("cerr")) return "CER";
  return "ABI";
}

const filteredRows = computed(() => {
  const term = q.value.trim().toLowerCase();

  return baseRows.value.filter(r => {
    const code = mapFiltroToEstadoCode(r.estado);

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
</script>

<style>
.wrap{
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.layout{
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 12px;
  align-items: start;
}
@media (max-width: 980px){
  .layout{ grid-template-columns: 1fr; }
}

/* Sidebar */
.sidebar{
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--panel);
  box-shadow: 0 10px 26px var(--shadow);
  padding: 12px;
}
.side-title h3{ margin: 0; font-size: 13px; font-weight: 820; }
.side-title p{ margin: 6px 0 0; font-size: 12px; color: var(--muted); }

.nav{ margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }
.navbtn{
  display: flex;
  gap: 10px;
  align-items: center;
  width: 100%;
  border: 1px solid var(--border);
  background: var(--panel-2);
  color: var(--text);
  border-radius: 12px;
  padding: 10px;
  cursor: pointer;
  text-align: left;
  transition: border-color .12s ease, box-shadow .12s ease, transform .06s ease;
}
.navbtn:hover{
  border-color: rgba(45,164,78,.35);
  box-shadow: 0 0 0 3px var(--ring);
}
.navbtn:active{ transform: translateY(1px); }
.navbtn.active{
  background: #ffffff;
  border-color: rgba(45,164,78,.55);
}
.dot{ width: 10px; height: 10px; border-radius: 999px; flex: 0 0 auto; }
.dot.seg{ background: #cf222e; }
.dot.disp{ background: #0969da; }
.dot.mnt{ background: #1f883d; }
.dot.dr{ background: #bf8700; }
.txt b{ font-size: 13px; }
.txt small{ display: block; margin-top: 2px; font-size: 12px; color: var(--muted); }

.side-actions{ margin-top: 12px; display: flex; gap: 10px; flex-wrap: wrap; }
.note{
  margin-top: 12px;
  padding: 10px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: #fff;
  color: var(--muted);
  font-size: 12px;
}

/* Main */
.main{
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--panel);
  box-shadow: 0 10px 26px var(--shadow);
  overflow: hidden;
}
.main-head{
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  border-bottom: 1px solid var(--border);
  background: #ffffff;
}
.mh-left h3{ margin: 0; font-size: 14px; font-weight: 860; }
.mh-left p{ margin: 6px 0 0; font-size: 12px; color: var(--muted); }

/* Filters */
.filters{
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 12px;
  padding: 14px;
  border-bottom: 1px solid #eef1f4;
  background: #fff;
}
@media (max-width: 980px){
  .filters{ grid-template-columns: 1fr; }
}

.search{
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: #fff;
  padding: 12px 14px;
}
.icon{ color: var(--muted); font-size: 14px; }
.searchInput{
  border: none;
  outline: none;
  background: transparent;
  width: 100%;
  font-size: 14px;
  color: var(--text);
}

.chips{
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.chip{
  border: 1px solid var(--border);
  background: var(--panel-2);
  color: var(--text);
  padding: 10px 12px;
  border-radius: 999px;
  font-size: 13px;
  cursor: pointer;
}
.chip.on{
  background: #fff;
  border-color: rgba(45,164,78,.55);
  box-shadow: 0 0 0 3px var(--ring);
}

.perpage{
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: flex-end;
}
.select{
  border: 1px solid var(--border);
  background: #fff;
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 13px;
  outline: none;
}

.table-wrap{
  padding: 10px 10px 14px;
}

/* ✅ Evita que las columnas se “aprieten”: si no cabe, scroll horizontal */
.table-scroll{
  overflow-x: auto;
  overflow-y: hidden;
  border-radius: 14px;
}

/* ✅ Tabla con ancho mínimo real para que no se monten chips */
.table{
  width: 100%;
  min-width: 980px; /* clave: evita el aplastamiento */
  border-collapse: separate;
  border-spacing: 0;
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
  table-layout: auto; /* clave: permite distribuir mejor */
  background: #fff;
}

.table thead th{
  text-align: left;
  font-size: 12px;
  color: var(--muted);
  padding: 12px 12px;
  background: var(--panel-2);
  border-bottom: 1px solid var(--border);
}

/* Column sizing */
.col-id{ width: 250px; }
.col-fecha{ width: 190px; }
.col-resumen{ width: auto; }
.col-estado{ width: 260px; }
.col-accion{ width: 100px; text-align: right; }

.table tbody td{
  padding: 12px 12px;
  border-bottom: 1px solid #eef1f4;
  font-size: 13px;
  vertical-align: top;
}
.table tbody tr:last-child td{ border-bottom: none; }

.col-accion{ text-align: right; }
.nowrap{ white-space: nowrap; }

/* ID */
.mono{
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono","Courier New", monospace;
  font-size: 12px;
}
.idbox{
  word-break: break-word;
  line-height: 1.25;
}

/* Resumen con wrap bonito */
.resumen{
  color: var(--text);
  line-height: 1.35;
  white-space: normal;
  word-break: break-word;
}
.meta{
  margin-top: 8px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.miniTag{
  font-size: 11px;
  color: var(--muted);
  border: 1px solid var(--border);
  background: var(--panel-2);
  padding: 4px 8px;
  border-radius: 999px;
}

/* Estado: chips no se montan */
.stacks{
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: flex-start;
}

.status{
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
  border: 1px solid var(--border);
  background: var(--panel-2);
  color: var(--muted);
  white-space: nowrap;
}
.status.mini{ padding: 5px 9px; font-size: 11px; }

.status.ok{
  border-color: rgba(31,136,61,.35);
  background: rgba(45,164,78,.12);
  color: var(--green);
}
.status.warn{
  border-color: rgba(191,135,0,.35);
  background: rgba(191,135,0,.12);
  color: #7a5b00;
}
.status.bad{
  border-color: rgba(207,34,46,.35);
  background: rgba(207,34,46,.10);
  color: var(--danger);
}

.link{
  appearance: none;
  border: none;
  background: transparent;
  color: #0969da;
  cursor: pointer;
  font-weight: 800;
  padding: 0;
  font-size: 13px;
}
.link:hover{ text-decoration: underline; }

.empty{
  text-align: center;
  color: var(--muted);
  padding: 18px 10px;
  background: #ffffff;
}

/* Pager */
.pager{
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: flex-end;
  margin-top: 12px;
  flex-wrap: wrap;
}
.pinfo{
  font-size: 13px;
  color: var(--text);
}
.muted{ color: var(--muted); }

/* Buttons */
.btn{
  appearance: none;
  border: 1px solid var(--border);
  background: var(--panel-2);
  color: var(--text);
  padding: 9px 12px;
  border-radius: 12px;
  font-size: 13px;
  cursor: pointer;
  transition: border-color .12s ease, box-shadow .12s ease, transform .06s ease;
}
.btn:hover{
  border-color: rgba(45,164,78,.35);
  box-shadow: 0 0 0 3px var(--ring);
}
.btn:active{ transform: translateY(1px); }
.btn:disabled{ opacity: .55; cursor: not-allowed; }
.btn-big{ padding: 10px 14px; font-size: 13px; }

.btn-green{
  border-color: rgba(31,136,61,.35);
  background: rgba(45,164,78,.14);
}
.btn-green:hover{ border-color: rgba(31,136,61,.55); }

.btn-danger{
  border-color: rgba(207,34,46,.35);
  background: rgba(207,34,46,.10);
}
.btn-danger:hover{
  border-color: rgba(207,34,46,.55);
  box-shadow: 0 0 0 3px rgba(207,34,46,.14);
}
</style>
