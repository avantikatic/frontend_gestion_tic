<template>
  <div class="overlay" @click.self="emit('cerrar')">
    <div class="modal" role="dialog" aria-modal="true">
      <!-- Header sticky -->
      <header class="head">
        <div class="hl">
          <span class="chip" :class="chipClass">{{ draft.modulo }}</span>
          <div class="titleBox">
            <h2>{{ modo === "editar" ? "Editar registro" : "Nuevo registro" }}</h2>
            <p class="sub">
              ID: <b class="mono">{{ draft.id }}</b>
              <span class="sep">•</span>
              <span class="muted">{{ humanDate(draft.actualizadoEn || draft.creadoEn) }}</span>
            </p>
          </div>
        </div>

        <div class="hr">
          <button class="btn" @click="emit('cerrar')">Cancelar</button>
          <button class="btn btn-green" @click="onGuardar">Guardar</button>
        </div>
      </header>

      <!-- Body -->
      <section class="body">
        <!-- COMÚN -->
        <details class="acc" open>
          <summary>
            <span>Común</span>
            <span class="hint">Estado · Afecta · Notificación</span>
          </summary>

          <div class="grid3">
            <label class="field">
              <span class="lbl">Estado</span>
              <select class="input" v-model="draft.estado">
                <option>Abierto</option>
                <option>En análisis</option>
                <option>Mitigado</option>
                <option>Cerrado</option>
              </select>
            </label>

            <label class="field">
              <span class="lbl">Notificar a Gerencia</span>
              <div class="inline">
                <input type="checkbox" v-model="draft.notificarGerencia" />
                <span class="small">SI/NO</span>
              </div>
            </label>

            <div class="field">
              <span class="lbl">Evidencia disponible</span>
              <div class="inline">
                <input type="checkbox" v-model="draft.evidencia" />
                <span class="small">SI si existe soporte verificable</span>
              </div>
            </div>

            <div class="field span3">
              <span class="lbl">Afecta</span>
              <div class="checks">
                <label class="check" v-for="s in SISTEMAS_CRITICOS" :key="s">
                  <input type="checkbox" :value="s" v-model="draft.afectaSistemas" />
                  <span>{{ s }}</span>
                </label>
              </div>
              <div class="small2">Marca los sistemas impactados. Si no aplica, deja en blanco.</div>
            </div>

            <!-- Historial / Hitos -->
            <div class="field span3">
              <span class="lbl">Historial de estado</span>

              <div class="hitos">
                <div class="hito">
                  <span class="pill">Abierto</span>
                  <span class="val">{{ draft.hitosEstado?.abiertoEn ? humanDate(draft.hitosEstado.abiertoEn) : "—" }}</span>
                </div>
                <div class="hito">
                  <span class="pill">Mitigado</span>
                  <span class="val">{{ draft.hitosEstado?.mitigadoEn ? humanDate(draft.hitosEstado.mitigadoEn) : "—" }}</span>
                </div>
                <div class="hito">
                  <span class="pill">Cerrado</span>
                  <span class="val">{{ draft.hitosEstado?.cerradoEn ? humanDate(draft.hitosEstado.cerradoEn) : "—" }}</span>
                </div>
              </div>

              <div class="timeline" v-if="draft.historialEstado?.length">
                <div class="trow" v-for="(h, i) in orderedHistorial" :key="i">
                  <span class="tstate">{{ h.estado }}</span>
                  <span class="tdate">{{ humanDate(h.fechaISO) }}</span>
                </div>
              </div>
              <div class="small2" v-else>
                Aún no hay cambios registrados. Se guardará automáticamente cuando cambies el estado.
              </div>
            </div>
          </div>
        </details>

        <!-- EVIDENCIAS -->
        <details class="acc" open>
          <summary>
            <span>Evidencias</span>
            <span class="hint">Ticket · Correo · Alerta · Captura</span>
          </summary>

          <div class="pad">
            <div class="rowtop">
              <div class="leftinfo">
                <span class="muted small2">
                  Agrega evidencias verificables (ticket, correo, alertas, capturas).
                </span>
              </div>

              <button class="btn btn-green" @click="addEvidencia">+ Agregar evidencia</button>
            </div>

            <div v-if="!draft.evidencias || draft.evidencias.length===0" class="emptyBox">
              No hay evidencias cargadas. Puedes agregar ticket, correo, alerta o captura.
            </div>

            <div v-for="(ev, idx) in draft.evidencias" :key="ev.uid" class="evCard">
              <div class="evHead">
                <div class="evTitle">
                  <b>Evidencia #{{ idx + 1 }}</b>
                  <span class="tag">{{ ev.tipo }}</span>
                </div>
                <button class="btn btn-danger" @click="removeEvidencia(idx)">Eliminar</button>
              </div>

              <div class="grid3 compact">
                <label class="field">
                  <span class="lbl">Tipo</span>
                  <select class="input" v-model="ev.tipo">
                    <option>Ticket</option>
                    <option>Correo</option>
                    <option>Alerta (Plataforma)</option>
                    <option>Captura</option>
                    <option>Otro</option>
                  </select>
                </label>

                <label class="field" v-if="ev.tipo==='Alerta (Plataforma)'">
                  <span class="lbl">Origen (Plataforma)</span>
                  <select class="input" v-model="ev.origen">
                    <option>FortiGate</option>
                    <option>FortiAnalyzer</option>
                    <option>Kaspersky</option>
                    <option>Microsoft 365</option>
                    <option>Otro</option>
                  </select>
                </label>

                <label class="field" v-if="ev.tipo==='Ticket'">
                  <span class="lbl">Número de ticket</span>
                  <input class="input" v-model="ev.ticketNumero" placeholder="Ej: INC-10452 / SD-8891 / Case #..." />
                </label>

                <template v-if="ev.tipo==='Correo'">
                  <label class="field span2">
                    <span class="lbl">Asunto del correo</span>
                    <input class="input" v-model="ev.correoAsunto" placeholder="Ej: Notificación / Soporte..." />
                  </label>
                  <label class="field">
                    <span class="lbl">Remitente</span>
                    <input class="input" v-model="ev.correoRemitente" placeholder="Ej: soporte@... / Nombre <correo@...>" />
                  </label>
                </template>

                <template v-if="ev.tipo==='Alerta (Plataforma)'">
                  <label class="field span2">
                    <span class="lbl">Asunto / Título</span>
                    <input class="input" v-model="ev.alertaAsunto" placeholder="Ej: Malware detected / URL blocked..." />
                  </label>
                  <label class="field span2">
                    <span class="lbl">Detalle / Referencia</span>
                    <input class="input" v-model="ev.referencia" placeholder="Ej: ID evento, política, host, regla..." />
                  </label>
                </template>

                <template v-if="ev.tipo==='Captura'">
                  <div class="field span3">
                    <span class="lbl">Adjuntar captura (imagen)</span>
                    <input class="input" type="file" accept="image/*" @change="onFile($event, ev)" />
                    <div class="small2">Se guarda en localStorage (base64). Evita imágenes muy pesadas (≤ 1.5MB).</div>

                    <div v-if="ev.fileName || ev.fileDataUrl" class="fileBox">
                      <div class="fileRow">
                        <b>{{ ev.fileName || "captura" }}</b>
                        <button class="btn btn-danger" @click="clearFile(ev)">Quitar</button>
                      </div>
                      <img v-if="ev.fileDataUrl" class="preview" :src="ev.fileDataUrl" alt="captura" />
                    </div>
                  </div>
                </template>

                <label class="field span3">
                  <span class="lbl">Observación</span>
                  <textarea class="input ta" rows="2" v-model="ev.observacion" placeholder="Describe la evidencia (qué prueba, dónde está, quién la envió, etc.)." />
                </label>
              </div>
            </div>
          </div>
        </details>

        <!-- MÓDULO SEG -->
        <details class="acc" v-if="draft.modulo==='SEG'" open>
          <summary><span>SEG – Seguridad</span><span class="hint">Campos del módulo</span></summary>
          <div class="grid3">
            <label class="field">
              <span class="lbl">Fecha / hora</span>
              <input class="input" type="datetime-local" v-model="draft.fechaHora" />
            </label>
            <label class="field">
              <span class="lbl">Fuente</span>
              <select class="input" v-model="draft.fuente">
                <option>Fortinet</option>
                <option>Kaspersky</option>
                <option>Microsoft 365</option>
                <option>Usuario</option>
                <option>Otro</option>
              </select>
            </label>
            <label class="field">
              <span class="lbl">Impacto</span>
              <select class="input" v-model="draft.impacto">
                <option>Alto</option><option>Medio</option><option>Bajo</option>
              </select>
            </label>

            <label class="field span3">
              <span class="lbl">Tipo</span>
              <input class="input" v-model="draft.tipo" placeholder="Ej: Phishing, Malware, URL bloqueada..." />
            </label>

            <label class="field span3">
              <span class="lbl">Descripción</span>
              <textarea class="input ta" rows="3" v-model="draft.descripcion" placeholder="Qué pasó, alcance, sistemas afectados..." />
            </label>

            <label class="field span3">
              <span class="lbl">Responsable TIC</span>
              <input class="input" v-model="draft.responsableTIC" placeholder="Ej: Coordinador TIC / Profesional TIC / Auxiliar TIC" />
            </label>
          </div>
        </details>

        <!-- MÓDULO DISP -->
        <details class="acc" v-if="draft.modulo==='DISP'" open>
          <summary><span>DISP – Disponibilidad</span><span class="hint">Campos del módulo</span></summary>
          <div class="grid3">
            <label class="field span2">
              <span class="lbl">Servicio afectado</span>
              <input class="input" v-model="draft.servicioAfectado" placeholder="Ej: DMS, SQL, Internet, Issabel..." />
            </label>
            <label class="field">
              <span class="lbl">Tiempo indisponible (min)</span>
              <input class="input" type="number" min="0" step="1" v-model.number="draft.tiempoIndisponibleMin" />
            </label>

            <label class="field span2">
              <span class="lbl">Tipo de evento</span>
              <input class="input" v-model="draft.tipoEvento" placeholder="Ej: caída, intermitencia, degradación" />
            </label>
            <label class="field">
              <span class="lbl">SLA afectado</span>
              <div class="inline">
                <input type="checkbox" v-model="draft.slaAfectado" />
                <span class="small">SI/NO</span>
              </div>
            </label>

            <label class="field span3">
              <span class="lbl">Acciones</span>
              <textarea class="input ta" rows="3" v-model="draft.acciones" placeholder="Acciones correctivas/preventivas..." />
            </label>
          </div>
        </details>

        <!-- MÓDULO MNT -->
        <details class="acc" v-if="draft.modulo==='MNT'" open>
          <summary><span>MNT – Mantenimientos</span><span class="hint">Rango de fechas</span></summary>
          <div class="grid3">
            <label class="field">
              <span class="lbl">Área</span>
              <input class="input" v-model="draft.area" placeholder="Ej: cuarto sistemas, nube, red..." />
            </label>
            <label class="field span2">
              <span class="lbl">Tipo</span>
              <input class="input" v-model="draft.tipo" placeholder="Ej: parchado, upgrade firmware..." />
            </label>

            <label class="field">
              <span class="lbl">Fecha inicio</span>
              <input class="input" type="datetime-local" v-model="draft.fechaInicio" />
            </label>
            <label class="field">
              <span class="lbl">Fecha fin</span>
              <input class="input" type="datetime-local" v-model="draft.fechaFin" />
            </label>
            <label class="field">
              <span class="lbl">Requiere parada</span>
              <div class="inline">
                <input type="checkbox" v-model="draft.requiereParada" />
                <span class="small">SI/NO</span>
              </div>
            </label>

            <label class="field">
              <span class="lbl">Riesgo</span>
              <select class="input" v-model="draft.riesgo">
                <option>Alto</option><option>Medio</option><option>Bajo</option>
              </select>
            </label>
          </div>
        </details>

        <!-- MÓDULO DR -->
        <details class="acc" v-if="draft.modulo==='DR'" open>
          <summary><span>DR – Simulacros</span><span class="hint">Rango de fechas</span></summary>
          <div class="grid3">
            <label class="field span3">
              <span class="lbl">Escenario</span>
              <input class="input" v-model="draft.escenario" placeholder="Ej: caída SQL, ransomware, pérdida energía..." />
            </label>

            <label class="field">
              <span class="lbl">Fecha inicio</span>
              <input class="input" type="datetime-local" v-model="draft.fechaInicio" />
            </label>
            <label class="field">
              <span class="lbl">Fecha fin</span>
              <input class="input" type="datetime-local" v-model="draft.fechaFin" />
            </label>
            <div class="field"></div>

            <label class="field span3">
              <span class="lbl">Objetivo</span>
              <textarea class="input ta" rows="2" v-model="draft.objetivo" placeholder="Qué se busca validar (RTO/RPO/procedimientos)." />
            </label>
            <label class="field span3">
              <span class="lbl">Resultado</span>
              <textarea class="input ta" rows="2" v-model="draft.resultado" placeholder="Qué ocurrió y si se cumplió." />
            </label>
            <label class="field span3">
              <span class="lbl">Hallazgos</span>
              <textarea class="input ta" rows="2" v-model="draft.hallazgos" placeholder="Gaps, fallas, puntos críticos." />
            </label>
            <label class="field span3">
              <span class="lbl">Lecciones aprendidas</span>
              <textarea class="input ta" rows="2" v-model="draft.leccionesAprendidas" placeholder="Acciones de mejora y próximos pasos." />
            </label>
          </div>
        </details>
      </section>

      <!-- Footer sticky -->
      <footer class="foot">
        <div class="left">
          <button v-if="modo==='editar'" class="btn btn-danger" @click="emit('eliminar', draft.id)">
            Eliminar
          </button>
        </div>
        <div class="right">
          <button class="btn" @click="emit('cerrar')">Cancelar</button>
          <button class="btn btn-green" @click="onGuardar">Guardar</button>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, watch } from "vue";

