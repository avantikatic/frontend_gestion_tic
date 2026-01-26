<template>
  <div class="app">
    <header class="topbar">
      <div class="brand">
        <div class="logo">FTC</div>
        <div class="title">
          <h1>Control de Licencias</h1>
          <p>Formato FTC-248 · Prototipo</p>
        </div>
      </div>

      <div class="actions">
        <button class="btn" @click="copyResumen">Copiar resumen</button>
        <button class="btn" @click="downloadCSV">Descargar CSV</button>
        <button class="btn" @click="openRevisiones = true">Revisiones</button>
        <button class="btn btn-primary" @click="crearNuevaLicencia">+ Nueva</button>
      </div>
    </header>

    <main class="content">
      <section class="panel">
        <KpiResumen :licencias="licencias" />
      </section>

      <section class="panel">
        <DashboardLicencias
          :licencias="licencias"
          :selectedId="selectedId"
          @select="abrirEdicion"
        />
      </section>
    </main>

    <footer class="footer">
      <span>© {{ new Date().getFullYear() }} · Gestión TIC</span>
    </footer>

    <!-- MODAL: Formulario licencia -->
    <div v-if="modal.open" class="modalBackdrop" @click.self="cerrarModal">
      <div class="modal">
        <div class="modalHead">
          <div>
            <h2 class="modalTitle">
              {{ modal.mode === "create" ? "Nueva licencia/servicio" : "Editar licencia/servicio" }}
            </h2>
            <p class="modalSub">
              {{ modalDraft?.proveedor || "Sin proveedor" }}
              <span v-if="modalDraft?.producto">· {{ modalDraft.producto }}</span>
              <span v-if="modalDraft?.tipoServicio">· {{ modalDraft.tipoServicio }}</span>
              <span v-if="modal.mode === 'edit' && licenciaSeleccionada?.baja" class="bajaBadge">
                · BAJA
              </span>
            </p>
          </div>

          <div class="modalActions">
            <!-- ✅ Upgrade pro: Baja / Reactivar (solo en edit) -->
            <button
              v-if="modal.mode === 'edit' && !licenciaSeleccionada?.baja"
              class="btnDanger"
              @click="openBaja = true"
            >
              Dar de baja
            </button>

            <button
              v-if="modal.mode === 'edit' && licenciaSeleccionada?.baja"
              class="btnWarn"
              @click="reactivarServicio"
              title="Reactivar servicio (quita estado de baja)"
            >
              Reactivar
            </button>

            <button class="iconBtn" @click="cerrarModal" aria-label="Cerrar">✕</button>
          </div>
        </div>

        <div class="modalBody">
          <FormularioLicencia
            v-if="modalDraft"
            :modelValue="modalDraft"
            :proveedores="proveedores"
            :productos="productos"
            @update:modelValue="(v) => (modalDraft = v)"
            @save="guardarDesdeModal"
            @cancel="cerrarModal"
            @createProveedor="agregarProveedor"
            @createProducto="agregarProducto"
          />

          <!-- ✅ Historial por licencia (solo lectura) -->
          <div v-if="modal.mode === 'edit' && licenciaSeleccionada?.historial?.length" class="historyCard">
            <div class="historyHead">
              <h3>Historial de cambios</h3>
              <p>Registro automático de modificaciones realizadas sobre este servicio.</p>
            </div>

            <div class="historyTableWrap">
              <table class="historyTable">
                <thead>
                  <tr>
                    <th style="width:170px;">Fecha</th>
                    <th style="width:160px;">Usuario</th>
                    <th style="width:120px;">Acción</th>
                    <th>Cambios</th>
                  </tr>
                </thead>

                <tbody>
                  <tr v-for="h in licenciaSeleccionada.historial" :key="h.id">
                    <td class="mono">{{ fmtTS(h.ts) }}</td>
                    <td>{{ h.usuario || "Sistema" }}</td>
                    <td class="pill">{{ h.accion }}</td>
                    <td class="changes">
                      <div v-for="c in h.cambios" :key="c.campo" class="chg">
                        <b>{{ c.campo }}:</b>
                        <span class="old">{{ humanValue(c.antes) }}</span>
                        <span class="arrow">→</span>
                        <span class="new">{{ humanValue(c.despues) }}</span>
                      </div>
                    </td>
                  </tr>

                  <tr v-if="!licenciaSeleccionada.historial.length">
                    <td colspan="4" class="empty2">Sin historial.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- MODAL: Dar de baja (motivo) -->
    <div v-if="openBaja" class="modalBackdrop" @click.self="openBaja = false">
      <div class="miniModal">
        <div class="miniHead">
          <div>
            <h3>Dar de baja servicio</h3>
            <p>Esto marcará el servicio como baja. Quedará registro automático en historial.</p>
          </div>
          <button class="iconBtn" @click="openBaja = false">✕</button>
        </div>

        <div class="miniBody">
          <label class="lbl">Motivo de baja</label>
          <textarea v-model="motivoBajaDraft" class="ta" rows="3" placeholder="Ej: Servicio reemplazado / ya no aplica / cambio de proveedor…"></textarea>

          <div class="miniActions">
            <button class="btn" @click="openBaja = false">Cancelar</button>
            <button class="btnDanger" @click="confirmarBaja">Confirmar baja</button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL: Revisiones generales (GLOBAL) -->
    <div v-if="openRevisiones" class="modalBackdrop" @click.self="openRevisiones = false">
      <div class="modal modalWide">
        <div class="modalHead">
          <div>
            <h2 class="modalTitle">Revisiones generales</h2>
            <p class="modalSub">Bitácora global del control (no por licencia).</p>
          </div>
          <button class="iconBtn" @click="openRevisiones = false" aria-label="Cerrar">✕</button>
        </div>

        <div class="modalBody">
          <ControlRevisiones
            :revisiones="revisiones"
            @add="agregarRevisionGlobal"
            @delete="eliminarRevisionGlobal"
          />
        </div>
      </div>
    </div>

    <div v-if="toast.show" class="toast">{{ toast.msg }}</div>
  </div>
