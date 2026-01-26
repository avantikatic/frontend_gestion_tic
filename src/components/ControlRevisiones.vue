<template>
  <div class="wrap">
    <div class="top">
      <div>
        <h3>Bitácora de revisiones (general)</h3>
        <p>Registra que hoy revisaste el control de licencias y las observaciones generales.</p>
      </div>
    </div>

    <form class="form" @submit.prevent="add">
      <div class="grid">
        <div class="field">
          <label>Fecha</label>
          <input v-model="fecha" class="input" type="date" required />
        </div>

        <div class="field">
          <label>Tipo</label>
          <select v-model="tipo" class="input" required>
            <option>Auditoría general</option>
            <option>Revisión diaria</option>
            <option>Revisión semanal</option>
            <option>Seguimiento vencimientos</option>
            <option>Actualización general</option>
          </select>
        </div>

        <div class="field span2">
          <label>Observaciones</label>
          <input
            v-model="observaciones"
            class="input"
            placeholder="Ej: Se revisaron vencimientos, se identificaron 2 renovaciones pendientes…"
            required
          />
        </div>
      </div>

      <div class="actions">
        <button class="btn" type="button" @click="prefillHoy">Hoy revisé el control</button>
        <button class="btn primary" type="submit">Guardar revisión</button>
      </div>
    </form>

    <div class="list">
      <div class="row head">
        <div>Fecha</div>
        <div>Tipo</div>
        <div>Observaciones</div>
        <div class="right">Acción</div>
      </div>

      <div v-if="!revisiones?.length" class="empty">Aún no hay revisiones registradas.</div>

      <div v-for="r in revisiones" :key="r.id" class="row">
        <div class="mono">{{ r.fecha }}</div>
        <div class="tag">{{ r.tipo }}</div>
        <div class="obs">{{ r.observaciones }}</div>
        <div class="right">
          <button class="mini" @click="$emit('delete', r.id)">Eliminar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const props = defineProps({
  revisiones: { type: Array, required: true },
});

const emit = defineEmits(["add", "delete"]);

const todayISO = () => new Date().toISOString().slice(0, 10);

const fecha = ref(todayISO());
const tipo = ref("Auditoría general");
const observaciones = ref("");

function prefillHoy() {
  fecha.value = todayISO();
  tipo.value = "Auditoría general";
  observaciones.value = "Hoy se revisó el control de licencias (vencimientos y actualizaciones generales).";
}

function add() {
  emit("add", {
    fecha: fecha.value,
    tipo: tipo.value,
    observaciones: observaciones.value.trim(),
  });

  observaciones.value = "";
}
</script>

<style>
.wrap{ width:100%; }
.top{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:10px;
  margin-bottom:10px;
}
h3{ margin:0; font-size:13px; color:#0f172a; }
p{ margin:6px 0 0; font-size:12px; color:#64748b; }

.form{
  border:1px solid #e6eaf2;
  background:#fff;
  border-radius:14px;
  padding:12px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, .04);
}

.grid{
  display:grid;
  grid-template-columns: 220px 260px 1fr 1fr;
  gap:10px;
  align-items:end;
}
.field{ display:flex; flex-direction:column; gap:6px; }
.field.span2{ grid-column: span 2; }
label{ font-size:12px; color:#475569; font-weight:900; }

.input{
  padding:9px 10px;
  border-radius:12px;
  border:1px solid #e6eaf2;
  background:#fbfcfe;
  outline:none;
  font-size:12px;
}
.input:focus{
  border-color: rgba(47,95,191,.35);
  box-shadow: 0 0 0 3px rgba(47,95,191,.10);
}

.actions{
  display:flex;
  gap:8px;
  justify-content:flex-end;
  margin-top:10px;
  flex-wrap:wrap;
}

.btn{
  border:1px solid #e6eaf2;
  background:#fbfcfe;
  padding:9px 12px;
  border-radius:12px;
  font-size:12px;
  font-weight:900;
  cursor:pointer;
}
.btn:hover{ background:#fff; border-color:#d8deea; }
.primary{
  background: linear-gradient(135deg, #1f2f4a, #223a63);
  border-color: rgba(31,47,74,.35);
  color:#fff;
}

.list{
  margin-top:12px;
  border:1px solid #e6eaf2;
  border-radius:14px;
  overflow:hidden;
  background:#fff;
}
.row{
  display:grid;
  grid-template-columns: 140px 220px 1fr 120px;
  gap:10px;
  padding:10px 12px;
  border-bottom:1px solid #eef2f7;
  align-items:center;
  font-size:12px;
  color:#0f172a;
}
.row.head{
  background: #1f2f4a;
  color:#fff;
  font-size:11px;
  font-weight:900;
  border-bottom:1px solid #1b2740;
}
.row:last-child{ border-bottom:none; }

.mono{ font-variant-numeric: tabular-nums; }
.tag{ font-weight:900; color:#1f2f4a; }
.obs{ color:#475569; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.right{ display:flex; justify-content:flex-end; }

.mini{
  border:1px solid #e6eaf2;
  background:#fbfcfe;
  padding:7px 10px;
  border-radius:12px;
  font-weight:900;
  cursor:pointer;
  font-size:12px;
}
.mini:hover{ background:#fff; border-color:#d8deea; }

.empty{
  padding:14px 12px;
  color:#64748b;
  font-size:12px;
}

@media (max-width: 980px){
  .grid{ grid-template-columns: 1fr; }
  .field.span2{ grid-column: span 1; }
  .row{ grid-template-columns: 1fr; }
  .right{ justify-content:flex-start; }
  .obs{ white-space:normal; }
}
</style>
