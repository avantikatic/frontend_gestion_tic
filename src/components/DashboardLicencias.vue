<template>
  <div class="wrap">
    <div class="head">
      <div class="headTop">
        <h3>Licencias / Proveedores / Servicios</h3>
        <span class="count">{{ listaFiltrada.length }} registro(s)</span>
      </div>

      <div class="chips">
        <button class="chip" :class="{ on: filtroEstado === 'all' }" @click="filtroEstado='all'">Todos</button>
        <button class="chip chip-red" :class="{ on: filtroEstado === 'red' }" @click="filtroEstado='red'">Críticas</button>
        <button class="chip chip-yellow" :class="{ on: filtroEstado === 'yellow' }" @click="filtroEstado='yellow'">Próximas</button>
        <button class="chip chip-green" :class="{ on: filtroEstado === 'green' }" @click="filtroEstado='green'">Vigentes</button>
        <button class="chip chip-gray" :class="{ on: filtroEstado === 'baja' }" @click="filtroEstado='baja'">Bajas</button>

        <label class="toggle">
          <input type="checkbox" v-model="ocultarBajas" />
          <span>Ocultar bajas</span>
        </label>
      </div>

      <div class="filters">
        <input v-model="q" class="search" placeholder="Buscar proveedor, producto, responsable…" />

        <select v-model="fProveedor" class="select">
          <option value="">Proveedor (Todos)</option>
          <option v-for="p in proveedoresUnicos" :key="p" :value="p">{{ p }}</option>
        </select>

        <select v-model="fFrecuencia" class="select">
          <option value="">Frecuencia (Todas)</option>
          <option value="mensual">Mensual</option>
          <option value="anual">Anual</option>
        </select>

        <select v-model="fTipoServicio" class="select">
          <option value="">Tipo (Todos)</option>
          <option v-for="t in tiposUnicos" :key="t" :value="t">{{ t }}</option>
        </select>
      </div>
    </div>

    <div class="tableWrap">
      <table class="table">
        <thead>
          <tr>
            <th style="width:44px;">E</th>
            <th style="width:120px;">Tipo</th>
            <th>Proveedor</th>
            <th>Producto/Servicio</th>
            <th style="width:78px;">Cant.</th>
            <th style="width:110px;">Vence</th>
            <th style="width:210px;">Responsable</th>
            <th style="width:160px;">Acciones</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="lic in listaFiltrada"
            :key="lic.id"
            :class="{
              selected: lic.id === selectedId,
              expired: isExpired(lic)
            }"
            @click="$emit('select', lic.id)"
          >
            <td>
              <span class="dot" :class="dotClass(lic)" :title="dotTitle(lic)"></span>
            </td>

            <td class="muted">{{ lic.tipoServicio || "—" }}</td>

            <td class="muted">
              {{ lic.proveedor || "—" }}
            </td>

            <td class="productCell">
              <div class="statusLineTrack">
                <div
                  class="statusLineFill"
                  :class="[
                    `s-${toneOf(lic)}`,
                    isExpired(lic) ? 'pulse' : ''
                  ]"
                  :style="{ width: remainingPercentOf(lic) + '%' }"
                ></div>
              </div>

              <div class="clip">{{ lic.producto || "—" }}</div>

              <div class="tiny" v-if="remainingInfo(lic).show">
                <span class="mono">
                  Restante: {{ remainingInfo(lic).pct }}% · {{ remainingInfo(lic).daysLabel }}
                </span>
              </div>
            </td>

            <td class="num">{{ lic.cantidad ?? "—" }}</td>
            <td class="muted">{{ lic.fechaVencimiento || "—" }}</td>

            <td class="muted clip">
              {{ lic.responsable?.nombre || "—" }}
              <span class="small">· {{ lic.responsable?.cargo || "—" }}</span>
            </td>

            <td class="actions">
              <button class="mini ghost" @click.stop="$emit('select', lic.id)">Editar</button>
            </td>
          </tr>

          <tr v-if="listaFiltrada.length === 0">
            <td colspan="8" class="empty">Sin resultados.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="legend">
      <span><i class="dot s-red"></i> Carmesí (≤ 10% o vencida)</span>
      <span><i class="dot s-yellow"></i> Naranja (≤ 50% y &gt; 10%)</span>
      <span><i class="dot s-green"></i> Verde (&gt; 50%)</span>
      <span><i class="dot s-baja"></i> Baja</span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  licencias: { type: Array, required: true },
  selectedId: { type: String, default: null },
});
defineEmits(["select", "quickReview"]);

const q = ref("");
const filtroEstado = ref("all");
const ocultarBajas = ref(true);

const fProveedor = ref("");
const fFrecuencia = ref("");
const fTipoServicio = ref("");

function parseISODate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfToday() {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}

function daysDiffFromToday(dateStr) {
  const d = parseISODate(dateStr);
  if (!d) return null;
  const start = startOfToday();
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
}

/* ✅ Determina vencida (fechaVencimiento < hoy) */
function isExpired(lic) {
  if (lic?.baja) return false;
  const diff = daysDiffFromToday(lic?.fechaVencimiento);
  return diff !== null && diff < 0;
}