</template>

<script setup>
import { computed, ref, toRaw, onMounted } from "vue";
import DashboardLicencias from "../components/DashboardLicencias.vue";
import FormularioLicencia from "../components/FormularioLicencia.vue";
import ControlRevisiones from "../components/ControlRevisiones.vue";
import KpiResumen from "../components/KpiResumen.vue";
import apiUrl from "../../config.js"

const API_BASE_URL = `${apiUrl}/licencias`;

const cloneSafe = (obj) => JSON.parse(JSON.stringify(toRaw(obj)));
const uid = () => (crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(16).slice(2)}`);

const usuarioActual = ref("Jeyson Martinez");

const proveedores = ref([]);
const productos = ref([]);
const tiposServicio = ref([]);
const metodosPago = ref([]);

const licencias = ref([]);

const revisiones = ref([
  {
    id: uid(),
    fecha: "2026-01-10",
    tipo: "Auditoría general",
    observaciones: "Revisión mensual general de vencimientos y ajustes pendientes.",
    usuario: "Jeyson Martinez",
  },
]);

const selectedId = ref(null);
const modal = ref({ open: false, mode: "edit", licenseId: null });
const openRevisiones = ref(false);
const modalDraft = ref(null);

/* ✅ Baja */
const openBaja = ref(false);
const motivoBajaDraft = ref("");

const toast = ref({ show: false, msg: "" });
function showToast(msg) {
  toast.value = { show: true, msg };
  setTimeout(() => (toast.value.show = false), 2200);
}

// ===================================================
// FUNCIONES PARA CARGAR DATOS DESDE EL BACKEND
// ===================================================

async function cargarCatalogos() {
  try {
    // Cargar tipos de servicio
    const resTipos = await fetch(`${API_BASE_URL}/catalogos/tipos-servicio`);
    if (resTipos.ok) {
      const dataTipos = await resTipos.json();
      if (dataTipos.status === 200) {
        tiposServicio.value = dataTipos.data.map(t => t.nombre);
      }
    }

    // Cargar proveedores
    const resProv = await fetch(`${API_BASE_URL}/catalogos/proveedores`);
    if (resProv.ok) {
      const dataProv = await resProv.json();
      if (dataProv.status === 200) {
        proveedores.value = dataProv.data.map(p => p.nombre);
      }
    }

    // Cargar productos/servicios
    const resProd = await fetch(`${API_BASE_URL}/catalogos/productos-servicios`);
    if (resProd.ok) {
      const dataProd = await resProd.json();
      if (dataProd.status === 200) {
        productos.value = dataProd.data.map(p => p.nombre);
      }
    }

    // Cargar métodos de pago
    const resMet = await fetch(`${API_BASE_URL}/catalogos/metodos-pago`);
    if (resMet.ok) {
      const dataMet = await resMet.json();
      if (dataMet.status === 200) {
        metodosPago.value = dataMet.data.map(m => m.nombre);
      }
    }
  } catch (error) {
    console.error("Error cargando catálogos:", error);
    showToast("Error cargando catálogos del servidor.");
  }
}

async function cargarLicencias() {
  try {
    const response = await fetch(`${API_BASE_URL}/obtener?incluir_bajas=true`);
    if (response.ok) {
      const data = await response.json();
      if (data.status === 200) {
        licencias.value = data.data;
      }
    }
  } catch (error) {
    console.error("Error cargando licencias:", error);
    showToast("Error cargando licencias del servidor.");
  }
}

// Cargar datos al montar el componente
onMounted(() => {
  cargarCatalogos();
  cargarLicencias();
});

const licenciaById = computed(() => {
  const m = new Map();
  for (const l of licencias.value) m.set(l.id, l);
  return m;
});

const licenciaSeleccionada = computed(() => {
  if (!modal.value.open || modal.value.mode !== "edit") return null;
  return licenciaById.value.get(modal.value.licenseId) || null;
});

function abrirEdicion(id) {
  selectedId.value = id;
  const lic = licenciaById.value.get(id);
  if (!lic) return;

  modal.value = { open: true, mode: "edit", licenseId: id };
  modalDraft.value = cloneSafe(lic);
}

function crearNuevaLicencia() {
  modal.value = { open: true, mode: "create", licenseId: null };
  modalDraft.value = {
    id: uid(),
    tipoServicio: "Licencia",
    proveedor: "",
    producto: "",
    cantidad: 1,
    frecuencia: "anual",
    fechaCompra: "",
    fechaVencimiento: "",
    valor: 0,
    metodoPago: "Renovación PSE",
    responsable: { nombre: "Jeyson Martinez", cargo: "Coordinador TIC" },
    observaciones: "",
    baja: false,
    fechaBaja: null,
    motivoBaja: null,
    historial: [],
  };
}

function cerrarModal() {
  modal.value.open = false;
  modal.value.licenseId = null;
  modalDraft.value = null;
  openBaja.value = false;
  motivoBajaDraft.value = "";
}

/* =========================
   ✅ HISTORIAL AUTOMÁTICO
========================= */
const AUDIT_FIELDS = [
  "tipoServicio","proveedor","producto","cantidad","frecuencia",
  "fechaCompra","fechaVencimiento","valor","metodoPago","observaciones",
  "baja","fechaBaja","motivoBaja",
  "responsable.nombre","responsable.cargo",
];

function getByPath(obj, path) {
  return path.split(".").reduce((acc, k) => (acc ? acc[k] : undefined), obj);
}

function buildHistDiff(before, after) {
  const cambios = [];
  for (const p of AUDIT_FIELDS) {
    const a = getByPath(before, p) ?? "";
    const b = getByPath(after, p) ?? "";
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      cambios.push({ campo: p, antes: a, despues: b });
    }
  }
  return cambios;
}

function pushHistorial(lic, entry) {
  if (!lic.historial) lic.historial = [];
  lic.historial.unshift(entry);
}

function guardarDesdeModal(payload) {
  if (modal.value.mode === "create") {
    const nuevo = cloneSafe(payload);
    if (!nuevo.historial) nuevo.historial = [];

    pushHistorial(nuevo, {
      id: uid(),
      ts: new Date().toISOString(),
      usuario: usuarioActual.value,
      accion: "Creación",
      cambios: [{ campo: "registro", antes: "", despues: "Creado" }],
    });

    licencias.value.unshift(nuevo);
    selectedId.value = nuevo.id;

    showToast("Licencia/servicio creado.");
    cerrarModal();
    return;
  }

  const idx = licencias.value.findIndex((l) => l.id === payload.id);
  if (idx < 0) {
    showToast("No se encontró el registro.");
    cerrarModal();
    return;
  }

  const before = cloneSafe(licencias.value[idx]);
  const after = cloneSafe(payload);

  const historialExistente = licencias.value[idx].historial || [];
  licencias.value[idx] = { ...after, historial: historialExistente };

  const cambios = buildHistDiff(before, after);
  if (cambios.length) {
    pushHistorial(licencias.value[idx], {
      id: uid(),
      ts: new Date().toISOString(),
      usuario: usuarioActual.value,
      accion: "Edición",
      cambios,
    });
  }

  showToast("Cambios guardados.");
  cerrarModal();
}

/* =========================
   ✅ Baja / Reactivar (desde modal)
========================= */
function confirmarBaja() {
  const lic = licenciaSeleccionada.value;
  if (!lic) return;

  const idx = licencias.value.findIndex((l) => l.id === lic.id);
  if (idx < 0) return;

  const before = cloneSafe(licencias.value[idx]);

  const now = new Date();
  const after = {
    ...cloneSafe(licencias.value[idx]),
    baja: true,
    fechaBaja: now.toISOString().slice(0, 10),
    motivoBaja: (motivoBajaDraft.value || "Sin motivo").trim(),
  };

  // actualizar y registrar historial
  licencias.value[idx] = { ...after, historial: licencias.value[idx].historial || [] };

  const cambios = buildHistDiff(before, after);
  if (cambios.length) {
    pushHistorial(licencias.value[idx], {
      id: uid(),
      ts: now.toISOString(),
      usuario: usuarioActual.value,
      accion: "Baja",
      cambios,
    });
  }

  // si estás editando, refresca el draft para que lo veas instantáneo
  modalDraft.value = cloneSafe(licencias.value[idx]);

  openBaja.value = false;
  motivoBajaDraft.value = "";
  showToast("Servicio marcado como baja.");
}

function reactivarServicio() {
  const lic = licenciaSeleccionada.value;
  if (!lic) return;

  const idx = licencias.value.findIndex((l) => l.id === lic.id);
  if (idx < 0) return;

  const before = cloneSafe(licencias.value[idx]);

  const now = new Date();
  const after = {
    ...cloneSafe(licencias.value[idx]),
    baja: false,
    fechaBaja: null,
    motivoBaja: null,
  };

  licencias.value[idx] = { ...after, historial: licencias.value[idx].historial || [] };

  const cambios = buildHistDiff(before, after);
  if (cambios.length) {
    pushHistorial(licencias.value[idx], {
      id: uid(),
      ts: now.toISOString(),
      usuario: usuarioActual.value,
      accion: "Reactivación",
      cambios,
    });
  }

  modalDraft.value = cloneSafe(licencias.value[idx]);
  showToast("Servicio reactivado.");
}

/* =========================
   ✅ Revisiones GENERALES
========================= */
function agregarRevisionGlobal(payload) {
  revisiones.value.unshift({
    id: uid(),
    fecha: payload.fecha,
    tipo: payload.tipo,
    observaciones: payload.observaciones,
    usuario: usuarioActual.value,
  });
  showToast("Revisión general registrada.");
}

function eliminarRevisionGlobal(id) {
  revisiones.value = revisiones.value.filter((r) => r.id !== id);
  showToast("Revisión eliminada.");
}

/* Catálogos */
async function agregarProveedor(nombre) {
  const clean = (nombre || "").trim();
  if (!clean) return;
  
  try {
    const response = await fetch(`${API_BASE_URL}/catalogos/proveedores/crear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: clean })
    });
    
    const data = await response.json();
    
    if (data.status === 201 || data.status === 400) {
      // Si se creó o ya existe, agregarlo a la lista si no está
      if (!proveedores.value.includes(clean)) {
        proveedores.value.push(clean);
      }
      showToast(data.message);
    } else {
      showToast("Error al crear proveedor.");
    }
  } catch (error) {
    console.error("Error creando proveedor:", error);
    showToast("Error al conectar con el servidor.");
  }
}

