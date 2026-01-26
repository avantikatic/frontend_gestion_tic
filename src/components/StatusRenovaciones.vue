<template>
  <div class="wrap">
    <div class="head">
      <div>
        <h3>Estado de renovaciones</h3>
        <p>Barras por licencia según el tiempo restante para renovar.</p>
      </div>

      <div class="summary">
        <span class="chip chip-crimson">Críticas: {{ counts.red }}</span>
        <span class="chip chip-orange">Próximas: {{ counts.yellow }}</span>
        <span class="chip chip-green">Vigentes: {{ counts.green }}</span>
      </div>
    </div>

    <div class="list">
      <div v-for="item in items" :key="item.id" class="row">
        <div class="meta" @click="$emit('select', item.id)" title="Click para abrir el formulario">
          <div class="name">
            <span class="provider">{{ item.proveedor || "—" }}</span>
            <span class="dot">·</span>
            <span class="product">{{ item.producto || "—" }}</span>
          </div>

          <div class="sub">
            <span class="date">Vence: {{ item.fechaVencimiento || "—" }}</span>
            <span class="sep">·</span>
            <span class="days" :class="`t-${item.state}`">{{ item.label }}</span>
          </div>
        </div>

        <div class="bar">
          <div class="barTrack">
            <div class="barFill" :class="`s-${item.state}`" :style="{ width: item.percent + '%' }"></div>
          </div>

          <button
            v-if="item.state === 'red' || item.state === 'yellow'"
            class="mini"
            @click="$emit('quickReview', { licenseId: item.id, tipo: 'Próxima a vencer' })"
            title="Registrar revisión rápida"
          >
            Crear revisión
          </button>
        </div>
      </div>

      <div v-if="items.length === 0" class="empty">No hay licencias registradas.</div>
    </div>

    <div class="legend">
      <span><i class="sw s-red"></i> Carmesí (vencida o &lt; 8 días)</span>
      <span><i class="sw s-yellow"></i> Naranja (&lt; 30 días)</span>
      <span><i class="sw s-green"></i> Verde (vigente)</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  licencias: { type: Array, required: true },
});
defineEmits(["select", "quickReview"]);

function parseISODate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  return Number.isNaN(d.getTime()) ? null : d;
}
function daysDiffFromToday(dateStr) {
  const d = parseISODate(dateStr);
  if (!d) return null;
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
}
function semaforoState(lic) {
  if (lic?.baja) return "baja";
  if (!lic?.fechaVencimiento) return "unknown";
  const diff = daysDiffFromToday(lic.fechaVencimiento);
  if (diff === null) return "unknown";
  if (diff < 0) return "red";
  if (diff < 8) return "red";
  if (diff < 30) return "yellow";
  return "green";
}
function labelByState(state, diff) {
  if (state === "baja") return "Dado de baja";
  if (state === "unknown") return "Sin fecha";
  if (diff == null) return "—";
  if (diff < 0) return `Vencida (${Math.abs(diff)}d)`;
  return `Faltan ${diff} día(s)`;
}
function percentFromDiff(diff, state) {
  if (state === "unknown") return 18;
  if (state === "baja") return 12;
  if (diff == null) return 18;
  if (diff <= 0) return 100;
  const max = 90;
  return Math.max(6, Math.min(100, Math.round((diff / max) * 100)));
}

const items = computed(() => {
  const base = (props.licencias || []).map((l) => {
    const diff = daysDiffFromToday(l.fechaVencimiento);
    const state = semaforoState(l);
    return { ...l, diff, state, label: labelByState(state, diff), percent: percentFromDiff(diff, state) };
  });

  const weight = (s) => (s === "red" ? 1 : s === "yellow" ? 2 : s === "green" ? 3 : s === "baja" ? 4 : 5);
  return base.sort((a, b) => {
    const wa = weight(a.state);
    const wb = weight(b.state);
    if (wa !== wb) return wa - wb;
    const ad = a.diff ?? 999999;
    const bd = b.diff ?? 999999;
    return ad - bd;
  });
});