/* ✅ Barra DECRECIENTE: % restante del ciclo compra → vence (tu lógica, intacta) */
function remainingPercentOf(lic) {
  if (lic?.baja) return 12;

  const compra = parseISODate(lic?.fechaCompra);
  const vence = parseISODate(lic?.fechaVencimiento);
  const hoy = startOfToday();

  if (!vence && !compra) return 18;
  if (!vence && compra) return 25;

  // sin compra pero con vence: fallback por proximidad (90d)
  if (vence && !compra) {
    const diff = daysDiffFromToday(lic.fechaVencimiento);
    if (diff == null) return 18;
    if (diff <= 0) return 0;
    const max = 90;
    return Math.max(6, Math.min(100, Math.round((diff / max) * 100)));
  }

  const total = vence - compra;
  if (total <= 0) return 0;

  if (hoy >= vence) return 0;
  if (hoy <= compra) return 100;

  const remaining = vence - hoy;
  const pct = Math.round((remaining / total) * 100);
  return Math.max(0, Math.min(100, pct));
}

/* ✅ Nuevo: color por porcentaje (y vencida siempre carmesí) */
function toneOf(lic) {
  if (lic?.baja) return "baja";
  if (isExpired(lic)) return "red";

  const pct = remainingPercentOf(lic);
  if (pct <= 10) return "red";
  if (pct <= 50) return "yellow";
  return "green";
}

/* Filtro por chips: usamos toneOf (en vez de stateOf por días) */
function stateOf(lic) {
  return toneOf(lic);
}

function dotClass(lic) {
  return `s-${toneOf(lic)}`;
}

function dotTitle(lic) {
  if (lic?.baja) return "Baja";
  const diff = daysDiffFromToday(lic?.fechaVencimiento);
  if (diff === null) return "Sin fecha";
  if (diff < 0) return `Vencida hace ${Math.abs(diff)} día(s)`;
  return `Vence en ${diff} día(s)`;
}

function remainingInfo(lic) {
  if (lic?.baja) return { show: true, pct: 0, daysLabel: "Baja" };

  const vence = lic?.fechaVencimiento;
  if (!vence) return { show: false, pct: 0, daysLabel: "" };

  const diff = daysDiffFromToday(vence);
  const pct = remainingPercentOf(lic);

  if (diff === null) return { show: false, pct: 0, daysLabel: "" };
  if (diff < 0) return { show: true, pct: 0, daysLabel: `Vencida hace ${Math.abs(diff)} día(s)` };
  return { show: true, pct, daysLabel: `${diff} día(s)` };
}

const proveedoresUnicos = computed(() => {
  const s = new Set((props.licencias || []).map((l) => l.proveedor).filter(Boolean));
  return Array.from(s).sort();
});

const tiposUnicos = computed(() => {
  const s = new Set((props.licencias || []).map((l) => l.tipoServicio).filter(Boolean));
  return Array.from(s).sort();
});

const listaFiltrada = computed(() => {
  const text = q.value.trim().toLowerCase();

  return (props.licencias || [])
    .filter((l) => (ocultarBajas.value ? !l.baja : true))
    .filter((l) => (filtroEstado.value === "all" ? true : stateOf(l) === filtroEstado.value))
    .filter((l) => (fProveedor.value ? (l.proveedor || "") === fProveedor.value : true))
    .filter((l) => (fFrecuencia.value ? (l.frecuencia || "") === fFrecuencia.value : true))
    .filter((l) => (fTipoServicio.value ? (l.tipoServicio || "") === fTipoServicio.value : true))
    .filter((l) => {
      if (!text) return true;
      const blob = [l.proveedor, l.producto, l.tipoServicio, l.responsable?.nombre, l.responsable?.cargo]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(text);
    });
});
</script>