const props = defineProps({
  modo: { type: String, default: "crear" },
  registroInicial: { type: Object, required: true }
});
const emit = defineEmits(["cerrar", "guardar", "eliminar"]);

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

function uidMini() {
  return ("E-" + Math.random().toString(16).slice(2) + "-" + Date.now().toString(16)).toUpperCase();
}

const draft = reactive({ ...props.registroInicial });

let estadoOriginal = props.registroInicial?.estado || "Abierto";

function ensureDefaults() {
  if (!draft.estado) draft.estado = "Abierto";
  if (draft.notificarGerencia === undefined) draft.notificarGerencia = false;

  if (!Array.isArray(draft.afectaSistemas)) {
    const arr = [];
    if (draft.afectaM365) arr.push("Microsoft 365");
    if (draft.afectaIntranet) arr.push("Weru");
    draft.afectaSistemas = arr;
  }

  if (!Array.isArray(draft.evidencias)) draft.evidencias = [];
  if (draft.evidencia === undefined) draft.evidencia = false;

  if (!draft.hitosEstado || typeof draft.hitosEstado !== "object") {
    draft.hitosEstado = { abiertoEn: "", mitigadoEn: "", cerradoEn: "" };
  } else {
    draft.hitosEstado.abiertoEn = draft.hitosEstado.abiertoEn || "";
    draft.hitosEstado.mitigadoEn = draft.hitosEstado.mitigadoEn || "";
    draft.hitosEstado.cerradoEn = draft.hitosEstado.cerradoEn || "";
  }

  if (!Array.isArray(draft.historialEstado)) draft.historialEstado = [];
}
ensureDefaults();

