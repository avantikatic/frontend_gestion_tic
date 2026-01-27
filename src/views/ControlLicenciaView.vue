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
        <button class="btn" @click="descargarExcel">Descargar Excel</button>
        <button class="btn" @click="openRevisiones = true">Revisiones</button>
        <button class="btn btn-primary" @click="crearNuevaLicencia">+ Nueva</button>
      </div>
    </header>

    <main class="content">
      <!-- KPI RESUMEN -->
      <section class="panel">
        <div class="kpiWrap">
          <div class="kpiHead">
            <h3>Resumen</h3>
            <p>Indicadores rápidos para seguimiento de renovaciones y costos.</p>
          </div>

          <div class="kpiGrid">
            <div class="kpi">
              <div class="kpiLabel">Total</div>
              <div class="kpiValue">{{ kpiTotal }}</div>
              <div class="kpiSub">Licencias/servicios</div>
            </div>

            <div class="kpi kpi-crimson">
              <div class="kpiLabel">Críticas</div>
              <div class="kpiValue">{{ kpiRed }}</div>
              <div class="kpiSub">Vencidas o &lt; 8 días</div>
            </div>

            <div class="kpi kpi-orange">
              <div class="kpiLabel">Próximas</div>
              <div class="kpiValue">{{ kpiYellow }}</div>
              <div class="kpiSub">&lt; 30 días</div>
            </div>

            <div class="kpi kpi-green">
              <div class="kpiLabel">Vigentes</div>
              <div class="kpiValue">{{ kpiGreen }}</div>
              <div class="kpiSub">≥ 30 días</div>
            </div>

            <div class="kpi kpiWide">
              <div class="kpiLabel">Costo anual estimado</div>
              <div class="kpiValue">${{ kpiAnualTotal.toLocaleString("es-CO") }}</div>
              <div class="kpiSub">Mensual se anualiza ×12 · Incluye solo no dadas de baja</div>
            </div>
          </div>
        </div>
      </section>

      <!-- DASHBOARD LICENCIAS -->
      <section class="panel">
        <div class="dashWrap">
          <div class="dashHead">
            <div class="dashHeadTop">
              <h3>Licencias / Proveedores / Servicios</h3>
              <span class="dashCount">{{ listaFiltrada.length }} registro(s)</span>
            </div>

            <div class="dashChips">
              <button class="dashChip" :class="{ on: filtroEstado === 'all' }" @click="filtroEstado='all'">Todos</button>
              <button class="dashChip dashChip-red" :class="{ on: filtroEstado === 'red' }" @click="filtroEstado='red'">Críticas</button>
              <button class="dashChip dashChip-yellow" :class="{ on: filtroEstado === 'yellow' }" @click="filtroEstado='yellow'">Próximas</button>
              <button class="dashChip dashChip-green" :class="{ on: filtroEstado === 'green' }" @click="filtroEstado='green'">Vigentes</button>
              <button class="dashChip dashChip-gray" :class="{ on: filtroEstado === 'baja' }" @click="filtroEstado='baja'">Bajas</button>

              <label class="dashToggle">
                <input type="checkbox" v-model="ocultarBajas" />
                <span>Ocultar bajas</span>
              </label>
            </div>

            <div class="dashFilters">
              <input v-model="q" class="dashSearch" placeholder="Buscar proveedor, producto, responsable…" />

              <select v-model="fProveedor" class="dashSelect">
                <option value="">Proveedor (Todos)</option>
                <option v-for="p in proveedoresUnicos" :key="p" :value="p">{{ p }}</option>
              </select>

              <select v-model="fFrecuencia" class="dashSelect">
                <option value="">Frecuencia (Todas)</option>
                <option value="mensual">Mensual</option>
                <option value="anual">Anual</option>
              </select>

              <select v-model="fTipoServicio" class="dashSelect">
                <option value="">Tipo (Todos)</option>
                <option v-for="t in tiposUnicos" :key="t" :value="t">{{ t }}</option>
              </select>
            </div>
          </div>

          <div class="dashTableWrap">
            <table class="dashTable">
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
                  @click="abrirEdicion(lic.id)"
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
                    <button class="mini ghost" @click.stop="abrirEdicion(lic.id)">Editar</button>
                  </td>
                </tr>

                <tr v-if="listaFiltrada.length === 0">
                  <td colspan="8" class="empty">Sin resultados.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="dashLegend">
            <span><i class="dot s-red"></i> Carmesí (≤ 10% o vencida)</span>
            <span><i class="dot s-yellow"></i> Naranja (≤ 50% y &gt; 10%)</span>
            <span><i class="dot s-green"></i> Verde (&gt; 50%)</span>
            <span><i class="dot s-baja"></i> Baja</span>
          </div>

          <!-- Paginación -->
          <div v-if="totalPaginasLicencias > 1" style="display: flex; justify-content: center; align-items: center; gap: 12px; margin-top: 20px; padding: 16px;">
            <button 
              @click="paginaAnteriorLicencias" 
              :disabled="paginaActualLicencias === 1"
              style="padding: 8px 16px; border: 1px solid #d1d5db; border-radius: 6px; background: white; cursor: pointer;"
              :style="{ opacity: paginaActualLicencias === 1 ? 0.5 : 1, cursor: paginaActualLicencias === 1 ? 'not-allowed' : 'pointer' }"
            >
              ← Anterior
            </button>
            
            <span style="color: #374151; font-size: 14px;">
              Página {{ paginaActualLicencias }} de {{ totalPaginasLicencias }} ({{ totalLicencias }} total)
            </span>
            
            <button 
              @click="paginaSiguienteLicencias" 
              :disabled="paginaActualLicencias === totalPaginasLicencias"
              style="padding: 8px 16px; border: 1px solid #d1d5db; border-radius: 6px; background: white; cursor: pointer;"
              :style="{ opacity: paginaActualLicencias === totalPaginasLicencias ? 0.5 : 1, cursor: paginaActualLicencias === totalPaginasLicencias ? 'not-allowed' : 'pointer' }"
            >
              Siguiente →
            </button>
          </div>
        </div>
      </section>

    </main>

    <footer class="footer">
      <span>© {{ new Date().getFullYear() }} · Gestión TIC</span>
    </footer>

    <!-- MODAL: Formulario licencia NUEVA VERSION -->
    <div v-if="modal.open" class="newModalOverlay" @click.self="cerrarModal">
      <div class="newModalContainer">
        <!-- HEADER -->
        <div class="newModalHeader">
          <div class="newModalHeaderLeft">
            <h2 class="newModalTitle">
              {{ modal.mode === "create" ? "Nueva licencia/servicio" : "Editar licencia/servicio" }}
            </h2>
            <p class="newModalSubtitle">
              {{ modalDraft?.proveedor || "Sin proveedor" }} · {{ modalDraft?.tipoServicio || "Licencia" }}
            </p>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <!-- Botones de acción en el header (solo en modo edición) -->
            <button
              v-if="modal.mode === 'edit' && !licenciaSeleccionada?.baja"
              type="button"
              class="newBtnDanger"
              style="margin: 0;"
              @click="openBaja = true"
            >
              Dar de baja
            </button>
            <button
              v-if="modal.mode === 'edit' && licenciaSeleccionada?.baja"
              type="button"
              class="newBtnWarn"
              style="margin: 0;"
              @click="reactivarServicio"
              title="Reactivar servicio (quita estado de baja)"
            >
              Reactivar
            </button>
            <button class="newModalClose" @click="cerrarModal" aria-label="Cerrar">✕</button>
          </div>
        </div>

        <!-- BODY -->
        <form v-if="modalDraft" @submit.prevent="guardarDesdeModal(modalDraft)" class="newModalBody">
          <div class="newModalGrid">
            <!-- COLUMNA IZQUIERDA: Datos generales -->
            <div class="newModalSection">
              <div class="newSectionHeader">
                <h3 class="newSectionTitle">Datos generales</h3>
                <p class="newSectionDesc">Proveedor, servicio y vigencia.</p>
              </div>

              <div class="newFormGroup">
                <label class="newLabel">Tipo de servicio</label>
                <select v-model="modalDraft.tipoServicioId" class="newInput">
                  <option value="">— Selecciona —</option>
                  <option v-for="t in tiposServicio" :key="t.id" :value="t.id">{{ t.nombre }}</option>
                </select>
              </div>

              <div class="newFormGroup">
                <label class="newLabel">Proveedor</label>
                <select v-model="proveedorSelect" class="newInput">
                  <option value="">— Selecciona —</option>
                  <option v-for="p in proveedores" :key="p.id" :value="p.id">{{ p.nombre }}</option>
                  <option value="__new__">+ Crear nuevo…</option>
                </select>

                <div v-if="proveedorSelect==='__new__'" class="newInlineCreate">
                  <input v-model="nuevoProveedor" class="newInput" placeholder="Nombre del proveedor" />
                  <button type="button" class="newBtnSmall" @click="crearProveedor">Agregar</button>
                </div>
              </div>

              <div class="newFormGroup">
                <label class="newLabel">Producto / Servicio</label>
                <select v-model="productoSelect" class="newInput">
                  <option value="">— Selecciona —</option>
                  <option v-for="p in productos" :key="p.id" :value="p.id">{{ p.nombre }}</option>
                  <option value="__new__">+ Crear nuevo…</option>
                </select>

                <div v-if="productoSelect==='__new__'" class="newInlineCreate">
                  <input v-model="nuevoProducto" class="newInput" placeholder="Nombre del producto/servicio" />
                  <button type="button" class="newBtnSmall" @click="crearProducto">Agregar</button>
                </div>
              </div>

              <div class="newFormRow">
                <div class="newFormGroup">
                  <label class="newLabel">Cantidad</label>
                  <input v-model.number="modalDraft.cantidad" type="number" min="1" class="newInput" />
                </div>

                <div class="newFormGroup">
                  <label class="newLabel">Frecuencia</label>
                  <select v-model="modalDraft.frecuencia" class="newInput">
                    <option value="mensual">Mensual</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>
              </div>

              <div class="newFormRow">
                <div class="newFormGroup">
                  <label class="newLabel">Fecha de compra</label>
                  <input v-model="modalDraft.fechaCompra" type="date" class="newInput" />
                </div>

                <div class="newFormGroup">
                  <label class="newLabel">Renovación / vencimiento</label>
                  <input v-model="modalDraft.fechaVencimiento" type="date" class="newInput" />
                  <p v-if="fechaError" class="newError">{{ fechaError }}</p>
                </div>
              </div>

              <div class="newFormGroup">
                <label class="newLabel">Observaciones</label>
                <textarea v-model="modalDraft.observaciones" rows="3" class="newTextarea"></textarea>
              </div>
            </div>

            <!-- COLUMNA DERECHA: Costos y Responsable -->
            <div class="newModalSection">
              <div class="newSectionHeader">
                <h3 class="newSectionTitle">Costos</h3>
                <p class="newSectionDesc">Valor y método de pago.</p>
              </div>

              <div class="newFormGroup">
                <label class="newLabel">Valor</label>
                <input v-model.number="modalDraft.valor" type="number" min="0" class="newInput" />
                <p class="newHint">COP · prototipo sin formato.</p>
              </div>

              <div class="newFormGroup">
                <label class="newLabel">Método de pago</label>
                <select v-model="modalDraft.metodoPagoId" class="newInput">
                  <option value="">— Selecciona —</option>
                  <option v-for="m in metodosPago" :key="m.id" :value="m.id">{{ m.nombre }}</option>
                </select>
              </div>

              <div class="newSectionHeader" style="margin-top: 32px;">
                <h3 class="newSectionTitle">Responsable</h3>
                <p class="newSectionDesc">Custodia del servicio.</p>
              </div>

              <div class="newFormGroup">
                <label class="newLabel">Nombre</label>
                <input v-model="modalDraft.responsable.nombre" class="newInput" placeholder="Ej: Jeyson Martinez" />
              </div>

              <div class="newFormGroup">
                <label class="newLabel">Cargo</label>
                <input v-model="modalDraft.responsable.cargo" class="newInput" placeholder="Ej: Coordinador TIC" />
              </div>

              <!-- BOTONES -->
              <div class="newModalActions">
                <button type="button" class="newBtnSecondary" @click="cerrarModal">Cancelar</button>
                <button type="submit" class="newBtnPrimary" :disabled="!!fechaError">Guardar</button>
              </div>
            </div>
          </div>

          <!-- Historial de cambios -->
          <div v-if="modal.mode === 'edit' && historialLicencia?.length" class="historyCard" style="margin-top: 20px;">
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
                    <th style="width:200px;">Campo</th>
                    <th>Cambios</th>
                  </tr>
                </thead>

                <tbody>
                  <template v-for="h in historialLicencia" :key="h.id">
                    <template v-if="parseCambios(h.cambios) && Object.keys(parseCambios(h.cambios)).length > 0">
                      <tr v-for="(valor, campo, index) in parseCambios(h.cambios)" :key="`${h.id}-${campo}`">
                        <!-- Mostrar fecha, usuario y acción solo en la primera fila de cada registro -->
                        <td v-if="index === 0" :rowspan="Object.keys(parseCambios(h.cambios)).length" class="mono">
                          {{ formatFechaHistorial(h.fecha) }}
                        </td>
                        <td v-if="index === 0" :rowspan="Object.keys(parseCambios(h.cambios)).length">
                          {{ h.usuario || "Sistema" }}
                        </td>
                        <td v-if="index === 0" :rowspan="Object.keys(parseCambios(h.cambios)).length">
                          {{ h.accion }}
                        </td>
                        <td><b>{{ campo }}</b></td>
                        <td class="changes">
                          <span class="old">{{ formatValor(valor.anterior) }}</span>
                          <span class="arrow">→</span>
                          <span class="new">{{ formatValor(valor.nuevo) }}</span>
                        </td>
                      </tr>
                    </template>
                    <tr v-else>
                      <td class="mono">{{ formatFechaHistorial(h.fecha) }}</td>
                      <td>{{ h.usuario || "Sistema" }}</td>
                      <td>{{ h.accion }}</td>
                      <td colspan="2" class="empty2">Sin cambios registrados</td>
                    </tr>
                  </template>

                  <tr v-if="!historialLicencia.length">
                    <td colspan="5" class="empty2">Sin historial.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </form>
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
    <div v-if="openRevisiones" class="newModalOverlay" @click.self="openRevisiones = false">
      <div class="newModalContainer" style="max-width: 1200px;">
        <!-- HEADER -->
        <div class="newModalHeader">
          <div class="newModalHeaderLeft">
            <h2 class="newModalTitle">Revisiones generales</h2>
            <p class="newModalSubtitle">Bitácora global del control (no por licencia).</p>
          </div>
          <button class="newModalClose" @click="openRevisiones = false" aria-label="Cerrar">✕</button>
        </div>

        <!-- BODY -->
        <div class="newModalBody" style="padding: 24px;">
          <!-- Sección de título interno -->
          <div class="newSectionHeader" style="margin-bottom: 24px;">
            <h3 class="newSectionTitle">Bitácora de revisiones (general)</h3>
            <p class="newSectionDesc">Registra que hoy revisaste el control de licencias y las observaciones generales.</p>
          </div>

          <!-- Formulario -->
          <form @submit.prevent="agregarRevisionGlobal" style="margin-bottom: 32px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <div class="newFormGroup">
                <label class="newLabel">Fecha</label>
                <input v-model="revFecha" class="newInput" type="date" required />
              </div>

              <div class="newFormGroup">
                <label class="newLabel">Tipo</label>
                <select v-model="revTipo" class="newInput" required>
                  <option value="">— Selecciona tipo —</option>
                  <option v-for="tipo in tiposRevision" :key="tipo.id" :value="tipo.id">
                    {{ tipo.nombre }}
                  </option>
                </select>
              </div>
            </div>

            <div class="newFormGroup" style="margin-bottom: 20px;">
              <label class="newLabel">Observaciones</label>
              <input
                v-model="revObservaciones"
                class="newInput"
                placeholder="Ej: Se revisaron vencimientos, se identificaron 2 renovaciones pendientes…"
                required
              />
            </div>

            <div style="display: flex; gap: 12px; justify-content: flex-end;">
              <button class="newBtnSecondary" type="button" @click="prefillHoy">Hoy revisé el control</button>
              <button class="newBtnPrimary" type="submit">Guardar revisión</button>
            </div>
          </form>

          <!-- Tabla de revisiones -->
          <div class="historyCard">
            <div class="historyTableWrap">
              <table class="historyTable">
                <thead>
                  <tr>
                    <th style="width: 120px;">Fecha</th>
                    <th style="width: 200px;">Tipo</th>
                    <th>Observaciones</th>
                    <th style="width: 100px; text-align: right;">Acción</th>
                  </tr>
                </thead>

                <tbody>
                  <tr v-if="!revisiones?.length">
                    <td colspan="4" style="text-align: center; padding: 40px; color: #6b7280;">
                      Aún no hay revisiones registradas.
                    </td>
                  </tr>

                  <tr v-for="r in revisiones" :key="r.id">
                    <td style="font-family: 'Courier New', monospace; font-size: 13px;">{{ r.fecha }}</td>
                    <td>
                      <span style="display: inline-block; padding: 4px 10px; background: #e0e7ff; color: #4338ca; border-radius: 12px; font-size: 12px; font-weight: 500;">
                        {{ r.tipo }}
                      </span>
                    </td>
                    <td style="color: #374151;">{{ r.observaciones }}</td>
                    <td style="text-align: right;">
                      <button 
                        type="button"
                        @click="eliminarRevisionGlobal(r.id)" 
                        style="padding: 6px 12px; font-size: 13px; color: #dc2626; background: white; border: 1px solid #fee2e2; border-radius: 6px; cursor: pointer; transition: all 0.2s;"
                        @mouseover="$event.target.style.background='#fef2f2'"
                        @mouseout="$event.target.style.background='white'"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Paginación revisiones -->
            <div v-if="totalPaginasRevisiones > 1" style="display: flex; justify-content: center; align-items: center; gap: 12px; margin-top: 16px; padding: 12px;">
              <button 
                @click="paginaAnteriorRevisiones" 
                :disabled="paginaActualRevisiones === 1"
                class="newBtnSecondary"
                style="padding: 6px 12px; font-size: 13px;"
                :style="{ opacity: paginaActualRevisiones === 1 ? 0.5 : 1, cursor: paginaActualRevisiones === 1 ? 'not-allowed' : 'pointer' }"
              >
                ← Anterior
              </button>
              
              <span style="color: #374151; font-size: 13px;">
                Página {{ paginaActualRevisiones }} de {{ totalPaginasRevisiones }}
              </span>
              
              <button 
                @click="paginaSiguienteRevisiones" 
                :disabled="paginaActualRevisiones === totalPaginasRevisiones"
                class="newBtnSecondary"
                style="padding: 6px 12px; font-size: 13px;"
                :style="{ opacity: paginaActualRevisiones === totalPaginasRevisiones ? 0.5 : 1, cursor: paginaActualRevisiones === totalPaginasRevisiones ? 'not-allowed' : 'pointer' }"
              >
                Siguiente →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="toast.show" class="toast">{{ toast.msg }}</div>
  </div>
