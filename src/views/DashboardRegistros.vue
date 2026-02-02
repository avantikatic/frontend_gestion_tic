<template>
  <section class="dash">
    <div class="left">
      <div class="brand">
        <div class="logo">ATK</div>
        <div class="titles">
          <h1>Gestión de Seguridad y Continuidad TIC</h1>
          <p>Macroproceso TIC</p>
        </div>
      </div>

      <div class="kpis">
        <div class="kpi">
          <span class="k-label">Total</span>
          <span class="k-val">{{ total }}</span>
        </div>

        <div class="kpi">
          <span class="k-label">Abiertos</span>
          <span class="k-val">{{ abiertos }}</span>
        </div>

        <div class="kpi">
          <span class="k-label">Mitigados</span>
          <span class="k-val">{{ mitigados }}</span>
        </div>

        <div class="kpi">
          <span class="k-label">Cerrados</span>
          <span class="k-val">{{ cerrados }}</span>
        </div>
      </div>
    </div>

    <div class="right">
      <div class="segmented" role="tablist" aria-label="Cambiar módulo">
        <button class="seg" :class="{ on: moduloSeleccionado==='SEG' }" @click="emit('cambiar-modulo','SEG')">
          <span class="dot seg"></span> SEG
        </button>
        <button class="seg" :class="{ on: moduloSeleccionado==='DISP' }" @click="emit('cambiar-modulo','DISP')">
          <span class="dot disp"></span> DISP
        </button>
        <button class="seg" :class="{ on: moduloSeleccionado==='MNT' }" @click="emit('cambiar-modulo','MNT')">
          <span class="dot mnt"></span> MNT
        </button>
        <button class="seg" :class="{ on: moduloSeleccionado==='DR' }" @click="emit('cambiar-modulo','DR')">
          <span class="dot dr"></span> DR
        </button>
      </div>

      <div class="mini">
        <span class="mini-label">Módulo actual</span>
        <span class="mini-val">{{ moduloNombre }}</span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  registros: { type: Array, default: () => [] },
  moduloSeleccionado: { type: String, default: "SEG" }
});
const emit = defineEmits(["cambiar-modulo"]);

function estadoCode(st) {
  const s = (st || "Abierto").toLowerCase();
  if (s.includes("abier")) return "ABI";
  if (s.includes("anál") || s.includes("anal")) return "ANA";
  if (s.includes("mit")) return "MIT";
  if (s.includes("cerr")) return "CER";
  return "ABI";
}

const total = computed(() => props.registros.length);

const abiertos = computed(() => props.registros.filter(r => estadoCode(r?.estado) === "ABI").length);
const mitigados = computed(() => props.registros.filter(r => estadoCode(r?.estado) === "MIT").length);
const cerrados = computed(() => props.registros.filter(r => estadoCode(r?.estado) === "CER").length);

const moduloNombre = computed(() => {
  if (props.moduloSeleccionado === "SEG") return "Seguridad";
  if (props.moduloSeleccionado === "DISP") return "Disponibilidad";
  if (props.moduloSeleccionado === "MNT") return "Mantenimientos";
  return "Simulacros";
});
</script>

<style>
.dash{
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: #fff;
  box-shadow: 0 10px 26px var(--shadow);
}

.left{
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.brand{
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.logo{
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--panel-2);
  display: grid;
  place-items: center;
  font-weight: 900;
  font-size: 12px;
  letter-spacing: .6px;
  color: var(--text);
}

.titles{
  min-width: 0;
}
h1{
  margin: 0;
  font-size: 14px;
  font-weight: 900;
  color: var(--text);
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 62vw;
}
.titles p{
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--muted);
}

.kpis{
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.kpi{
  border: 1px solid var(--border);
  background: var(--panel-2);
  border-radius: 12px;
  padding: 8px 10px;
  min-width: 110px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.k-label{
  font-size: 12px;
  color: var(--muted);
}
.k-val{
  font-size: 16px;
  font-weight: 900;
  color: var(--text);
}

/* Right side */
.right{
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-end;
}

.segmented{
  display: inline-flex;
  border: 1px solid var(--border);
  background: var(--panel-2);
  border-radius: 14px;
  padding: 4px;
  gap: 4px;
}

.seg{
  border: 1px solid transparent;
  background: transparent;
  color: var(--text);
  font-size: 12px;
  font-weight: 900;
  padding: 8px 10px;
  border-radius: 12px;
  cursor: pointer;
  display: inline-flex;
  gap: 8px;
  align-items: center;
}
.seg:hover{
  border-color: rgba(45,164,78,.25);
  box-shadow: 0 0 0 3px var(--ring);
}
.seg.on{
  background: #fff;
  border-color: rgba(45,164,78,.55);
}

.dot{ width: 8px; height: 8px; border-radius: 99px; }
.dot.seg{ background: #cf222e; }
.dot.disp{ background: #0969da; }
.dot.mnt{ background: #1f883d; }
.dot.dr{ background: #bf8700; }

.mini{
  text-align: right;
}
.mini-label{
  display: block;
  font-size: 12px;
  color: var(--muted);
}
.mini-val{
  display: block;
  margin-top: 4px;
  font-size: 13px;
  font-weight: 900;
  color: var(--text);
}

@media (max-width: 980px){
  .dash{
    flex-direction: column;
    align-items: stretch;
  }
  .right{
    align-items: flex-start;
  }
  h1{
    max-width: 100%;
    white-space: normal;
  }
}
</style>