<style>
.wrap{ height:100%; display:flex; flex-direction:column; background:#fff; }

.head{ padding:12px; border-bottom:1px solid #e6eaf2; background:#fff; }
.headTop{ display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:8px; }
.head h3{ margin:0; font-size:13px; color:#0f172a; }
.count{
  font-size:12px; color:#64748b;
  background:#fbfcfe; border:1px solid #e6eaf2;
  padding:5px 10px; border-radius:999px;
}

.chips{ display:flex; gap:6px; align-items:center; flex-wrap:nowrap; margin-bottom:8px; }
.chip{
  border:1px solid #e6eaf2;
  background:#fbfcfe;
  padding:5px 10px;
  border-radius:999px;
  font-size:11.5px;
  font-weight:900;
  cursor:pointer;
  color:#0f172a;
  white-space: nowrap;
}
.chip.on{ background: rgba(47,95,191,.10); border-color: rgba(47,95,191,.22); color:#1f2f4a; }

.toggle{
  margin-left:auto;
  display:flex; align-items:center; gap:6px;
  font-size:11.5px; color:#475569; font-weight:900;
  background:#fbfcfe; border:1px solid #e6eaf2;
  padding:5px 10px; border-radius:999px;
  white-space: nowrap;
}
.toggle input{ transform: translateY(1px); }

.filters{ display:flex; gap:6px; flex-wrap:nowrap; align-items:center; }
.search{
  flex:1; min-width:240px;
  padding:8px 10px;
  border-radius:12px;
  border:1px solid #e6eaf2;
  background:#fbfcfe;
  color:#0f172a;
  outline:none;
}
.search:focus{ border-color: rgba(47,95,191,.35); box-shadow: 0 0 0 3px rgba(47,95,191,.10); }
.select{
  padding:8px 10px;
  border-radius:12px;
  border:1px solid #e6eaf2;
  background:#fbfcfe;
  color:#0f172a;
  outline:none;
}

.tableWrap{ overflow:auto; padding:10px; flex:1; }

.table{
  width:100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size:12.2px;
}

th{
  text-align:left;
  font-size:11px;
  color:#fff;
  padding:8px 10px;
  background:#1f2f4a;
  border-bottom:1px solid #1b2740;
  position: sticky;
  top:0;
  z-index:1;
}
th:first-child{ border-top-left-radius:12px; }
th:last-child{ border-top-right-radius:12px; }

td{
  padding:7px 10px;
  border-bottom:1px solid #eef2f7;
  color:#0f172a;
  background:#fff;
  line-height: 1.15;
  vertical-align: middle;
}
tbody tr{ cursor:pointer; }
tbody tr:hover td{ background:#f8fafc; }

tbody tr.selected td{
  background: rgba(47,95,191,.08);
  border-bottom-color: rgba(47,95,191,.14);
}

/* ✅ NUEVO: vencidas → texto carmesí + subrayado */
tbody tr.expired td{
  color:#8b1d2c !important;
  text-decoration: underline;
  text-decoration-color:#8b1d2c;
  text-decoration-thickness: 2px;
}
tbody tr.expired td .small,
tbody tr.expired td .tiny{
  color:#8b1d2c !important;
  opacity:.95;
}

.muted{ color:#475569; }
.small{ font-size:11px; color:#64748b; }
.tiny{ font-size:11px; color:#64748b; margin-top:4px; }
.mono{ font-variant-numeric: tabular-nums; }
.num{ text-align:right; font-variant-numeric: tabular-nums; }

.clip{
  max-width: 340px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dot{
  width:10px; height:10px; border-radius:999px;
  display:inline-block;
  border:1px solid rgba(15,23,42,.14);
  background: rgba(15,23,42,.08);
}

/* ✅ Ajuste carmesí más “corporativo” */
.dot.s-red{ background: #8b1d2c; border-color: rgba(139,29,44,.35); }
.dot.s-yellow{ background: #f59e0b; border-color: rgba(245,158,11,.35); }
.dot.s-green{ background: #22c55e; border-color: rgba(34,197,94,.35); }
.dot.s-baja{ background: rgba(100,116,139,.9); border-color: rgba(100,116,139,.35); }
.dot.s-unknown{ background: rgba(15,23,42,.18); border-color: rgba(15,23,42,.10); }

.productCell{ min-width: 320px; }
.statusLineTrack{
  height: 4px;
  border-radius: 999px;
  background: #eef2f7;
  border: 1px solid #e6eaf2;
  overflow: hidden;
  margin-bottom: 6px;
}
.statusLineFill{ height:100%; border-radius:999px; }
.statusLineFill.s-red{ background:#8b1d2c; }
.statusLineFill.s-yellow{ background:#f59e0b; }
.statusLineFill.s-green{ background:#22c55e; }
.statusLineFill.s-baja{ background: rgba(100,116,139,.75); }
.statusLineFill.s-unknown{ background: rgba(100,116,139,.45); }

/* ✅ Pulso suave SOLO para vencidas/carmesí */
.statusLineFill.pulse{
  animation: pulseRed 1.6s ease-in-out infinite;
}
@keyframes pulseRed{
  0%   { opacity: .92; filter: saturate(1) brightness(1); box-shadow: 0 0 0 rgba(139,29,44,0); }
  50%  { opacity: 1;   filter: saturate(1.05) brightness(1.05); box-shadow: 0 0 12px rgba(139,29,44,.28); }
  100% { opacity: .92; filter: saturate(1) brightness(1); box-shadow: 0 0 0 rgba(139,29,44,0); }
}

.actions{ display:flex; gap:8px; justify-content:flex-end; }
.mini{
  border:1px solid rgba(139,29,44,.18);
  background: rgba(139,29,44,.08);
  color:#7f1d1d;
  padding:6px 8px;
  border-radius:12px;
  font-size:11px;
  font-weight:900;
  cursor:pointer;
}
.mini:hover{ background: rgba(139,29,44,.12); }
.mini.ghost{
  border:1px solid #e6eaf2;
  background:#fbfcfe;
  color:#1f2f4a;
}
.mini.ghost:hover{ background:#fff; border-color:#d8deea; }

.empty{ text-align:center; color:#64748b; padding:14px 10px; }

.legend{
  padding:8px 12px;
  border-top:1px solid #e6eaf2;
  display:flex;
  gap:12px;
  flex-wrap:wrap;
  font-size:12px;
  color:#64748b;
  background:#fff;
}
.legend i.dot{ transform: translateY(1px); margin-right:6px; }
</style>