</template>

<script setup>
import { computed, ref, toRaw, onMounted, watch } from "vue";
import axios from "axios";
import apiUrl from "../../config.js"

const cloneSafe = (obj) => JSON.parse(JSON.stringify(toRaw(obj)));
const uid = () => (crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(16).slice(2)}`);

const usuarioActual = ref("Jeyson Martinez");

const proveedores = ref([]); // Array de objetos {id, nombre}
const productos = ref([]); // Array de objetos {id, nombre}
const tiposServicio = ref([]); // Array de objetos {id, nombre}
const metodosPago = ref([]); // Array de objetos {id, nombre}

const licencias = ref([]); // Licencias de la página actual (paginado)

// KPIs desde backend
const kpisBackend = ref({
  total: 0,
  criticas: 0,
  proximas: 0,
  vigentes: 0,
  costo_anual_total: 0
});

// Paginación licencias
const paginaActualLicencias = ref(1);
const totalPaginasLicencias = ref(1);
const totalLicencias = ref(0);
const porPaginaLicencias = 5;

const revisiones = ref([]); // Vacío inicialmente, se puede agregar funcionalidad después
const tiposRevision = ref([]); // Array de objetos {id, nombre} desde BD

// Paginación revisiones
const paginaActualRevisiones = ref(1);
const totalPaginasRevisiones = ref(1);
const totalRevisiones = ref(0);
const porPaginaRevisiones = 5;

// Estados revisiones
const revFecha = ref(new Date().toISOString().slice(0, 10));
const revTipo = ref(""); // Ahora será el ID del tipo
const revObservaciones = ref("");

const selectedId = ref(null);
const modal = ref({ open: false, mode: "edit", licenseId: null });
const openRevisiones = ref(false);
const modalDraft = ref(null);
const historialLicencia = ref([]);

// Estados formulario
const proveedorSelect = ref("");
const productoSelect = ref("");
const nuevoProveedor = ref("");
const nuevoProducto = ref("");

// Estados dashboard
const q = ref("");
const filtroEstado = ref("all");
const ocultarBajas = ref(true);
const fProveedor = ref("");
const fFrecuencia = ref("");
const fTipoServicio = ref("");

const openBaja = ref(false);
const motivoBajaDraft = ref("");

const toast = ref({ show: false, msg: "" });
function showToast(msg) {
  toast.value = { show: true, msg };
  setTimeout(() => (toast.value.show = false), 2200);
}

// Watchers para el formulario
watch(() => modalDraft.value?.proveedorId, (v) => {
  if (proveedorSelect.value !== "__new__") proveedorSelect.value = v || "";
});
watch(() => modalDraft.value?.productoId, (v) => {
  if (productoSelect.value !== "__new__") productoSelect.value = v || "";
});

watch(proveedorSelect, (v) => {
  if (!modalDraft.value || v === "__new__") return;
  const proveedorId = parseInt(v);
  modalDraft.value.proveedorId = proveedorId || null;
  
  // Actualizar también el nombre para mostrar
  const proveedor = proveedores.value.find(p => p.id === proveedorId);
  modalDraft.value.proveedor = proveedor?.nombre || "";
});

watch(productoSelect, (v) => {
  if (!modalDraft.value || v === "__new__") return;
  const productoId = parseInt(v);
  modalDraft.value.productoId = productoId || null;
  
  // Actualizar también el nombre para mostrar
  const producto = productos.value.find(p => p.id === productoId);
  modalDraft.value.producto = producto?.nombre || "";
});

// Watchers para tipo de servicio y método de pago
watch(() => modalDraft.value?.tipoServicioId, (v) => {
  if (!modalDraft.value) return;
  const tipoServicio = tiposServicio.value.find(t => t.id === v);
  modalDraft.value.tipoServicio = tipoServicio?.nombre || "";
});

watch(() => modalDraft.value?.metodoPagoId, (v) => {
  if (!modalDraft.value) return;
  const metodoPago = metodosPago.value.find(m => m.id === v);
  modalDraft.value.metodoPago = metodoPago?.nombre || "";
});

// ===================================================
// FUNCIONES PARA CARGAR DATOS DESDE EL BACKEND
// ===================================================

async function cargarCatalogos() {
  try {
    const resTipos = await axios.post(
      `${apiUrl}/licencias/catalogos/tipos-servicio`,
      {},
      {
        headers: {
          Accept: "application/json",
        }
      }
    );
    if (resTipos.status === 200) {
      tiposServicio.value = resTipos.data.data; // Guardar objetos completos {id, nombre}
    }

    const resProv = await axios.post(
      `${apiUrl}/licencias/catalogos/proveedores`,
      {},
      {
        headers: {
          Accept: "application/json",
        }
      }
    );
    if (resProv.status === 200) {
      proveedores.value = resProv.data.data; // Guardar objetos completos {id, nombre}
    }

    const resProd = await axios.post(
      `${apiUrl}/licencias/catalogos/productos-servicios`,
      {},
      {
        headers: {
          Accept: "application/json",
        }
      }
    );
    if (resProd.status === 200) {
      productos.value = resProd.data.data; // Guardar objetos completos {id, nombre}
    }

    const resMet = await axios.post(
      `${apiUrl}/licencias/catalogos/metodos-pago`,
      {},
      {
        headers: {
          Accept: "application/json",
        }
      }
    );
    if (resMet.status === 200) {
      metodosPago.value = resMet.data.data; // Guardar objetos completos {id, nombre}
    }
  } catch (error) {
    console.error("Error cargando catálogos:", error);
    showToast("Error cargando catálogos del servidor.");
  }
}

async function cargarLicencias() {
  try {
    const response = await axios.post(
      `${apiUrl}/licencias/obtener?page=${paginaActualLicencias.value}&per_page=${porPaginaLicencias}`,
      { incluir_bajas: true },
      {
        headers: {
          Accept: "application/json",
        }
      }
    );
    if (response.status === 200) {
      const resultado = response.data.data;
      licencias.value = resultado.licencias;
      totalLicencias.value = resultado.total;
      totalPaginasLicencias.value = resultado.total_pages;
      
      // Actualizar KPIs desde backend
      if (resultado.kpis) {
        kpisBackend.value = resultado.kpis;
      }
    }
  } catch (error) {
    console.error("Error cargando licencias:", error);
    showToast("Error cargando licencias del servidor.");
  }
}

// Funciones de paginación licencias
function irPaginaLicencias(pagina) {
  if (pagina >= 1 && pagina <= totalPaginasLicencias.value) {
    paginaActualLicencias.value = pagina;
    cargarLicencias();
  }
}

function paginaAnteriorLicencias() {
  if (paginaActualLicencias.value > 1) {
    paginaActualLicencias.value--;
    cargarLicencias();
  }
}

function paginaSiguienteLicencias() {
  if (paginaActualLicencias.value < totalPaginasLicencias.value) {
    paginaActualLicencias.value++;
    cargarLicencias();
  }
}

// ===================================================
// FUNCIONES PARA REVISIONES GENERALES
// ===================================================

async function cargarTiposRevision() {
  try {
    const response = await axios.post(
      `${apiUrl}/licencias/tipos-revision`,
      {},
      {
        headers: {
          Accept: "application/json",
        }
      }
    );
    if (response.status === 200) {
      tiposRevision.value = response.data.data;
      // Seleccionar el primer tipo por defecto si existe
      if (tiposRevision.value.length > 0 && !revTipo.value) {
        revTipo.value = tiposRevision.value[0].id;
      }
    }
  } catch (error) {
    console.error("Error cargando tipos de revisión:", error);
  }
}

async function cargarRevisiones() {
  try {
    const response = await axios.post(
      `${apiUrl}/licencias/revisiones/obtener?page=${paginaActualRevisiones.value}&per_page=${porPaginaRevisiones}`,
      {},
      {
        headers: {
          Accept: "application/json",
        }
      }
    );
    if (response.status === 200) {
      const resultado = response.data.data;
      revisiones.value = resultado.revisiones;
      totalRevisiones.value = resultado.total;
      totalPaginasRevisiones.value = resultado.total_pages;
    }
  } catch (error) {
    console.error("Error cargando revisiones:", error);
  }
}

// Funciones de paginación revisiones
function irPaginaRevisiones(pagina) {
  if (pagina >= 1 && pagina <= totalPaginasRevisiones.value) {
    paginaActualRevisiones.value = pagina;
    cargarRevisiones();
  }
}

function paginaAnteriorRevisiones() {
  if (paginaActualRevisiones.value > 1) {
    paginaActualRevisiones.value--;
    cargarRevisiones();
  }
}

function paginaSiguienteRevisiones() {
  if (paginaActualRevisiones.value < totalPaginasRevisiones.value) {
    paginaActualRevisiones.value++;
    cargarRevisiones();
  }
}

async function agregarRevisionGlobal() {
  if (!revFecha.value || !revTipo.value || !revObservaciones.value.trim()) {
    showToast("Por favor completa todos los campos de la revisión.");
    return;
  }

  try {
    const response = await axios.post(
      `${apiUrl}/licencias/revisiones/crear`,
      {
        fecha: revFecha.value,
        tipo_revision_id: revTipo.value,
        observaciones: revObservaciones.value,
        usuario: usuarioActual.value
      },
      {
        headers: {
          Accept: "application/json",
        }
      }
    );

    if (response.status === 201) {
      showToast("Revisión guardada exitosamente.");
      // Limpiar formulario
      revFecha.value = new Date().toISOString().slice(0, 10);
      revTipo.value = tiposRevision.value[0]?.id || "";
      revObservaciones.value = "";
      // Recargar revisiones
      paginaActualRevisiones.value = 1; // Ir a primera página para ver la nueva
      await cargarRevisiones();
    }
  } catch (error) {
    console.error("Error guardando revisión:", error);
    showToast("Error al guardar la revisión.");
  }
}

async function eliminarRevisionGlobal(id) {
  if (!confirm("¿Estás seguro de eliminar esta revisión?")) return;

  try {
    const response = await axios.put(
      `${apiUrl}/licencias/revisiones/eliminar`,
      {
        revision_id: id
      },
      {
        headers: {
          Accept: "application/json",
        }
      }
    );

    if (response.status === 200) {
      showToast("Revisión eliminada.");
      
      // Si eliminamos el último registro de una página que no es la primera,
      // volver a la página anterior
      if (revisiones.value.length === 1 && paginaActualRevisiones.value > 1) {
        paginaActualRevisiones.value--;
      }
      
      await cargarRevisiones();
    }
  } catch (error) {
    console.error("Error eliminando revisión:", error);
    showToast("Error al eliminar la revisión.");
  }
}

function prefillHoy() {
  // revFecha.value = new Date().toISOString().slice(0, 10);
  revObservaciones.value = "Hoy revisé el control de licencias.";
}

onMounted(() => {
  cargarCatalogos();
  cargarLicencias();
  cargarTiposRevision();
  cargarRevisiones();
});

// ===================================================
// FUNCIONES KPI
// ===================================================

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

function stateOfKpi(lic) {
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

const kpiTotal = computed(() => kpisBackend.value.total);
const kpiRed = computed(() => kpisBackend.value.criticas);
const kpiYellow = computed(() => kpisBackend.value.proximas);
const kpiGreen = computed(() => kpisBackend.value.vigentes);

const kpiAnualTotal = computed(() => kpisBackend.value.costo_anual_total);

// ===================================================
// FUNCIONES DASHBOARD
// ===================================================

function isExpired(lic) {
  if (lic?.baja) return false;
  const diff = daysDiffFromToday(lic?.fechaVencimiento);
  return diff !== null && diff < 0;
}

function remainingPercentOf(lic) {
  if (lic?.baja) return 12;

  const compra = parseISODate(lic?.fechaCompra);
  const vence = parseISODate(lic?.fechaVencimiento);
  const hoy = startOfToday();

  if (!vence && !compra) return 18;
  if (!vence && compra) return 25;

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

function toneOf(lic) {
  if (lic?.baja) return "baja";
  if (isExpired(lic)) return "red";

  const pct = remainingPercentOf(lic);
  if (pct <= 10) return "red";
  if (pct <= 50) return "yellow";
  return "green";
}

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
  const s = new Set((licencias.value || []).map((l) => l.proveedor).filter(Boolean));
  return Array.from(s).sort();
});

const tiposUnicos = computed(() => {
  const s = new Set((licencias.value || []).map((l) => l.tipoServicio).filter(Boolean));
  return Array.from(s).sort();
});

const listaFiltrada = computed(() => {
  const text = q.value.trim().toLowerCase();

  return (licencias.value || [])
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

// ===================================================
// FUNCIONES MODALES Y LICENCIAS
// ===================================================

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
  
  // Establecer los IDs en los selects
  proveedorSelect.value = modalDraft.value.proveedorId || "";
  productoSelect.value = modalDraft.value.productoId || "";
  
  // Usar el historial que ya viene en los datos de la licencia
  historialLicencia.value = lic.historial || [];
}

function crearNuevaLicencia() {
  modal.value = { open: true, mode: "create", licenseId: null };
  historialLicencia.value = [];
  
  // Obtener el primer tipo de servicio (Licencia) por defecto
  const tipoLicenciaDefault = tiposServicio.value.find(t => t.nombre === "Licencia");
  const metodoPSEDefault = metodosPago.value.find(m => m.nombre === "Renovación PSE");
  
  modalDraft.value = {
    // No se envía ID, se genera automáticamente en el backend
    tipoServicioId: tipoLicenciaDefault?.id || null,
    tipoServicio: tipoLicenciaDefault?.nombre || "",
    proveedorId: null,
    proveedor: "",
    productoId: null,
    producto: "",
    cantidad: 1,
    frecuencia: "anual",
    fechaCompra: "",
    fechaVencimiento: "",
    valor: 0,
    metodoPagoId: metodoPSEDefault?.id || null,
    metodoPago: metodoPSEDefault?.nombre || "",
    responsable: { nombre: "Jeyson Martinez", cargo: "Coordinador TIC" },
    observaciones: "",
    baja: false,
    fechaBaja: null,
    motivoBaja: null,
    historial: [],
  };
  
  proveedorSelect.value = "";
  productoSelect.value = "";
}

function cerrarModal() {
  modal.value.open = false;
  modal.value.licenseId = null;
  modalDraft.value = null;
  historialLicencia.value = [];
  openBaja.value = false;
  motivoBajaDraft.value = "";
  proveedorSelect.value = "";
  productoSelect.value = "";
  nuevoProveedor.value = "";
  nuevoProducto.value = "";
}



const fechaError = computed(() => {
  if (!modalDraft.value) return "";
  if (!modalDraft.value.fechaCompra || !modalDraft.value.fechaVencimiento) return "";
  const compra = parseISODate(modalDraft.value.fechaCompra);
  const venc = parseISODate(modalDraft.value.fechaVencimiento);
  if (!compra || !venc) return "Fechas inválidas.";
  if (venc <= compra) return "La renovación debe ser posterior a la compra.";
  return "";
});

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

async function guardarDesdeModal(payload) {
  try {
    if (modal.value.mode === "create") {
      // Crear nueva licencia en el backend
      const response = await axios.post(
        `${apiUrl}/licencias/crear`,
        payload,
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          }
        }
      );

      if (response.status === 201) {
        showToast(response.data.message || "Licencia creada exitosamente.");
        cerrarModal();
        // Recargar la lista de licencias para obtener los datos actualizados
        await cargarLicencias();
        return;
      } else {
        showToast("Error al crear la licencia.");
      }
    } else {
      // Actualizar licencia existente en el backend
      const response = await axios.put(
        `${apiUrl}/licencias/actualizar/${payload.id}`,
        payload,
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          }
        }
      );

      if (response.status === 200) {
        showToast(response.data.message || "Licencia actualizada exitosamente.");
        
        // Recargar la lista de licencias para obtener los datos actualizados
        await cargarLicencias();
        
        // Actualizar historial desde los datos recargados
        const licenciaActualizada = licencias.value.find(l => l.id === payload.id);
        if (licenciaActualizada?.historial) {
          historialLicencia.value = licenciaActualizada.historial;
        }
        
        cerrarModal();
        return;
      } else {
        showToast("Error al actualizar la licencia.");
      }
    }
  } catch (error) {
    console.error("Error guardando licencia:", error);
    showToast("Error al guardar. " + (error.response?.data?.message || error.message));
  }
}

async function confirmarBaja() {
  const lic = licenciaSeleccionada.value;
  if (!lic) return;

  try {
    const now = new Date();
    const payload = {
      ...lic,
      baja: 1,
      fechaBaja: now.toISOString().slice(0, 10),
      motivoBaja: (motivoBajaDraft.value || "Sin motivo").trim(),
    };

    const response = await axios.put(
      `${apiUrl}/licencias/actualizar/${lic.id}`,
      payload,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        }
      }
    );

    if (response.status === 200) {
      showToast("Servicio marcado como baja.");
      openBaja.value = false;
      motivoBajaDraft.value = "";
      
      // Recargar la lista de licencias
      await cargarLicencias();
      
      // Actualizar el modalDraft y el historial desde los datos recargados
      const licenciaActualizada = licencias.value.find(l => l.id === lic.id);
      if (licenciaActualizada) {
        modalDraft.value = cloneSafe(licenciaActualizada);
        historialLicencia.value = licenciaActualizada.historial || [];
      }
    } else {
      showToast("Error al dar de baja el servicio.");
    }
  } catch (error) {
    console.error("Error dando de baja:", error);
    showToast("Error al dar de baja. " + (error.response?.data?.message || error.message));
  }
}

async function reactivarServicio() {
  const lic = licenciaSeleccionada.value;
  if (!lic) return;

  try {
    const payload = {
      ...lic,
      baja: 0,
      fechaBaja: null,
      motivoBaja: null,
    };

    const response = await axios.put(
      `${apiUrl}/licencias/actualizar/${lic.id}`,
      payload,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        }
      }
    );

    if (response.status === 200) {
      showToast("Servicio reactivado.");
      
      // Recargar la lista de licencias
      await cargarLicencias();
      
      // Actualizar el modalDraft y el historial desde los datos recargados
      const licenciaActualizada = licencias.value.find(l => l.id === lic.id);
      if (licenciaActualizada) {
        modalDraft.value = cloneSafe(licenciaActualizada);
        historialLicencia.value = licenciaActualizada.historial || [];
      }
    } else {
      showToast("Error al reactivar el servicio.");
    }
  } catch (error) {
    console.error("Error reactivando servicio:", error);
    showToast("Error al reactivar. " + (error.response?.data?.message || error.message));
  }
}

// ===================================================
// CATALOGOS
// ===================================================

async function agregarProveedor(nombre) {
  const clean = (nombre || "").trim();
  if (!clean) return;
  
  try {
    const response = await axios.post(
      `${apiUrl}/licencias/catalogos/proveedores/crear`,
      { nombre: clean },
      {
        headers: {
          Accept: "application/json",
        }
      }
    );
    
    if (response.status === 201 || response.status === 200) {
      // Recargar la lista de proveedores para obtener el ID correcto
      await cargarCatalogos();
      
      // Buscar el proveedor recién creado
      const nuevoProveedor = proveedores.value.find(p => p.nombre === clean);
      
      if (nuevoProveedor && modalDraft.value) {
        modalDraft.value.proveedorId = nuevoProveedor.id;
        modalDraft.value.proveedor = nuevoProveedor.nombre;
        proveedorSelect.value = nuevoProveedor.id;
      }
      
      showToast(response.data.message || "Proveedor creado.");
      return nuevoProveedor;
    } else {
      showToast("Error al crear proveedor.");
    }
  } catch (error) {
    console.error("Error creando proveedor:", error);
    showToast("Error al conectar con el servidor.");
  }
}

async function crearProveedor() {
  const name = nuevoProveedor.value.trim();
  if (!name) return;
  
  await agregarProveedor(name);
  nuevoProveedor.value = "";
}

async function agregarProducto(nombre) {
  const clean = (nombre || "").trim();
  if (!clean) return;
  
  try {
    const response = await axios.post(
      `${apiUrl}/licencias/catalogos/productos-servicios/crear`,
      { nombre: clean },
      {
        headers: {
          Accept: "application/json",
        }
      }
    );
    
    if (response.status === 201 || response.status === 200) {
      // Recargar la lista de productos para obtener el ID correcto
      await cargarCatalogos();
      
      // Buscar el producto recién creado
      const nuevoProducto = productos.value.find(p => p.nombre === clean);
      
      if (nuevoProducto && modalDraft.value) {
        modalDraft.value.productoId = nuevoProducto.id;
        modalDraft.value.producto = nuevoProducto.nombre;
        productoSelect.value = nuevoProducto.id;
      }
      
      showToast(response.data.message || "Producto/servicio creado.");
      return nuevoProducto;
    } else {
      showToast("Error al crear producto/servicio.");
    }
  } catch (error) {
    console.error("Error creando producto/servicio:", error);
    showToast("Error al conectar con el servidor.");
  }
}

async function crearProducto() {
  const name = nuevoProducto.value.trim();
  if (!name) return;
  
  await agregarProducto(name);
  nuevoProducto.value = "";
}

// ===================================================
// EXPORT / HELPERS
// ===================================================

function fmtTS(ts) {
  if (!ts) return "—";
  return ts.replace("T"," ").slice(0,19);
}

function humanValue(v) {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Sí" : "No";
  return String(v);
}

function formatFechaHistorial(fecha) {
  if (!fecha) return "—";
  // Si es un string ISO, lo formateamos
  if (typeof fecha === 'string') {
    return fecha.replace("T", " ").slice(0, 19);
  }
  return String(fecha);
}

function parseCambios(cambiosStr) {
  if (!cambiosStr) return {};
  try {
    // Si es string JSON, parsearlo
    if (typeof cambiosStr === 'string') {
      return JSON.parse(cambiosStr);
    }
    // Si ya es objeto, devolverlo
    return cambiosStr;
  } catch (e) {
    console.error("Error parseando cambios:", e);
    return {};
  }
}

function formatValor(valor) {
  if (valor === null || valor === undefined || valor === "") return "—";
  if (typeof valor === "boolean") return valor ? "Sí" : "No";
  if (typeof valor === "number") return String(valor);
  return String(valor);
}

function formatCurrencyCOP(n) {
  const v = Number(n || 0);
  return v.toLocaleString("es-CO");
}

async function descargarExcel() {
  try {
    showToast("Generando Excel...");
    
    // Preparar filtros actuales
    const filtros = {
      incluirBajas: !ocultarBajas.value, // Invertir la lógica: ocultarBajas=true significa incluirBajas=false
      proveedorId: fProveedor.value || null,
      tipoServicioId: fTipoServicio.value || null
    };
    
    const response = await axios.post(
      `${apiUrl}/licencias/exportar-excel`,
      { filtros },
      {
        headers: {
          Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
        responseType: 'blob'
      }
    );
    
    // Crear enlace de descarga
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `licencias_${new Date().toISOString().slice(0, 10)}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    showToast("Excel descargado.");
  } catch (error) {
    console.error("Error descargando Excel:", error);
    showToast("Error al descargar el Excel.");
  }
}
</script>

