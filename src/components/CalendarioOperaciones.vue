<template>
  <section class="cal">
    <header class="cal-head">
      <div class="left">
        <h3>Calendario de Operaciones (MNT · DR)</h3>
        <p>Selecciona un rango: <b>click inicio</b> + <b>click fin</b> (mínimo obligatorio)</p>
      </div>

      <div class="right">
        <button class="btn" @click="prevMonth">◀</button>
        <div class="month">
          <span class="m">{{ monthLabel }}</span>
          <span class="y">{{ year }}</span>
        </div>
        <button class="btn" @click="nextMonth">▶</button>

        <button class="btn btn-ghost" @click="limpiarRango">Limpiar rango</button>
        <button class="btn" @click="$emit('cerrar')">Cerrar</button>
      </div>
    </header>

    <div class="cal-body">
      <div class="dow">
        <div v-for="d in dow" :key="d" class="dowcell">{{ d }}</div>
      </div>

      <div class="grid">
        <button
          v-for="cell in cells"
          :key="cell.key"
          class="day"
          :class="dayClass(cell)"
          :disabled="!cell.inMonth"
          @click="onPick(cell)"
          :title="cell.title"
        >
          <div class="dnum">{{ cell.day }}</div>

          <div class="dots">
            <span v-if="cell.countMNT>0" class="dot dot-mnt" :title="cell.countMNT + ' mantenimiento(s)'" />
            <span v-if="cell.countDR>0" class="dot dot-dr" :title="cell.countDR + ' simulacro(s)'" />
          </div>
        </button>
      </div>

      <div class="rangebar">
        <div class="rangeinfo">
          <span class="label">Rango:</span>
          <span class="val">{{ rangeText }}</span>
          <span class="muted" v-if="rangeReady">• Se precargará en el modal (00:00 a 23:59)</span>
        </div>

        <div class="actions">
          <button class="btn btn-green" :disabled="!rangeReady" @click="crearMantenimiento">
            Crear mantenimiento
          </button>
          <button class="btn btn-green" :disabled="!rangeReady" @click="crearSimulacro">
            Crear simulacro
          </button>
        </div>
      </div>

      <div class="legend">
        <div class="pill"><span class="dot dot-mnt"></span> MNT</div>
        <div class="pill"><span class="dot dot-dr"></span> DR</div>
        <div class="pill outline">Rango seleccionado</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  registros: { type: Array, default: () => [] },
});

const emit = defineEmits([
  "cerrar",
  "crear-mantenimiento",
  "crear-simulacro",
]);

const dow = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

// Estado del mes visible
const view = ref(new Date());
view.value.setHours(0, 0, 0, 0);

// Selección de rango
const startDate = ref(null); // Date
const endDate = ref(null);   // Date

function yearMonthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
}

const year = computed(() => view.value.getFullYear());
const month = computed(() => view.value.getMonth());
const monthLabel = computed(() => {
  const fmt = new Intl.DateTimeFormat("es-CO", { month: "long" });
  const s = fmt.format(view.value);
  return s.charAt(0).toUpperCase() + s.slice(1);
});