const counts = computed(() => {
  const c = { red: 0, yellow: 0, green: 0 };
  for (const it of items.value) {
    if (it.state === "red") c.red++;
    if (it.state === "yellow") c.yellow++;
    if (it.state === "green") c.green++;
  }
  return c;
});
</script>

<style>
.wrap{ background:#fff; }

.head{
  padding:12px;
  border-bottom:1px solid #e6eaf2;
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
  gap:12px;
}
.head h3{ margin:0; font-size:13px; color:#0f172a; }
.head p{ margin:6px 0 0; font-size:12px; color:#64748b; }

.summary{ display:flex; gap:8px; flex-wrap:wrap; }
.chip{
  font-size:12px;
  padding:6px 10px;
  border-radius:999px;
  border:1px solid #e6eaf2;
  background:#fbfcfe;
  font-weight:900;
}
.chip-crimson{ background: rgba(180,35,42,.10); border-color: rgba(180,35,42,.22); color:#7f1d1d; }
.chip-orange{ background: rgba(245,158,11,.12); border-color: rgba(245,158,11,.22); color:#92400e; }
.chip-green{ background: rgba(34,197,94,.10); border-color: rgba(34,197,94,.22); color:#166534; }

.list{ padding:10px 12px 12px; display:flex; flex-direction:column; gap:8px; }
.row{
  display:grid;
  grid-template-columns: 1fr 330px;
  gap:12px;
  align-items:center;
  padding:10px 12px;
  border:1px solid #e6eaf2;
  border-radius:14px;
  background:#fbfcfe;
}
.row:hover{ background:#fff; border-color:#d8deea; }

.meta{ min-width:0; cursor:pointer; }
.name{
  display:flex; align-items:center; gap:8px;
  font-size:12.5px;
  font-weight:1000;
  color:#0f172a;
  min-width:0;
}
.provider{ color:#1f2f4a; }
.product{
  font-weight:900;
  color:#0f172a;
  min-width:0;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}
.dot{ color:#94a3b8; font-weight:700; }

.sub{
  margin-top:4px;
  font-size:12px;
  color:#64748b;
  display:flex; gap:8px; align-items:center;
}
.sep{ color:#cbd5e1; }
.days{ font-weight:1000; }
.days.t-red{ color:#7f1d1d; }
.days.t-yellow{ color:#92400e; }
.days.t-green{ color:#166534; }
.days.t-baja{ color:#334155; }
.days.t-unknown{ color:#64748b; }

.bar{ display:flex; gap:10px; align-items:center; }
.barTrack{
  flex:1;
  height:10px;
  border-radius:999px;
  background: #eef2f7;
  overflow:hidden;
  border:1px solid #e6eaf2;
}
.barFill{ height:100%; border-radius:999px; }
.barFill.s-red{ background: #b4232a; }
.barFill.s-yellow{ background: #f59e0b; }
.barFill.s-green{ background: #22c55e; }
.barFill.s-baja{ background: rgba(100,116,139,.65); }
.barFill.s-unknown{ background: rgba(100,116,139,.45); }

.mini{
  border:1px solid rgba(180,35,42,.18);
  background: rgba(180,35,42,.08);
  color:#7f1d1d;
  padding:7px 9px;
  border-radius:12px;
  font-size:11px;
  font-weight:1000;
  cursor:pointer;
  white-space:nowrap;
}
.mini:hover{ background: rgba(180,35,42,.12); }

.empty{
  padding:14px 10px;
  color:#64748b;
  text-align:center;
  border:1px dashed #e6eaf2;
  border-radius:14px;
  background:#fff;
}

.legend{
  padding:10px 12px 12px;
  border-top:1px solid #e6eaf2;
  display:flex;
  gap:14px;
  flex-wrap:wrap;
  font-size:12px;
  color:#64748b;
}
.sw{
  width:10px; height:10px; border-radius:999px;
  display:inline-block;
  margin-right:8px;
  transform: translateY(1px);
}
.sw.s-red{ background:#b4232a; }
.sw.s-yellow{ background:#f59e0b; }
.sw.s-green{ background:#22c55e; }

@media (max-width: 900px){
  .row{ grid-template-columns: 1fr; }
}
</style>