<style scoped>
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

/* ===================================================
   TOPBAR
=================================================== */
.topbar{
  display:flex; align-items:center; justify-content:space-between;
  padding:12px 16px;
  background: #ffffff;
  border-bottom:1px solid rgba(255,255,255,.1);
  box-shadow: 0 2px 8px rgba(0,0,0,.15);
}
.brand{ display:flex; gap:12px; align-items:center;}
.logo{
  width:40px; height:40px; border-radius:12px;
  display:grid; place-items:center;
  background: #1f3150;
  border: 1px solid rgba(255,255,255,.2);
  color:#fff; font-weight:900;
}
.title h1{ margin:0; font-size:15px; color:#1f3150; }
.title p{ margin:2px 0 0; font-size:12px; color: #64748b; }

.actions{ display:flex; gap:8px; flex-wrap:wrap; }

/* ===================================================
   CONTENT Y PANEL
=================================================== */
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

/* ===================================================
   BOTONES GLOBALES
=================================================== */
.topbar .btn{
  border:1px solid rgba(255,255,255,.2);
  background: #fbfcfe;
  color:#1f3150;
  border-color:#1f3150;
  padding:8px 14px;
  border-radius:8px;
  cursor:pointer;
  font-size:12px;
  transition: all 0.2s ease;
}
.topbar .btn:hover{ background:rgba(255,255,255,.18); border-color:rgba(255,255,255,.3); }
.topbar .btn-primary{
  background: #1f3150;
  border-color: rgba(255,255,255,.35);
  color:#fff;
  font-weight:700;
}
.topbar .btn-primary:hover{
  background: #486291;
  border-color: rgba(255,255,255,.45);
}

/* Botones para modales y formularios */
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
.btn.primary{
  background: linear-gradient(135deg, var(--navy), var(--navy-2));
  border-color: rgba(31,47,74,.35);
  color:#fff;
}

/* ===================================================
   KPI RESUMEN
=================================================== */
.kpiWrap{ padding:12px; background:#fff; }

.kpiHead{ display:flex; justify-content:space-between; gap:12px; align-items:flex-end; margin-bottom:10px; }
.kpiHead h3{ margin:0; font-size:13px; color:#0f172a; }
.kpiHead p{ margin:6px 0 0; font-size:12px; color:#64748b; }

.kpiGrid{
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
.kpi .kpiLabel{ font-size:12px; color:#64748b; font-weight:900; }
.kpi .kpiValue{ margin-top:6px; font-size:18px; font-weight:1000; color:#0f172a; letter-spacing:.2px; }
.kpi .kpiSub{ margin-top:4px; font-size:12px; color:#64748b; }

.kpi-crimson{ background: rgba(180,35,42,.08); border-color: rgba(180,35,42,.18); }
.kpi-orange{ background: rgba(245,158,11,.10); border-color: rgba(245,158,11,.18); }
.kpi-green{ background: rgba(34,197,94,.08); border-color: rgba(34,197,94,.18); }

.kpiWide{ grid-column: 1 / -1; }

@media (max-width: 980px){
  .kpiGrid{ grid-template-columns: 1fr 1fr; }
  .kpiWide{ grid-column: 1 / -1; }
}

/* ===================================================
   DASHBOARD LICENCIAS
=================================================== */
.dashWrap{ height:100%; display:flex; flex-direction:column; background:#fff; }

.dashHead{ 
  padding:12px 16px; 
  border-bottom:1px solid #e6eaf2; 
  background:#fff;
  display:flex;
  align-items:center;
  gap:12px;
  flex-wrap:wrap;
}

.dashHeadTop{ 
  display:flex; 
  align-items:center; 
  gap:8px;
}

.dashHead h3{ 
  margin:0; 
  font-size:13px; 
  color:#0f172a; 
  font-weight:700;
  white-space:nowrap;
}

.dashCount{
  font-size:12px; 
  color:#64748b;
  background:transparent;
  padding:0;
  white-space:nowrap;
}

.dashChips{ 
  display:flex; 
  gap:6px; 
  align-items:center;
  margin-left: 200px;
}

.dashChip{
  border:1px solid #e5e7eb;
  background:#fff;
  padding:6px 14px;
  border-radius:20px;
  font-size:12px;
  font-weight:bold;
  cursor:pointer;
  color:#4b5563;
  transition: all 0.2s ease;
}

.dashChip:hover{ 
  border-color:#d1d5db;
  background:#f9fafb;
}

.dashChip.on{ 
  background:#dbeafe;
  border-color:#93c5fd;
  color:#1e40af;
}

.dashChip-red.on,
.dashChip-yellow.on,
.dashChip-green.on,
.dashChip-gray.on{ 
  background:#dbeafe;
  border-color:#93c5fd;
  color:#1e40af;
}

.dashToggle{
  display:flex; 
  align-items:center; 
  gap:6px;
  font-size:11px; 
  color:#6b7280; 
  font-weight:500;
  background:transparent;
  border:none;
  padding:0;
  white-space:nowrap;
}

.dashToggle input{ cursor: pointer; }

.dashFilters{ 
  display:flex; 
  gap:6px; 
  align-items:center;
  margin-left:auto;
}

.dashSearch{
  min-width:200px;
  padding:6px 10px;
  border-radius:6px;
  border:1px solid #d1d5db;
  background:#fff;
  color:#0f172a;
  outline:none;
  font-size:12px;
}

.dashSearch::placeholder{ color:#9ca3af; }
.dashSearch:focus{ border-color:#3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.08); }

.dashSelect{
  padding:6px 10px;
  border-radius:6px;
  border:1px solid #d1d5db;
  background:#fff;
  color:#0f172a;
  outline:none;
  font-size:12px;
  cursor: pointer;
  min-width:140px;
}

.dashSelect:focus{ border-color:#3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.08); }

.dashTableWrap{ overflow:auto; padding:10px; flex:1; }

.dashTable{
  width:100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size:12.2px;
}

.dashTable th{
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
.dashTable th:first-child{ border-top-left-radius:12px; }
.dashTable th:last-child{ border-top-right-radius:12px; }

.dashTable td{
  padding:7px 10px;
  border-bottom:1px solid #eef2f7;
  color:#0f172a;
  background:#fff;
  line-height: 1.15;
  vertical-align: middle;
}
.dashTable tbody tr{ cursor:pointer; }
.dashTable tbody tr:hover td{ background:#f8fafc; }

.dashTable tbody tr.selected td{
  background: rgba(47,95,191,.08);
  border-bottom-color: rgba(47,95,191,.14);
}

.dashTable tbody tr.expired td{
  color:#8b1d2c !important;
  text-decoration: underline;
  text-decoration-color:#8b1d2c;
  text-decoration-thickness: 2px;
}
.dashTable tbody tr.expired td .small,
.dashTable tbody tr.expired td .tiny{
  color:#8b1d2c !important;
  opacity:.95;
}

.muted{ color:#475569; }
.small{ font-size:11px; color:#64748b; }
.tiny{ font-size:11px; color:#64748b; margin-top:4px; }
.mono{ font-variant-numeric: tabular-nums; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
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

.dashLegend{
  padding:8px 12px;
  border-top:1px solid #e6eaf2;
  display:flex;
  gap:12px;
  flex-wrap:wrap;
  font-size:12px;
  color:#64748b;
  background:#fff;
}
.dashLegend i.dot{ transform: translateY(1px); margin-right:6px; }

/* ===================================================
   FORMULARIO LICENCIA
=================================================== */
.licenseFormScope{
  width:100%;
  max-width: 100%;
  min-width:0;
  display:block;
}

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
  gap:12px;
  align-items:start;
  min-width:0;
}

.card{
  width:100%;
  min-width:0;
  border:1px solid #e6eaf2;
  background:#ffffff;
  border-radius:14px;
  padding:12px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, .04);
  overflow:hidden;
}

.formHead{ margin-bottom:10px; }
.head2{ margin-top:14px; }
.formHead h3{ margin:0; font-size:13px; color:#0f172a; }
.formHead p{ margin:6px 0 0; font-size:12px; color:#64748b; }

.row{
  width:100%;
  display:grid;
  grid-template-columns: 180px minmax(0, 1fr);
  gap:10px;
  align-items:start;
  margin-bottom:10px;
  min-width:0;
}

label{
  padding-top:8px;
  color:#475569;
  font-weight:700;
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
  padding:9px 10px;
  border-radius:12px;
  border:1px solid #e6eaf2;
  background:#fbfcfe;
  color:#0f172a;
  outline:none;
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

.formActions{
  display:flex;
  justify-content:flex-end;
  gap:8px;
  margin-top:12px;
}

/* ===================================================
   CONTROL REVISIONES
=================================================== */
.revWrap{ width:100%; }
.revTop{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:10px;
  margin-bottom:10px;
}
.revTop h3{ margin:0; font-size:13px; color:#0f172a; }
.revTop p{ margin:6px 0 0; font-size:12px; color:#64748b; }

.revForm{
  border:1px solid #e6eaf2;
  background:#fff;
  border-radius:14px;
  padding:12px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, .04);
}

.revGrid{
  display:grid;
  grid-template-columns: 220px 260px 1fr 1fr;
  gap:10px;
  align-items:end;
}
.revField{ display:flex; flex-direction:column; gap:6px; }
.revField.span2{ grid-column: span 2; }
.revField label{ font-size:12px; color:#475569; font-weight:900; padding-top:0; }

.revActions{
  display:flex;
  gap:8px;
  justify-content:flex-end;
  margin-top:10px;
  flex-wrap:wrap;
}

.revList{
  margin-top:12px;
  border:1px solid #e6eaf2;
  border-radius:14px;
  overflow:hidden;
  background:#fff;
}
.revRow{
  display:grid;
  grid-template-columns: 140px 220px 1fr 120px;
  gap:10px;
  padding:10px 12px;
  border-bottom:1px solid #eef2f7;
  align-items:center;
  font-size:12px;
  color:#0f172a;
}
.revRow.revHead{
  background: #1f2f4a;
  color:#fff;
  font-size:11px;
  font-weight:900;
  border-bottom:1px solid #1b2740;
}
.revRow:last-child{ border-bottom:none; }

.revTag{ font-weight:900; color:#1f2f4a; }
.revObs{ color:#475569; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.right{ display:flex; justify-content:flex-end; }

.revEmpty{
  padding:14px 12px;
  color:#64748b;
  font-size:12px;
}

@media (max-width: 980px){
  .revGrid{ grid-template-columns: 1fr; }
  .revField.span2{ grid-column: span 1; }
  .revRow{ grid-template-columns: 1fr; }
  .right{ justify-content:flex-start; }
  .revObs{ white-space:normal; }
}

/* ===================================================
   MODAL
=================================================== */
.footer{
  padding:10px 14px;
  border-top:1px solid var(--line);
  color:var(--muted);
  font-size:12px;
  background:var(--surface);
}

.modalBackdrop{
  position:fixed;
  inset:0;
  background: rgba(15,23,42,.38);
  display:flex;
  align-items:center;
  justify-content:center;
  padding:14px;
  z-index: 10000;
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
  color: #8b1d2c;
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

.modalBody{
  padding:14px 16px;
  display:block;
  width:100%;
  overflow:auto;
  overflow-x:hidden;
}

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
  border:1px solid rgb(3, 2, 82);
  border-radius:12px;
  padding:10px;
  font-size:12px;
  outline:none;
  background: var(--surface-2);
}
.ta:focus{ border-color: rgba(47,95,191,.35); box-shadow: 0 0 0 3px rgba(47,95,191,.10); }

.miniActions{ display:flex; gap:8px; justify-content:flex-end; margin-top:10px; }

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
  background: #1f2f4a;
  border-radius: 1px;
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
.pill{ font-weight:900; color:#1f2f4a; }
.changes{ min-width: 380px; }
.chg{ margin:2px 0; }
.old{ color:#64748b; }
.arrow{ color:#94a3b8; margin:0 6px; }
.new{ color:#0f172a; font-weight:900; }
.empty2{ text-align:center; color:var(--muted); padding:12px; }

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

/* ===================================================
   NUEVA SECCIÓN DE FILTROS (ABAJO)
=================================================== */
.filterSection{
  padding: 16px;
  background: #fff;
}

.filterTop{
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.filterTop h3{
  margin: 0;
  font-size: 14px;
  font-weight: 900;
  color: #0f172a;
}

.filterCount{
  font-size: 12px;
  color: #64748b;
}

.filterRow{
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.filterTabs{
  display: flex;
  gap: 6px;
  background: #f1f5f9;
  padding: 4px;
  border-radius: 8px;
}

.filterTab{
  border: none;
  background: transparent;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  color: #64748b;
  transition: all 0.15s ease;
}

.filterTab:hover{
  color: #334155;
}

.filterTab.active{
  background: #fff;
  color: #0f172a;
  box-shadow: 0 1px 3px rgba(0,0,0,.1);
}

.filterCheckbox{
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
  cursor: pointer;
  margin-left: auto;
}

.filterCheckbox input{
  cursor: pointer;
}

.filterControls{
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filterInput{
  flex: 1;
  min-width: 280px;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  color: #0f172a;
  font-size: 13px;
  outline: none;
  transition: all 0.15s ease;
}

.filterInput::placeholder{
  color: #94a3b8;
}

.filterInput:focus{
  border-color: #3b82f6;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(59,130,246,.1);
}

.filterSelect{
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  color: #0f172a;
  font-size: 13px;
  outline: none;
  cursor: pointer;
  transition: all 0.15s ease;
  min-width: 160px;
}

.filterSelect:focus{
  border-color: #3b82f6;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(59,130,246,.1);
}

/* ===================================================
   NUEVA MODAL - DISEÑO LIMPIO Y MODERNO
=================================================== */
.newModalOverlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.newModalContainer {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 1200px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.newModalHeader {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.newModalHeaderLeft {
  flex: 1;
}

.newModalTitle {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.newModalSubtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: #6b7280;
}

.newModalClose {
  background: transparent;
  border: none;
  font-size: 24px;
  color: #9ca3af;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.newModalClose:hover {
  background: #e5e7eb;
  color: #374151;
}

.newModalBody {
  overflow-y: auto;
  padding: 24px;
}

.newModalGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.newModalSection {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.newSectionHeader {
  margin-bottom: 8px;
}

.newSectionTitle {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #374151;
}

.newSectionDesc {
  margin: 4px 0 0;
  font-size: 12px;
  color: #9ca3af;
}

.newFormGroup {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.newLabel {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  padding: 0;
  white-space: normal;
}

.newInput,
.newTextarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  color: #111827;
  background: white;
  transition: all 0.2s;
  outline: none;
}

.newInput:focus,
.newTextarea:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.newInput::placeholder,
.newTextarea::placeholder {
  color: #9ca3af;
}

.newTextarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

.newFormRow {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.newInlineCreate {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.newBtnSmall {
  padding: 10px 16px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.newBtnSmall:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}

.newHint {
  margin: 4px 0 0;
  font-size: 12px;
  color: #9ca3af;
}

.newError {
  margin: 4px 0 0;
  font-size: 12px;
  color: #dc2626;
  font-weight: 600;
}

.newModalActions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.newBtnSecondary {
  padding: 10px 20px;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.newBtnSecondary:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.newBtnPrimary {
  padding: 10px 20px;
  background: #2563eb;
  border: 1px solid #2563eb;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.newBtnPrimary:hover {
  background: #1d4ed8;
  border-color: #1d4ed8;
}

.newBtnPrimary:disabled {
  background: #9ca3af;
  border-color: #9ca3af;
  cursor: not-allowed;
  opacity: 0.6;
}

.newModalExtraActions {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 12px;
}

.newBtnDanger {
  padding: 10px 20px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #dc2626;
  cursor: pointer;
  transition: all 0.2s;
}

.newBtnDanger:hover {
  background: #fee2e2;
  border-color: #fca5a5;
}

.newBtnWarn {
  padding: 10px 20px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #d97706;
  cursor: pointer;
  transition: all 0.2s;
}

.newBtnWarn:hover {
  background: #fef3c7;
  border-color: #fcd34d;
}

/* Responsive para nueva modal */
@media (max-width: 980px){
  .newModalGrid {
    grid-template-columns: 1fr;
  }
  
  .newFormRow {
    grid-template-columns: 1fr;
  }
  
  .newModalActions {
    flex-direction: column;
  }
  
  .newBtnSecondary,
  .newBtnPrimary {
    width: 100%;
  }
  
  .layout{ grid-template-columns: 1fr; }
  .row{ grid-template-columns: 1fr; }
  label{ white-space:normal; }
  .grid2{ grid-template-columns: 1fr; }
  .formActions{ justify-content:stretch; }
  .formActions .btn{ flex:1; }
  
  .filterRow{
    flex-direction: column;
    align-items: stretch;
  }
  
  .filterCheckbox{
    margin-left: 0;
  }
  
  .filterControls{
    flex-direction: column;
  }
  
  .filterInput{
    min-width: 100%;
  }
  
  .filterSelect{
    width: 100%;
  }
}
</style>