watch(
  () => props.registroInicial,
  (val) => {
    Object.keys(draft).forEach((k) => delete draft[k]);
    Object.assign(draft, val || {});
    estadoOriginal = (val?.estado || "Abierto");
    ensureDefaults();
  },
  { deep: true }
);

watch(
  () => draft.evidencias.length,
  (n) => {
    if (n > 0 && draft.evidencia === false) draft.evidencia = true;
  }
);

const orderedHistorial = computed(() => {
  const list = Array.isArray(draft.historialEstado) ? [...draft.historialEstado] : [];
  return list.sort((a, b) => new Date(a.fechaISO).getTime() - new Date(b.fechaISO).getTime());
});

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

function parseLocal(dt) {
  if (!dt) return null;
  const d = new Date(dt);
  return Number.isNaN(d.getTime()) ? null : d;
}

function addEvidencia() {
  draft.evidencias.push({
    uid: uidMini(),
    tipo: "Ticket",
    origen: "FortiGate",
    ticketNumero: "",
    correoAsunto: "",
    correoRemitente: "",
    alertaAsunto: "",
    referencia: "",
    observacion: "",
    fileName: "",
    fileDataUrl: ""
  });
}

function removeEvidencia(idx) {
  draft.evidencias.splice(idx, 1);
}