// Helpers internos (sin carpeta helpers)
function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function isoDate(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function dateFromAny(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}
function clampDay(d) {
  const x = new Date(d);
  x.setHours(0,0,0,0);
  return x;
}
function toLocalDatetimeDayStart(d) {
  return `${isoDate(d)}T00:00`;
}
function toLocalDatetimeDayEnd(d) {
  return `${isoDate(d)}T23:59`;
}

// Conteo de eventos por día (solo MNT/DR)
const countsByDay = computed(() => {
  const map = new Map(); // isoDate -> {mnt, dr}
  const put = (key, mod) => {
    if (!map.has(key)) map.set(key, { mnt: 0, dr: 0 });
    const obj = map.get(key);
    if (mod === "MNT") obj.mnt++;
    if (mod === "DR") obj.dr++;
  };

  for (const r of props.registros) {
    if (!(r?.modulo === "MNT" || r?.modulo === "DR")) continue;
    const a = dateFromAny(r.fechaInicio);
    const b = dateFromAny(r.fechaFin);
    if (!a || !b) continue;

    const s = clampDay(a);
    const e = clampDay(b);
    // iterar días incluidos
    for (let d = new Date(s); d.getTime() <= e.getTime(); d.setDate(d.getDate() + 1)) {
      put(isoDate(d), r.modulo);
    }
  }
  return map;
});

// Celdas del calendario (lunes como primer día)
const cells = computed(() => {
  const first = startOfMonth(view.value);
  const last = endOfMonth(view.value);

  // convertir JS getDay (0=Dom..6=Sáb) a índice lunes(0)..domingo(6)
  const jsDay = first.getDay(); // 0..6
  const offset = (jsDay + 6) % 7; // lunes=0

  const startGrid = new Date(first);
  startGrid.setDate(first.getDate() - offset);

  const out = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(startGrid);
    d.setDate(startGrid.getDate() + i);
    d.setHours(0,0,0,0);

    const inMonth = d.getMonth() === month.value;
    const key = `${yearMonthKey(view.value)}:${isoDate(d)}`;

    const counts = countsByDay.value.get(isoDate(d)) || { mnt: 0, dr: 0 };

    out.push({
      key,
      date: d,
      day: d.getDate(),
      inMonth,
      countMNT: counts.mnt,
      countDR: counts.dr,
      title: inMonth ? isoDate(d) : "—",
    });
  }
  return out;
});

const rangeReady = computed(() => !!startDate.value && !!endDate.value);

const rangeText = computed(() => {
  if (!startDate.value && !endDate.value) return "—";
  if (startDate.value && !endDate.value) return `${isoDate(startDate.value)} (elige fin)`;
  return `${isoDate(startDate.value)} → ${isoDate(endDate.value)}`;
});

function inRange(d) {
  if (!startDate.value || !endDate.value) return false;
  const t = d.getTime();
  return t >= startDate.value.getTime() && t <= endDate.value.getTime();
}

function isSameDay(a, b) {
  if (!a || !b) return false;
  return isoDate(a) === isoDate(b);
}

function dayClass(cell) {
  const classes = [];
  const today = clampDay(new Date());
  if (isSameDay(cell.date, today)) classes.push("today");
  if (startDate.value && isSameDay(cell.date, startDate.value)) classes.push("start");
  if (endDate.value && isSameDay(cell.date, endDate.value)) classes.push("end");
  if (inRange(cell.date)) classes.push("inrange");
  if (!cell.inMonth) classes.push("out");
  return classes.join(" ");
}

function onPick(cell) {
  if (!cell.inMonth) return;

  const picked = cell.date;

  // Caso 1: no hay inicio
  if (!startDate.value) {
    startDate.value = clampDay(picked);
    endDate.value = null;
    return;
  }

  // Caso 2: hay inicio pero no fin
  if (startDate.value && !endDate.value) {
    const a = startDate.value.getTime();
    const b = clampDay(picked).getTime();
    if (b < a) {
      // si elige un día anterior, reinicia inicio
      startDate.value = clampDay(picked);
      endDate.value = null;
      return;
    }
    endDate.value = clampDay(picked);
    return;
  }

  // Caso 3: ya hay rango -> reiniciar con nuevo inicio
  startDate.value = clampDay(picked);
  endDate.value = null;
}

function limpiarRango() {
  startDate.value = null;
  endDate.value = null;
}

function prevMonth() {
  const d = new Date(view.value);
  d.setMonth(d.getMonth() - 1);
  view.value = d;
  limpiarRango();
}

function nextMonth() {
  const d = new Date(view.value);
  d.setMonth(d.getMonth() + 1);
  view.value = d;
  limpiarRango();
}

function rangoPayload() {
  // Precarga datetime-local:
  // inicio 00:00, fin 23:59
  return {
    inicio: toLocalDatetimeDayStart(startDate.value),
    fin: toLocalDatetimeDayEnd(endDate.value),
  };
}

function crearMantenimiento() {
  if (!rangeReady.value) return;
  emit("crear-mantenimiento", rangoPayload());
}

function crearSimulacro() {
  if (!rangeReady.value) return;
  emit("crear-simulacro", rangoPayload());
}
</script>

