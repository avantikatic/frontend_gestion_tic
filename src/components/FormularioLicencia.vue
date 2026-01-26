<template>
  <form class="licenseFormScope" @submit.prevent="onSubmit">
    <div class="layout">
      <!-- Columna 1 -->
      <section class="card">
        <div class="head">
          <h3>Datos generales</h3>
          <p>Proveedor, servicio y vigencia.</p>
        </div>

        <div class="row">
          <label>Tipo de servicio</label>
          <div class="ctrl">
            <select v-model="draft.tipoServicio" class="input">
              <option>Licencia</option>
              <option>Suscripción</option>
              <option>Soporte</option>
              <option>Hosting</option>
              <option>Mantenimiento</option>
              <option>Otro</option>
            </select>
          </div>
        </div>

        <div class="row">
          <label>Proveedor</label>
          <div class="ctrl">
            <select v-model="proveedorSelect" class="input">
              <option value="">— Selecciona —</option>
              <option v-for="p in proveedores" :key="p" :value="p">{{ p }}</option>
              <option value="__new__">+ Crear nuevo…</option>
            </select>

            <div v-if="proveedorSelect==='__new__'" class="inlineNew">
              <input v-model="nuevoProveedor" class="input" placeholder="Nombre del proveedor" />
              <button type="button" class="btn" @click="crearProveedor">Agregar</button>
            </div>
          </div>
        </div>

        <div class="row">
          <label>Producto / Servicio</label>
          <div class="ctrl">
            <select v-model="productoSelect" class="input">
              <option value="">— Selecciona —</option>
              <option v-for="p in productos" :key="p" :value="p">{{ p }}</option>
              <option value="__new__">+ Crear nuevo…</option>
            </select>

            <div v-if="productoSelect==='__new__'" class="inlineNew">
              <input v-model="nuevoProducto" class="input" placeholder="Nombre del producto/servicio" />
              <button type="button" class="btn" @click="crearProducto">Agregar</button>
            </div>
          </div>
        </div>

        <div class="grid2">
          <div class="row">
            <label>Cantidad</label>
            <div class="ctrl">
              <input v-model.number="draft.cantidad" type="number" min="1" class="input" />
            </div>
          </div>

          <div class="row">
            <label>Frecuencia</label>
            <div class="ctrl">
              <select v-model="draft.frecuencia" class="input">
                <option :value="1">Mensual</option>
                <option :value="2">Anual</option>
              </select>
            </div>
          </div>
        </div>

        <div class="grid2">
          <div class="row">
            <label>Fecha de compra</label>
            <div class="ctrl">
              <input v-model="draft.fechaCompra" type="date" class="input" />
            </div>
          </div>

          <div class="row">
            <label>Renovación / vencimiento</label>
            <div class="ctrl">
              <input v-model="draft.fechaVencimiento" type="date" class="input" />
              <p v-if="fechaError" class="error">{{ fechaError }}</p>
            </div>
          </div>
        </div>

        <div class="row">
          <label>Observaciones</label>
          <div class="ctrl">
            <textarea v-model="draft.observaciones" rows="3" class="input"></textarea>
          </div>
        </div>
      </section>

      <!-- Columna 2 -->
      <section class="card">
        <div class="head">
          <h3>Costos</h3>
          <p>Valor y método de pago.</p>
        </div>

        <div class="row">
          <label>Valor</label>
          <div class="ctrl">
            <input v-model.number="draft.valor" type="number" min="0" class="input" />
            <p class="hint">COP · prototipo sin formato.</p>
          </div>
        </div>

        <div class="row">
          <label>Método de pago</label>
          <div class="ctrl">
            <select v-model="draft.metodoPago" class="input">
              <option>Renovación PSE</option>
              <option>Renovación anual pagado por Financiera</option>
              <option>Pago único</option>
              <option>Pago mensual por Financiera</option>
              <option>Renovación con OC</option>
            </select>
          </div>
        </div>

        <div class="head head2">
          <h3>Responsable</h3>
          <p>Custodia del servicio.</p>
        </div>

        <div class="row">
          <label>Nombre</label>
          <div class="ctrl">
            <input v-model="draft.responsable.nombre" class="input" placeholder="Ej: Jeyson Martinez" />
          </div>
        </div>

        <div class="row">
          <label>Cargo</label>
          <div class="ctrl">
            <input v-model="draft.responsable.cargo" class="input" placeholder="Ej: Coordinador TIC" />
          </div>
        </div>

        <div class="actions">
          <button type="button" class="btn" @click="$emit('cancel')">Cancelar</button>
          <button type="submit" class="btn primary" :disabled="!!fechaError">Guardar</button>
        </div>
      </section>
    </div>
  </form>
</template>

<script setup>
import { computed, reactive, watch, ref, toRaw } from "vue";

const props = defineProps({
  modelValue: { type: Object, required: true },
  proveedores: { type: Array, required: true },
  productos: { type: Array, required: true },
});

const emit = defineEmits(["update:modelValue", "save", "cancel", "createProveedor", "createProducto"]);

const cloneSafe = (obj) => JSON.parse(JSON.stringify(toRaw(obj)));
const draft = reactive(cloneSafe(props.modelValue));