function clearFile(ev) {
  ev.fileName = "";
  ev.fileDataUrl = "";
}

function onFile(e, ev) {
  const file = e?.target?.files?.[0];
  if (!file) return;

  const max = 1.5 * 1024 * 1024;
  if (file.size > max) {
    alert("La imagen es muy pesada para guardar en localStorage. Usa una captura más liviana (≤ 1.5MB).");
    e.target.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    ev.fileName = file.name;
    ev.fileDataUrl = String(reader.result || "");
  };
  reader.readAsDataURL(file);
}

function registrarHitosYHistorial() {
  const ahora = new Date().toISOString();
  const est = (draft.estado || "Abierto").trim();

  if (est === "Abierto" && !draft.hitosEstado.abiertoEn) draft.hitosEstado.abiertoEn = ahora;
  if (est === "Mitigado" && !draft.hitosEstado.mitigadoEn) draft.hitosEstado.mitigadoEn = ahora;
  if (est === "Cerrado" && !draft.hitosEstado.cerradoEn) draft.hitosEstado.cerradoEn = ahora;

  if (!draft.hitosEstado.abiertoEn) draft.hitosEstado.abiertoEn = draft.creadoEn || ahora;

  const cambio = est !== (estadoOriginal || "Abierto");
  const vacio = !draft.historialEstado || draft.historialEstado.length === 0;

  if (cambio || vacio) {
    const last = draft.historialEstado?.[draft.historialEstado.length - 1];
    const lastEstado = last?.estado;
    if (lastEstado !== est) {
      draft.historialEstado.push({ estado: est, fechaISO: ahora });
    }
  }
}