<style>
.cal{
  border: 1px solid var(--border);
  background: linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.01));
  border-radius: var(--radius);
  box-shadow: 0 10px 26px var(--shadow);
  overflow: hidden;
}

.cal-head{
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  border-bottom: 1px solid var(--border);
  background: rgba(0,0,0,.10);
}

.cal-head h3{
  margin: 0;
  font-size: 13px;
  font-weight: 820;
}
.cal-head p{
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--muted);
}

.cal-head .right{
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.month{
  border: 1px solid var(--border);
  background: rgba(255,255,255,.03);
  border-radius: 12px;
  padding: 7px 10px;
  display: inline-flex;
  gap: 8px;
  align-items: baseline;
}
.month .m{
  font-size: 12px;
  font-weight: 800;
}
.month .y{
  font-size: 12px;
  color: var(--muted);
}

.cal-body{
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dow{
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}
.dowcell{
  font-size: 11px;
  color: var(--muted);
  padding: 6px 8px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,.06);
  background: rgba(0,0,0,.10);
  text-align: center;
}

.grid{
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

.day{
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,.08);
  background: rgba(255,255,255,.02);
  color: var(--text);
  min-height: 74px;
  padding: 10px;
  cursor: pointer;
  text-align: left;
  transition: border-color .12s ease, background .12s ease, transform .06s ease;
  position: relative;
}
.day:hover{
  border-color: rgba(46,160,67,.35);
  background: rgba(46,160,67,.06);
}
.day:active{ transform: translateY(1px); }
.day:disabled{
  opacity: .25;
  cursor: not-allowed;
}

.dnum{
  font-size: 12px;
  font-weight: 850;
}

.dots{
  position: absolute;
  left: 10px;
  bottom: 10px;
  display: flex;
  gap: 6px;
  align-items: center;
}

.dot{
  width: 8px;
  height: 8px;
  border-radius: 999px;
  display: inline-block;
}
.dot-mnt{ background: rgba(46,160,67,.95); }
.dot-dr{ background: rgba(210,153,34,.95); }

/* Selección de rango */
.day.inrange{
  border-color: rgba(46,160,67,.35);
  background: rgba(46,160,67,.08);
}
.day.start, .day.end{
  border-color: rgba(46,160,67,.75);
  box-shadow: 0 0 0 3px var(--ring);
  background: rgba(46,160,67,.12);
}
.day.today{
  outline: 1px dashed rgba(255,255,255,.18);
  outline-offset: -4px;
}

/* Barra de acciones */
.rangebar{
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 14px;
  background: rgba(0,0,0,.12);
}
@media (max-width: 880px){
  .rangebar{ flex-direction: column; align-items: stretch; }
  .actions{ justify-content: flex-start; }
}
.rangeinfo{
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  font-size: 12px;
}
.label{ color: var(--muted); }
.val{ font-weight: 800; }
.muted{ color: var(--muted); }

.actions{
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

/* Leyenda */
.legend{
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 2px;
}
.pill{
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,.10);
  background: rgba(255,255,255,.02);
  font-size: 12px;
  color: var(--text);
}
.pill.outline{
  border-style: dashed;
  color: var(--muted);
}

/* Botones */
.btn{
  appearance: none;
  border: 1px solid var(--border);
  background: rgba(255,255,255,.03);
  color: var(--text);
  padding: 8px 10px;
  border-radius: 10px;
  font-size: 12px;
  cursor: pointer;
  transition: transform .06s ease, border-color .12s ease, background .12s ease;
}
.btn:hover{
  border-color: rgba(46,160,67,.45);
  box-shadow: 0 0 0 3px var(--ring);
}
.btn:active{ transform: translateY(1px); }

.btn-green{
  border-color: rgba(46,160,67,.55);
  background: rgba(46,160,67,.12);
}
.btn-green:hover{
  border-color: rgba(46,160,67,.85);
  background: rgba(46,160,67,.16);
}
.btn:disabled{
  opacity: .45;
  cursor: not-allowed;
}
.btn-ghost:hover{
  border-color: rgba(46,160,67,.45);
}
</style>