async function agregarProducto(nombre) {
  const clean = (nombre || "").trim();
  if (!clean) return;
  
  try {
    const response = await fetch(`${API_BASE_URL}/catalogos/productos-servicios/crear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: clean })
    });
    
    const data = await response.json();
    
    if (data.status === 201 || data.status === 400) {
      // Si se creó o ya existe, agregarlo a la lista si no está
      if (!productos.value.includes(clean)) {
        productos.value.push(clean);
      }
      showToast(data.message);
    } else {
      showToast("Error al crear producto/servicio.");
    }
  } catch (error) {
    console.error("Error creando producto/servicio:", error);
    showToast("Error al conectar con el servidor.");
  }
}

/* Helpers UI */
function fmtTS(ts) {
  if (!ts) return "—";
  return ts.replace("T"," ").slice(0,19);
}
function humanValue(v) {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Sí" : "No";
  return String(v);
}

function formatCurrencyCOP(n) {
  const v = Number(n || 0);
  return v.toLocaleString("es-CO");
}

/* Export / resumen */
function copyResumen() {
  const lines = [];
  lines.push("Resumen Control de Licencias (FTC-248)");
  lines.push(`Fecha: ${new Date().toISOString().slice(0, 10)}`);
  lines.push("");

  for (const l of licencias.value) {
    lines.push(
      [
        `Proveedor: ${l.proveedor || "—"}`,
        `Producto: ${l.producto || "—"}`,
        `Tipo: ${l.tipoServicio || "—"}`,
        `Compra: ${l.fechaCompra || "—"}`,
        `Vence: ${l.fechaVencimiento || "—"}`,
        `Valor: ${formatCurrencyCOP(l.valor)}`,
        `Frecuencia: ${l.frecuencia || "—"}`,
        `Método pago: ${l.metodoPago || "—"}`,
        `Responsable: ${l.responsable?.nombre || "—"} - ${l.responsable?.cargo || "—"}`,
        `Baja: ${l.baja ? "Sí" : "No"}`,
      ].join(" | ")
    );
  }

  const text = lines.join("\n");
  navigator.clipboard?.writeText?.(text)
    .then(() => showToast("Resumen copiado al portapapeles."))
    .catch(() => showToast("No se pudo copiar. Revisa permisos del navegador."));
}

function downloadCSV() {
  const headers = [
    "id","tipoServicio","proveedor","producto","cantidad","frecuencia",
    "fechaCompra","fechaVencimiento","valor","metodoPago",
    "responsableNombre","responsableCargo","baja","fechaBaja","motivoBaja",
  ];

  const rows = licencias.value.map((l) => [
    l.id,
    l.tipoServicio || "",
    l.proveedor || "",
    l.producto || "",
    l.cantidad ?? "",
    l.frecuencia || "",
    l.fechaCompra || "",
    l.fechaVencimiento || "",
    Number(l.valor || 0),
    l.metodoPago || "",
    l.responsable?.nombre || "",
    l.responsable?.cargo || "",
    l.baja ? "SI" : "NO",
    l.fechaBaja || "",
    (l.motivoBaja || "").replaceAll("\n", " "),
  ]);

  const esc = (v) => {
    const s = String(v ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replaceAll('"', '""')}"`;
    return s;
  };

  const csv = [headers.join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `control_licencias_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);

  showToast("CSV descargado.");
}
</script>

<style>
:root{
  --bg:#f5f7fb;
  --surface:#ffffff;
  --surface-2:#fbfcfe;
  --text:#0f172a;
  --muted:#64748b;
  --line:#e6eaf2;

  --navy:#1f2f4a;
  --navy-2:#223a63;

  --radius:14px;
  --shadow:0 10px 30px rgba(15, 23, 42, .06);

  --crimson:#8b1d2c;
}

*{ box-sizing:border-box; }
body{
  margin:0;
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
  background:var(--bg);
  color:var(--text);
}

.app{ min-height:100vh; display:flex; flex-direction:column; }

.topbar{
  display:flex; align-items:center; justify-content:space-between;
  padding:12px 16px;
  background:var(--surface);
  border-bottom:1px solid var(--line);
}
.brand{ display:flex; gap:12px; align-items:center; }
.logo{
  width:40px; height:40px; border-radius:12px;
  display:grid; place-items:center;
  background: linear-gradient(135deg, var(--navy), var(--navy-2));
  color:#fff; font-weight:900;
}
.title h1{ margin:0; font-size:15px; }
.title p{ margin:2px 0 0; font-size:12px; color:var(--muted); }

.actions{ display:flex; gap:8px; flex-wrap:wrap; }

.content{
  padding:12px;
  flex:1;
  display:flex;
  flex-direction:column;
  gap:10px;
}

.panel{
  background:var(--surface);
  border:1px solid var(--line);
  border-radius:var(--radius);
  overflow:hidden;
  box-shadow: var(--shadow);
}

.btn{
  border:1px solid var(--line);
  background:var(--surface-2);
  color:var(--text);
  padding:8px 10px;
  border-radius:12px;
  cursor:pointer;
  font-weight:900;
  font-size:12px;
}
.btn:hover{ background:#fff; border-color:#d8deea; }
.btn-primary{
  background: linear-gradient(135deg, var(--navy), var(--navy-2));
  border-color: rgba(31,47,74,.35);
  color:#fff;
}

.footer{
  padding:10px 14px;
  border-top:1px solid var(--line);
  color:var(--muted);
  font-size:12px;
  background:var(--surface);
}

/* Modal */
.modalBackdrop{
  position:fixed;
  inset:0;
  background: rgba(15,23,42,.38);
  display:flex;
  align-items:center;
  justify-content:center;
  padding:14px;
  z-index: 50;
}

.modal{
  width: min(980px, 100%);
  max-height: 90vh;
  background:#fff;
  border:1px solid var(--line);
  border-radius: 16px;
  box-shadow: 0 30px 90px rgba(15,23,42,.30);
  overflow:hidden;
  display:flex;
  flex-direction:column;
}
.modalWide{ width: min(1600px, 100%); }

.modalHead{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:10px;
  padding:14px 16px;
  border-bottom:1px solid var(--line);
  background: var(--surface);
}
.modalTitle{ margin:0; font-size:14px; }
.modalSub{ margin:6px 0 0; font-size:12px; color:var(--muted); }

.modalActions{ display:flex; gap:8px; align-items:center; }

.bajaBadge{
  color: var(--crimson);
  font-weight: 900;
}

/* Buttons */
.iconBtn{
  border:1px solid var(--line);
  background: var(--surface-2);
  border-radius: 12px;
  padding:7px 10px;
  cursor:pointer;
  font-weight:900;
}
.iconBtn:hover{ background:#fff; border-color:#d8deea; }

.btnDanger{
  border:1px solid rgba(139,29,44,.25);
  background: rgba(139,29,44,.10);
  color: var(--crimson);
  padding:8px 10px;
  border-radius:12px;
  cursor:pointer;
  font-weight: 900;
  font-size:12px;
}
.btnDanger:hover{ background: rgba(139,29,44,.14); }

.btnWarn{
  border:1px solid rgba(245,158,11,.25);
  background: rgba(245,158,11,.12);
  color: #92400e;
  padding:8px 10px;
  border-radius:12px;
  cursor:pointer;
  font-weight: 900;
  font-size:12px;
}
.btnWarn:hover{ background: rgba(245,158,11,.16); }

/* Body */
.modalBody{
  padding:14px 16px;
  display:block;
  width:100%;
  overflow:auto;
  overflow-x:hidden;
}

/* Mini modal baja */
.miniModal{
  width: min(720px, 100%);
  background:#fff;
  border:1px solid var(--line);
  border-radius: 16px;
  box-shadow: 0 30px 90px rgba(15,23,42,.30);
  overflow:hidden;
}
.miniHead{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:10px;
  padding:12px 14px;
  border-bottom:1px solid var(--line);
  background: var(--surface);
}
.miniHead h3{ margin:0; font-size:13px; }
.miniHead p{ margin:6px 0 0; font-size:12px; color:var(--muted); }
.miniBody{ padding:12px 14px; }
.lbl{ display:block; font-size:12px; font-weight:900; color:#475569; margin-bottom:6px; }
.ta{
  width:100%;
  border:1px solid var(--line);
  border-radius:12px;
  padding:10px;
  font-size:12px;
  outline:none;
  background: var(--surface-2);
}
.ta:focus{ border-color: rgba(47,95,191,.35); box-shadow: 0 0 0 3px rgba(47,95,191,.10); }

.miniActions{ display:flex; gap:8px; justify-content:flex-end; margin-top:10px; }

/* Historial */
.historyCard{
  margin-top:12px;
  border:1px solid var(--line);
  border-radius:14px;
  background:#fff;
  overflow:hidden;
}
.historyHead{
  padding:10px 12px;
  border-bottom:1px solid var(--line);
  background: var(--surface-2);
}
.historyHead h3{ margin:0; font-size:13px; color:var(--text); }
.historyHead p{ margin:6px 0 0; font-size:12px; color:var(--muted); }

.historyTableWrap{ overflow:auto; }
.historyTable{
  width:100%;
  border-collapse:separate;
  border-spacing:0;
  font-size:12px;
  min-width: 900px;
}
.historyTable th{
  background: var(--navy);
  color:#fff;
  font-size:11px;
  padding:8px 10px;
  position: sticky;
  top:0;
}
.historyTable td{
  padding:8px 10px;
  border-bottom:1px solid #eef2f7;
  vertical-align:top;
}
.mono{ font-variant-numeric: tabular-nums; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
.pill{ font-weight:900; color:#1f2f4a; }
.changes{ min-width: 380px; }
.chg{ margin:2px 0; }
.old{ color:#64748b; }
.arrow{ color:#94a3b8; margin:0 6px; }
.new{ color:#0f172a; font-weight:900; }
.empty2{ text-align:center; color:var(--muted); padding:12px; }

/* Toast */
.toast{
  position: fixed;
  right: 14px;
  bottom: 14px;
  background: rgba(15,23,42,.92);
  color:#fff;
  padding:10px 12px;
  border-radius: 12px;
  font-size:12px;
  font-weight:800;
  box-shadow: 0 18px 50px rgba(15,23,42,.35);
  z-index: 80;
}
</style>