function onGuardar() {
  if (!draft.estado) draft.estado = "Abierto";

  if (draft.modulo === "SEG") {
    if (!draft.fechaHora) return alert("En SEG la fecha/hora es obligatoria.");
  }

  if (draft.modulo === "MNT" || draft.modulo === "DR") {
    const a = parseLocal(draft.fechaInicio);
    const b = parseLocal(draft.fechaFin);
    if (!a || !b) return alert("En MNT/DR el rango de fechas es obligatorio.");
    if (b.getTime() < a.getTime()) return alert("La fecha fin debe ser posterior o igual a la fecha inicio.");
  }

  if (draft.evidencia && (!draft.evidencias || draft.evidencias.length === 0)) {
    const ok = confirm("Marcaste 'Evidencia disponible' pero no cargaste evidencias. ¿Deseas guardar de todos modos?");
    if (!ok) return;
  }

  registrarHitosYHistorial();
  emit("guardar", JSON.parse(JSON.stringify(draft)));
}
</script>

<style>
/* Overlay */
.overlay{
  position: fixed;
  inset: 0;
  background: rgba(17,24,39,.45);
  z-index: 60;
  overflow: auto;
  padding: 10px; /* ✅ menos margen, más área útil */
}

/* Modal */
.modal{
  width: min(1200px, 100%);  /* ✅ más ancha */
  margin: 0 auto;
  border-radius: 16px;
  border: 1px solid var(--border);
  background: #fff;
  box-shadow: 0 24px 70px rgba(0,0,0,.18);
  height: min(96vh, 920px);  /* ✅ más alta sin depender de zoom */
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Header sticky (compacto) */
.head{
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
  background: #fff;
}

.hl{ display: flex; gap: 10px; align-items: flex-start; min-width: 0; }
.titleBox{ min-width: 0; }

h2{ margin: 0; font-size: 14px; font-weight: 900; }
.sub{
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 70vw;
}
.sep{ opacity: .7; padding: 0 6px; }
.muted{ color: var(--muted); }
.mono{
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}
.hr{ display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }

/* Body */
.body{
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: auto; /* ✅ permite ver todo sin zoom */
}

/* Footer sticky */
.foot{
  position: sticky;
  bottom: 0;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-top: 1px solid var(--border);
  background: #fff;
}
.foot .right{ display: flex; gap: 10px; flex-wrap: wrap; }

/* Chip */
.chip{
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 900;
  border: 1px solid var(--border);
  background: var(--panel-2);
  flex: 0 0 auto;
}
.c-seg{ border-color: rgba(207,34,46,.35); }
.c-disp{ border-color: rgba(9,105,218,.35); }
.c-mnt{ border-color: rgba(31,136,61,.35); }
.c-dr{ border-color: rgba(191,135,0,.35); }

/* Accordion */
.acc{
  border: 1px solid var(--border);
  background: #fff;
  border-radius: 14px;
  overflow: hidden;
}
.acc summary{
  list-style: none;
  cursor: pointer;
  user-select: none;
  padding: 9px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border-bottom: 1px solid #eef1f4;
  background: var(--panel-2);
}
.acc summary::-webkit-details-marker{ display: none; }
.hint{ font-size: 12px; color: var(--muted); }

/* ✅ Grid 3 columnas en pantallas grandes para reducir altura */
.grid3{
  padding: 10px 12px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.grid3.compact{ padding-top: 10px; }

@media (max-width: 980px){
  .grid3{ grid-template-columns: 1fr; }
  .span2, .span3{ grid-column: auto; }
  .sub{ max-width: 60vw; }
  .modal{ height: 96vh; }
}

.field{ display: flex; flex-direction: column; gap: 6px; }
.lbl{ font-size: 12px; color: var(--muted); }

.input{
  width: 100%;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: #fff;
  color: var(--text);
  padding: 9px 10px;   /* ✅ un poco más compacto */
  font-size: 13px;
  outline: none;
}
.input:focus{
  border-color: rgba(45,164,78,.40);
  box-shadow: 0 0 0 3px var(--ring);
}
.ta{ resize: vertical; }

.span2{ grid-column: span 2; }
.span3{ grid-column: 1 / -1; }

.inline{ display: flex; gap: 10px; align-items: center; }
.small{ font-size: 12px; color: var(--muted); }
.small2{ margin-top: 6px; font-size: 12px; color: var(--muted); }

.checks{ display: flex; gap: 10px; flex-wrap: wrap; }
.check{
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: #fff;
  font-size: 12px;
  color: var(--text);
}

/* Historial */
.hitos{
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 6px;
}
@media (max-width: 980px){
  .hitos{ grid-template-columns: 1fr; }
}
.hito{
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #fff;
  padding: 10px;
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
}
.pill{
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--panel-2);
  border: 1px solid var(--border);
  font-size: 12px;
  font-weight: 800;
  color: var(--text);
}
.val{
  font-size: 12px;
  color: var(--muted);
  text-align: right;
}

.timeline{
  margin-top: 10px;
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}
.trow{
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid #eef1f4;
  background: #fff;
}
.trow:last-child{ border-bottom: none; }
.tstate{ font-weight: 800; font-size: 12px; color: var(--text); }
.tdate{ font-size: 12px; color: var(--muted); }

/* Evidencias */
.pad{ padding: 10px 12px; display: flex; flex-direction: column; gap: 10px; }
.rowtop{
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}
.leftinfo{ display: flex; flex-direction: column; gap: 6px; }

.emptyBox{
  border: 1px dashed var(--border);
  background: #fff;
  border-radius: 14px;
  padding: 12px;
  color: var(--muted);
  font-size: 12px;
}

.evCard{
  border: 1px solid var(--border);
  background: #fff;
  border-radius: 14px;
  overflow: hidden;
}
.evHead{
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid #eef1f4;
  background: #fff;
}
.evTitle{ display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.tag{
  font-size: 12px;
  color: var(--muted);
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--panel-2);
  border: 1px solid var(--border);
}

.fileBox{
  margin-top: 10px;
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 10px;
  background: var(--panel-2);
}
.fileRow{
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.preview{
  margin-top: 10px;
  width: 100%;
  max-height: 240px;
  object-fit: contain;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: #fff;
}

/* Buttons */
.btn{
  appearance: none;
  border: 1px solid var(--border);
  background: var(--panel-2);
  color: var(--text);
  padding: 8px 10px;
  border-radius: 10px;
  font-size: 12px;
  cursor: pointer;
  transition: border-color .12s ease, box-shadow .12s ease, transform .06s ease;
}
.btn:hover{
  border-color: rgba(45,164,78,.35);
  box-shadow: 0 0 0 3px var(--ring);
}
.btn:active{ transform: translateY(1px); }

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
