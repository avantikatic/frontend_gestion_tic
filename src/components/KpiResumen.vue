<template>
  <div class="wrap">
    <div class="head">
      <h3>Resumen</h3>
      <p>Indicadores rápidos para seguimiento de renovaciones y costos.</p>
    </div>

    <div class="grid">
      <div class="kpi">
        <div class="label">Total</div>
        <div class="value">{{ total }}</div>
        <div class="sub">Licencias/servicios</div>
      </div>

      <div class="kpi kpi-crimson">
        <div class="label">Críticas</div>
        <div class="value">{{ red }}</div>
        <div class="sub">Vencidas o &lt; 8 días</div>
      </div>

      <div class="kpi kpi-orange">
        <div class="label">Próximas</div>
        <div class="value">{{ yellow }}</div>
        <div class="sub">&lt; 30 días</div>
      </div>

      <div class="kpi kpi-green">
        <div class="label">Vigentes</div>
        <div class="value">{{ green }}</div>
        <div class="sub">≥ 30 días</div>
      </div>

      <div class="kpi wide">
        <div class="label">Costo anual estimado</div>
        <div class="value">${{ anualTotal.toLocaleString("es-CO") }}</div>
        <div class="sub">Mensual se anualiza ×12 · Incluye solo no dadas de baja</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  licencias: { type: Array, required: true },
});

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
function stateOf(lic) {
  if (lic?.baja) return "baja";
  if (!lic?.fechaVencimiento) return "unknown";
  const diff = daysDiffFromToday(lic.fechaVencimiento);
  if (diff === null) return "unknown";
  if (diff < 0) return "red";
  if (diff < 8) return "red";
  if (diff < 30) return "yellow";
  return "green";
}
function anualizarValor(lic) {
  const val = Number(lic.valor || 0);
  if ((lic.frecuencia || "").toLowerCase() === "mensual") return val * 12;
  return val;
}

const total = computed(() => (props.licencias || []).length);
const red = computed(() => props.licencias.filter((l) => stateOf(l) === "red").length);
const yellow = computed(() => props.licencias.filter((l) => stateOf(l) === "yellow").length);
const green = computed(() => props.licencias.filter((l) => stateOf(l) === "green").length);

const anualTotal = computed(() =>
  props.licencias
    .filter((l) => !l.baja)
    .reduce((acc, l) => acc + anualizarValor(l), 0)
);
</script>

<style>
.wrap{ padding:12px; background:#fff; }

.head{ display:flex; justify-content:space-between; gap:12px; align-items:flex-end; margin-bottom:10px; }
.head h3{ margin:0; font-size:13px; color:#0f172a; }
.head p{ margin:6px 0 0; font-size:12px; color:#64748b; }

.grid{
  display:grid;
  grid-template-columns: repeat(4, 1fr);
  gap:10px;
}
.kpi{
  border:1px solid #e6eaf2;
  background:#fbfcfe;
  border-radius:14px;
  padding:12px;
}
.kpi .label{ font-size:12px; color:#64748b; font-weight:900; }
.kpi .value{ margin-top:6px; font-size:18px; font-weight:1000; color:#0f172a; letter-spacing:.2px; }
.kpi .sub{ margin-top:4px; font-size:12px; color:#64748b; }

.kpi-crimson{ background: rgba(180,35,42,.08); border-color: rgba(180,35,42,.18); }
.kpi-orange{ background: rgba(245,158,11,.10); border-color: rgba(245,158,11,.18); }
.kpi-green{ background: rgba(34,197,94,.08); border-color: rgba(34,197,94,.18); }

.wide{ grid-column: 1 / -1; }

@media (max-width: 980px){
  .grid{ grid-template-columns: 1fr 1fr; }
  .wide{ grid-column: 1 / -1; }
}
</style>