watch(
  () => props.modelValue,
  (v) => {
    const next = cloneSafe(v);
    Object.keys(draft).forEach((k) => delete draft[k]);
    Object.assign(draft, next);

    if (!draft.responsable) draft.responsable = { nombre: "", cargo: "" };
  },
  { deep: true, immediate: true }
);

const proveedorSelect = ref(draft.proveedor || "");
const productoSelect = ref(draft.producto || "");
const nuevoProveedor = ref("");
const nuevoProducto = ref("");

watch(() => draft.proveedor, (v) => {
  if (proveedorSelect.value !== "__new__") proveedorSelect.value = v || "";
});
watch(() => draft.producto, (v) => {
  if (productoSelect.value !== "__new__") productoSelect.value = v || "";
});

watch(proveedorSelect, (v) => {
  if (v === "__new__") return;
  draft.proveedor = v || "";
  syncUp();
});
watch(productoSelect, (v) => {
  if (v === "__new__") return;
  draft.producto = v || "";
  syncUp();
});

function parseISODate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  return Number.isNaN(d.getTime()) ? null : d;
}

const fechaError = computed(() => {
  if (!draft.fechaCompra || !draft.fechaVencimiento) return "";
  const compra = parseISODate(draft.fechaCompra);
  const venc = parseISODate(draft.fechaVencimiento);
  if (!compra || !venc) return "Fechas inválidas.";
  if (venc <= compra) return "La renovación debe ser posterior a la compra.";
  return "";
});

function syncUp() {
  emit("update:modelValue", cloneSafe(draft));
}
watch(draft, syncUp, { deep: true });

function crearProveedor() {
  const name = nuevoProveedor.value.trim();
  if (!name) return;
  emit("createProveedor", name);
  draft.proveedor = name;
  proveedorSelect.value = name;
  nuevoProveedor.value = "";
  syncUp();
}
function crearProducto() {
  const name = nuevoProducto.value.trim();
  if (!name) return;
  emit("createProducto", name);
  draft.producto = name;
  productoSelect.value = name;
  nuevoProducto.value = "";
  syncUp();
}

function onSubmit() {
  if (fechaError.value) return;
  emit("save", cloneSafe(draft));
}
</script>

<style scoped>
/* ✅ “Blindaje” contra CSS global: todo vive dentro de .licenseFormScope */
.licenseFormScope{
  width:100%;
  max-width: 100%;
  min-width:0;
  display:block;
}

/* reset local */
.licenseFormScope *{ box-sizing:border-box; }
.licenseFormScope button,
.licenseFormScope input,
.licenseFormScope select,
.licenseFormScope textarea{
  font-family: inherit;
  font-size: 12px;
  line-height: 1.2;
}

.layout{
  width:100%;
  display:grid;
  grid-template-columns: 1fr 1fr;
  gap:20px;
  align-items:start;
  min-width:0;
}

.card{
  width:100%;
  min-width:0;
  border:none;
  background:transparent;
  border-radius:0;
  padding:0;
  box-shadow:none;
  overflow:visible;
}

.head{ margin-bottom:10px; }
.head2{ margin-top:14px; margin-bottom:10px; border-top:1px solid #e6eaf2; padding-top:14px; }
.head h3{ margin:0; font-size:13px; color:#0f172a; }
.head p{ margin:6px 0 0; font-size:12px; color:#64748b; }

.row{
  width:100%;
  display:grid;
  grid-template-columns: 170px minmax(0, 1fr);
  gap:10px;
  align-items:center;
  margin-bottom:10px;
  min-width:0;
}

label{
  color:#475569;
  font-weight:700;
  font-size:12px;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}

.ctrl{
  min-width:0;
  display:flex;
  flex-direction:column;
  gap:6px;
}

.input{
  width:100%;
  min-width:0;
  padding:7px 10px;
  border-radius:12px;
  border:1px solid #e6eaf2;
  background:#fbfcfe;
  color:#0f172a;
  outline:none;
  font-size:12px;
}
.input:focus{
  border-color: rgba(47,95,191,.35);
  box-shadow: 0 0 0 3px rgba(47,95,191,.10);
}

textarea.input{ resize:vertical; }

.grid2{
  display:grid;
  grid-template-columns: 1fr 1fr;
  gap:10px;
  min-width:0;
}

.inlineNew{
  display:flex;
  gap:8px;
  flex-wrap:wrap;
  align-items:center;
}

.hint{ margin:0; color:#64748b; font-size:11px; }
.error{ margin:0; color:#b91c1c; font-weight:900; font-size:12px; }

.actions{
  display:flex;
  justify-content:flex-end;
  gap:8px;
  margin-top:14px;
}

.btn{
  border:1px solid #e6eaf2;
  background:#fbfcfe;
  color:#0f172a;
  padding:9px 12px;
  border-radius:12px;
  cursor:pointer;
  font-weight:900;
}
.btn:hover{ background:#fff; border-color:#d8deea; }

.primary{
  background: linear-gradient(135deg, #1f2f4a, #223a63);
  border-color: rgba(31,47,74,.35);
  color:#fff;
}

/* Responsive */
@media (max-width: 980px){
  .layout{ grid-template-columns: 1fr; }
  .row{ grid-template-columns: 1fr; }
  label{ white-space:normal; }
  .grid2{ grid-template-columns: 1fr; }
  .actions{ justify-content:stretch; }
  .actions .btn{ flex:1; }
}
</style>
