<script setup>
import { computed, reactive, ref, watch } from 'vue'
import {
  useContingenciaCatalogos,
  useContingenciaContadores,
  useContingenciaEventos,
  useContingenciaExpediente,
} from '@/composables/contingencia/useContingencia.js'

// ── Navegación ─────────────────────────────────────────────────────────────────
const activeView      = ref('dashboard')
const selectedEventId = ref(null)

const navigation = [
  { id: 'dashboard',  label: 'Centro de control', icon: 'fa-solid fa-gauge' },
  { id: 'events',     label: 'Eventos',            icon: 'fa-solid fa-shield-halved' },
  { id: 'expediente', label: 'Expediente',         icon: 'fa-solid fa-folder-open' },
]

// ── Filtros ────────────────────────────────────────────────────────────────────
const query      = ref('')
const filtroTipo = ref(null)

const filtrosActivos = computed(() => {
  const f = {}
  if (query.value.trim()) f.query         = query.value.trim()
  if (filtroTipo.value)   f.id_tipo_evento = filtroTipo.value
  return f
})

// ── Composables ────────────────────────────────────────────────────────────────
const { catalogos, catLoading } = useContingenciaCatalogos()
const { contadores }            = useContingenciaContadores()

const {
  eventos, eventosLoading, refetchEventos,
  crearMutation, actualizarMutation, eliminarMutation,
} = useContingenciaEventos(filtrosActivos)

const {
  acciones, bitacoras, recuperacion,
  crearAccionMutation, actualizarAccionMutation, eliminarAccionMutation,
  guardarRecMutation, crearBitacoraMutation,
} = useContingenciaExpediente(selectedEventId)

// ── Datos derivados ────────────────────────────────────────────────────────────
const selectedEvent         = computed(() => eventos.value.find(e => e.id === selectedEventId.value) ?? null)
const hasEvents             = computed(() => eventos.value.length > 0)
const canCreateChildRecords = computed(() => !!selectedEventId.value)

const metricCards = computed(() => [
  {
    label: 'Eventos abiertos',
    value: contadores.value.eventos_abiertos,
    trend: `${contadores.value.total_eventos} registrados`,
    icon:  'fa-solid fa-tower-broadcast',
  },
  {
    label: 'Acciones completadas',
    value: contadores.value.acciones_completadas,
    trend: `${contadores.value.acciones_total} totales`,
    icon:  'fa-solid fa-list-check',
  },
])

const statusClass = (nombre) => {
  if (['Cerrado', 'Completada', 'Aprobado', 'Activo'].includes(nombre))              return 'success'
  if (['Activado', 'En recuperacion', 'En curso', 'En revision'].includes(nombre))   return 'warning'
  if (['En analisis', 'Borrador'].includes(nombre))                                   return 'info'
  if (['Critica', 'Alta'].includes(nombre))                                           return 'danger'
  return 'neutral'
}

// ── Formularios ────────────────────────────────────────────────────────────────
const eventForm = reactive({
  id_tipo_evento: null, id_prioridad: null, id_estado_evento: null,
  titulo: '', area: '', responsable: '', fecha_inicio: '',
  rto_objetivo: '', rpo_objetivo: '', impacto: '', causa: '',
})
const resetEventForm = () => Object.assign(eventForm, {
  id_tipo_evento:   catalogos.value.tipos_evento[0]?.id    ?? null,
  id_prioridad:     catalogos.value.prioridades[1]?.id     ?? null,
  id_estado_evento: catalogos.value.estados_evento[0]?.id  ?? null,
  titulo: '', area: '', responsable: '', fecha_inicio: '',
  rto_objetivo: '', rpo_objetivo: '', impacto: '', causa: '',
})
watch(catLoading, (l) => { if (!l) resetEventForm() }, { immediate: true })

const actionForm = reactive({ id_estado_accion: null, titulo: '', responsable: '', fecha_compromiso: '' })
const resetActionForm = () => Object.assign(actionForm, {
  id_estado_accion: catalogos.value.estados_accion[0]?.id ?? null,
  titulo: '', responsable: '', fecha_compromiso: '',
})

const recoveryForm = reactive({ id_resultado_recuperacion: null, tiempo_real: '', observaciones: '' })
watch(recuperacion, (rec) => {
  Object.assign(recoveryForm, {
    id_resultado_recuperacion: rec?.id_resultado_recuperacion ?? null,
    tiempo_real:               rec?.tiempo_real               ?? '',
    observaciones:             rec?.observaciones             ?? '',
  })
}, { immediate: true })

const logDetalle = ref('')

// Estado editable del evento activo (banner del Expediente)
const estadoEventoId = ref(null)
watch(selectedEvent, (ev) => {
  estadoEventoId.value = ev?.id_estado_evento ?? null
}, { immediate: true })

// ── Acciones de usuario ────────────────────────────────────────────────────────
const usuario = 'sistemas@avantika.com.co'

function selectEvent(id) {
  selectedEventId.value = id
  activeView.value = 'expediente'
}

async function crearEvento() {
  if (!eventForm.titulo?.trim()) return
  const result = await crearMutation.mutateAsync({ ...eventForm, usuario_creacion: usuario })
  if (result?.id) {
    selectedEventId.value = result.id
    resetEventForm()
    activeView.value = 'expediente'
  }
}

async function crearAccion() {
  if (!canCreateChildRecords.value || !actionForm.titulo?.trim()) return
  await crearAccionMutation.mutateAsync({
    ...actionForm,
    id_evento: selectedEventId.value,
    usuario_creacion: usuario,
  })
  resetActionForm()
}

async function guardarRecuperacion() {
  if (!canCreateChildRecords.value) return
  await guardarRecMutation.mutateAsync({
    ...recoveryForm,
    id_evento: selectedEventId.value,
    servicio_alterno: false, integridad_documental: false,
    informe_final: false, lecciones_aprendidas: false,
    usuario_actualizacion: usuario,
  })
}

async function crearBitacora() {
  if (!canCreateChildRecords.value || !logDetalle.value?.trim()) return
  await crearBitacoraMutation.mutateAsync({
    id_tipo_bitacora: catalogos.value.tipos_bitacora[0]?.id ?? null,
    hora_registro: '',
    actor: usuario,
    detalle: logDetalle.value,
    id_evento: selectedEventId.value,
    usuario_creacion: usuario,
  })
  logDetalle.value = ''
}

async function cambiarEstadoAccion(accion, nuevoIdEstado) {
  if (!nuevoIdEstado) return
  await actualizarAccionMutation.mutateAsync({
    id_accion: accion.id,
    id_estado_accion: nuevoIdEstado,
    usuario_actualizacion: usuario,
  })
}

async function cambiarEstadoEvento() {
  if (!selectedEventId.value || !estadoEventoId.value) return
  await actualizarMutation.mutateAsync({
    id_evento: selectedEventId.value,
    id_estado_evento: estadoEventoId.value,
    usuario_actualizacion: usuario,
  })
}

async function eliminarEvento(id) {
  await eliminarMutation.mutateAsync(id)
  if (selectedEventId.value === id) selectedEventId.value = null
}
</script>

<template>
  <div class="ct-view">

    <!-- Header -->
    <header class="ct-header">
      <div>
        <p class="ct-eyebrow">Plan de contingencia informatica</p>
        <h2 class="ct-title">Activar, gestionar y cerrar eventos de contingencia TIC</h2>
      </div>
      <button class="ct-btn" type="button" @click="activeView = 'events'">
        <i class="fa-solid fa-plus"></i>
        Nuevo evento
      </button>
    </header>

    <!-- Nav -->
    <nav class="ct-nav">
      <button
        v-for="item in navigation"
        :key="item.id"
        type="button"
        :class="['ct-nav__btn', { active: activeView === item.id }]"
        @click="activeView = item.id"
      >
        <i :class="item.icon"></i>
        {{ item.label }}
      </button>
    </nav>

    <!-- Control strip -->
    <section class="ct-control-strip">
      <label class="ct-search-box">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input v-model="query" type="search" placeholder="Buscar evento, responsable o area" />
      </label>
      <label>
        <span>Tipo de evento</span>
        <select v-model="filtroTipo">
          <option :value="null">Todos</option>
          <option v-for="t in catalogos.tipos_evento" :key="t.id" :value="t.id">{{ t.nombre }}</option>
        </select>
      </label>
      <label>
        <span>Expediente activo</span>
        <select v-model="selectedEventId">
          <option :value="null">Sin seleccionar</option>
          <option v-for="ev in eventos" :key="ev.id" :value="ev.id">{{ ev.codigo }} — {{ ev.titulo }}</option>
        </select>
      </label>
    </section>

    <!-- Estado vacío inicial -->
    <section v-if="!eventosLoading && !hasEvents" class="ct-empty-start">
      <i class="fa-solid fa-shield-halved ct-empty-start__icon"></i>
      <div>
        <p class="ct-eyebrow">Sin eventos registrados</p>
        <h2>Crea el primer evento de contingencia</h2>
        <p>Una vez creado, podras registrar acciones correctivas, documentar la recuperacion y llevar la bitacora del expediente.</p>
      </div>
      <button class="ct-btn" type="button" @click="activeView = 'events'">
        <i class="fa-solid fa-plus"></i>
        Crear primer evento
      </button>
    </section>

    <!-- KPI cards -->
    <section class="ct-metric-grid">
      <article v-for="card in metricCards" :key="card.label" class="ct-metric-card">
        <span class="ct-metric-card__icon"><i :class="card.icon"></i></span>
        <div>
          <p>{{ card.label }}</p>
          <strong>{{ card.value }}</strong>
          <small>{{ card.trend }}</small>
        </div>
      </article>
    </section>

    <!-- ══ CENTRO DE CONTROL ══════════════════════════════════════════════════ -->
    <template v-if="activeView === 'dashboard'">
      <section class="ct-dashboard-grid">

        <!-- Lista de eventos -->
        <article class="ct-panel">
          <div class="ct-panel__header">
            <div>
              <p class="ct-eyebrow">Eventos registrados</p>
              <h2>Estado operacional</h2>
            </div>
            <button class="ct-icon-btn" type="button" title="Actualizar" @click="refetchEventos">
              <i class="fa-solid fa-arrows-rotate"></i>
            </button>
          </div>
          <div v-if="eventosLoading" class="ct-empty-panel">Cargando eventos…</div>
          <div v-else-if="eventos.length" class="ct-event-list">
            <button
              v-for="ev in eventos"
              :key="ev.id"
              class="ct-event-row"
              :class="{ selected: selectedEvent?.id === ev.id }"
              type="button"
              @click="selectEvent(ev.id)"
            >
              <span>
                <strong>{{ ev.codigo }}</strong>
                <small>{{ ev.tipo_evento }}</small>
              </span>
              <span class="ct-event-row__title">{{ ev.titulo }}</span>
              <span class="ct-badge" :class="statusClass(ev.estado_evento)">{{ ev.estado_evento }}</span>
            </button>
          </div>
          <div v-else class="ct-empty-panel">No hay eventos para los filtros aplicados.</div>
        </article>

        <!-- Detalle del expediente activo -->
        <aside class="ct-panel">
          <div class="ct-panel__header">
            <div>
              <p class="ct-eyebrow">Expediente activo</p>
              <h2>{{ selectedEvent?.codigo || 'Sin seleccionar' }}</h2>
            </div>
            <span v-if="selectedEvent" class="ct-badge" :class="statusClass(selectedEvent.prioridad)">
              {{ selectedEvent.prioridad }}
            </span>
          </div>
          <dl v-if="selectedEvent" class="ct-detail-list">
            <div><dt>Estado</dt><dd><span class="ct-badge" :class="statusClass(selectedEvent.estado_evento)">{{ selectedEvent.estado_evento }}</span></dd></div>
            <div><dt>Tipo</dt><dd>{{ selectedEvent.tipo_evento }}</dd></div>
            <div><dt>Responsable</dt><dd>{{ selectedEvent.responsable || 'Pendiente' }}</dd></div>
            <div><dt>Area</dt><dd>{{ selectedEvent.area || 'Pendiente' }}</dd></div>
            <div><dt>Inicio</dt><dd>{{ selectedEvent.fecha_inicio || 'Pendiente' }}</dd></div>
          </dl>
          <div v-if="selectedEvent" class="ct-rto-grid">
            <span><strong>{{ selectedEvent.rto_objetivo || '--' }}</strong><small>RTO</small></span>
            <span><strong>{{ selectedEvent.rpo_objetivo || '--' }}</strong><small>RPO</small></span>
            <span><strong>{{ acciones.length }}</strong><small>Acciones</small></span>
          </div>
          <div v-if="selectedEvent" style="margin-top:12px">
            <button class="ct-btn" type="button" style="width:100%" @click="activeView = 'expediente'">
              <i class="fa-solid fa-folder-open"></i>
              Ver expediente completo
            </button>
          </div>
          <div v-else class="ct-empty-panel">Haz clic en un evento para ver su detalle.</div>
        </aside>

      </section>
    </template>

    <!-- ══ EVENTOS ════════════════════════════════════════════════════════════ -->
    <template v-else-if="activeView === 'events'">

      <section class="ct-panel">
        <div class="ct-panel__header">
          <div><p class="ct-eyebrow">Paso 1</p><h2>Registrar nuevo evento</h2></div>
          <i class="fa-solid fa-shield-halved ct-panel__icon"></i>
        </div>
        <form class="ct-form-grid ct-form-grid--three" @submit.prevent="crearEvento">
          <label>
            <span>Tipo de evento</span>
            <select v-model="eventForm.id_tipo_evento">
              <option v-for="t in catalogos.tipos_evento" :key="t.id" :value="t.id">{{ t.nombre }}</option>
            </select>
          </label>
          <label class="span-2">
            <span>Nombre del evento *</span>
            <input v-model="eventForm.titulo" required placeholder="Ej. Salida no conforme por indisponibilidad documental" />
          </label>
          <label>
            <span>Area impactada</span>
            <input v-model="eventForm.area" placeholder="Operacion TIC" />
          </label>
          <label>
            <span>Responsable</span>
            <input v-model="eventForm.responsable" placeholder="Coordinacion TIC" />
          </label>
          <label>
            <span>Prioridad</span>
            <select v-model="eventForm.id_prioridad">
              <option v-for="p in catalogos.prioridades" :key="p.id" :value="p.id">{{ p.nombre }}</option>
            </select>
          </label>
          <label>
            <span>Estado inicial</span>
            <select v-model="eventForm.id_estado_evento">
              <option v-for="e in catalogos.estados_evento" :key="e.id" :value="e.id">{{ e.nombre }}</option>
            </select>
          </label>
          <label>
            <span>RTO objetivo</span>
            <input v-model="eventForm.rto_objetivo" placeholder="04:00 h" />
          </label>
          <label>
            <span>RPO objetivo</span>
            <input v-model="eventForm.rpo_objetivo" placeholder="00:30 h" />
          </label>
          <label class="span-3">
            <span>Impacto</span>
            <textarea v-model="eventForm.impacto" rows="3" placeholder="Usuarios, procesos o servicios afectados"></textarea>
          </label>
          <label class="span-3">
            <span>Causa probable</span>
            <textarea v-model="eventForm.causa" rows="3" placeholder="Descripcion inicial de la causa"></textarea>
          </label>
          <button class="ct-btn" type="submit" :disabled="crearMutation.isPending.value">
            <i class="fa-solid fa-plus"></i>
            {{ crearMutation.isPending.value ? 'Guardando…' : 'Guardar evento' }}
          </button>
        </form>
      </section>

      <section class="ct-panel">
        <div class="ct-panel__header">
          <div><p class="ct-eyebrow">Registro maestro</p><h2>Eventos guardados</h2></div>
        </div>
        <div v-if="eventosLoading" class="ct-empty-panel">Cargando…</div>
        <div v-else-if="eventos.length" class="ct-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Codigo</th><th>Tipo</th><th>Evento</th>
                <th>Responsable</th><th>RTO / RPO</th><th>Estado</th><th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="ev in eventos" :key="ev.id">
                <td><strong>{{ ev.codigo }}</strong></td>
                <td>{{ ev.tipo_evento }}</td>
                <td>
                  {{ ev.titulo }}
                  <small>{{ ev.impacto || 'Sin impacto registrado' }}</small>
                </td>
                <td>{{ ev.responsable || 'Pendiente' }}</td>
                <td>{{ ev.rto_objetivo || '--' }} / {{ ev.rpo_objetivo || '--' }}</td>
                <td><span class="ct-badge" :class="statusClass(ev.estado_evento)">{{ ev.estado_evento }}</span></td>
                <td>
                  <button
                    class="ct-icon-btn"
                    type="button"
                    title="Eliminar"
                    :disabled="eliminarMutation.isPending.value"
                    @click="eliminarEvento(ev.id)"
                  >
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="ct-empty-panel">Todavia no hay eventos registrados.</div>
      </section>

    </template>

    <!-- ══ EXPEDIENTE ════════════════════════════════════════════════════════ -->
    <template v-else-if="activeView === 'expediente'">

      <!-- Sin evento seleccionado -->
      <section v-if="!selectedEventId" class="ct-no-expediente">
        <i class="fa-solid fa-folder-open"></i>
        <h3>Selecciona un evento para ver su expediente</h3>
        <p>Puedes elegirlo desde el Centro de control o usando el selector de arriba.</p>
        <button class="ct-btn" type="button" @click="activeView = 'dashboard'">
          Ver eventos
        </button>
      </section>

      <template v-else>

        <!-- Banner del evento seleccionado -->
        <section class="ct-event-banner">
          <div class="ct-event-banner__left">
            <span class="ct-event-banner__code">{{ selectedEvent?.codigo }}</span>
            <h2 class="ct-event-banner__title">{{ selectedEvent?.titulo }}</h2>
            <div class="ct-event-banner__meta">
              <span>{{ selectedEvent?.tipo_evento }}</span>
              <span class="ct-badge" :class="statusClass(selectedEvent?.prioridad)">{{ selectedEvent?.prioridad }}</span>
            </div>
          </div>
          <div class="ct-event-banner__right">
            <div class="ct-event-banner__stats">
              <div>
                <strong>{{ selectedEvent?.responsable || '—' }}</strong>
                <small>Responsable</small>
              </div>
              <div>
                <strong>{{ acciones.length }}</strong>
                <small>Acciones</small>
              </div>
              <div>
                <strong>{{ bitacoras.length }}</strong>
                <small>Bitacoras</small>
              </div>
            </div>
            <div class="ct-estado-control">
              <label class="ct-estado-label">Estado del evento</label>
              <div class="ct-estado-row">
                <select v-model="estadoEventoId" class="ct-estado-select">
                  <option v-for="e in catalogos.estados_evento" :key="e.id" :value="e.id">{{ e.nombre }}</option>
                </select>
                <button
                  class="ct-btn ct-btn--sm"
                  type="button"
                  :disabled="actualizarMutation.isPending.value"
                  @click="cambiarEstadoEvento"
                >
                  {{ actualizarMutation.isPending.value ? '…' : 'Actualizar' }}
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- ── Acciones correctivas ── -->
        <section class="ct-panel">
          <div class="ct-panel__header">
            <div><p class="ct-eyebrow">Paso 1</p><h2>Acciones correctivas</h2></div>
            <i class="fa-solid fa-list-check ct-panel__icon"></i>
          </div>
          <form class="ct-form-grid ct-form-grid--three" @submit.prevent="crearAccion">
            <label class="span-2">
              <span>Accion ajustada *</span>
              <input v-model="actionForm.titulo" required placeholder="Ej. Conmutar al repositorio alterno" />
            </label>
            <label>
              <span>Estado</span>
              <select v-model="actionForm.id_estado_accion">
                <option v-for="e in catalogos.estados_accion" :key="e.id" :value="e.id">{{ e.nombre }}</option>
              </select>
            </label>
            <label>
              <span>Responsable</span>
              <input v-model="actionForm.responsable" placeholder="Coordinacion TIC" />
            </label>
            <label>
              <span>Fecha compromiso</span>
              <input v-model="actionForm.fecha_compromiso" placeholder="07 Jul 10:30" />
            </label>
            <button class="ct-btn" type="submit" :disabled="crearAccionMutation.isPending.value">
              <i class="fa-solid fa-plus"></i>
              {{ crearAccionMutation.isPending.value ? 'Guardando…' : 'Agregar accion' }}
            </button>
          </form>

          <div v-if="acciones.length" class="ct-action-list">
            <article v-for="ac in acciones" :key="ac.id" class="ct-action-row">
              <div class="ct-action-row__body">
                <strong>{{ ac.titulo }}</strong>
                <small>{{ ac.responsable || 'Sin responsable' }} · {{ ac.fecha_compromiso || 'Sin fecha' }}</small>
              </div>
              <select
                class="ct-estado-accion"
                :class="statusClass(ac.estado_accion)"
                :value="ac.id_estado_accion"
                :disabled="actualizarAccionMutation.isPending.value"
                @change="cambiarEstadoAccion(ac, +$event.target.value)"
              >
                <option v-for="e in catalogos.estados_accion" :key="e.id" :value="e.id">{{ e.nombre }}</option>
              </select>
              <button
                class="ct-icon-btn"
                type="button"
                title="Eliminar"
                :disabled="eliminarAccionMutation.isPending.value"
                @click="eliminarAccionMutation.mutate(ac.id)"
              >
                <i class="fa-solid fa-trash"></i>
              </button>
            </article>
          </div>
          <div v-else class="ct-empty-panel" style="margin-top:12px">
            No hay acciones registradas para este evento.
          </div>
        </section>

        <!-- ── Recuperacion ── -->
        <section class="ct-panel">
          <div class="ct-panel__header">
            <div><p class="ct-eyebrow">Paso 2</p><h2>Recuperacion</h2></div>
            <i class="fa-solid fa-chart-line ct-panel__icon"></i>
          </div>
          <form class="ct-form-grid" @submit.prevent="guardarRecuperacion">
            <label>
              <span>Resultado</span>
              <select v-model="recoveryForm.id_resultado_recuperacion">
                <option :value="null">Seleccionar</option>
                <option v-for="r in catalogos.resultados_recuperacion" :key="r.id" :value="r.id">{{ r.nombre }}</option>
              </select>
            </label>
            <label>
              <span>Tiempo real de recuperacion</span>
              <input v-model="recoveryForm.tiempo_real" placeholder="03:40 h" />
            </label>
            <label class="span-2">
              <span>Observaciones y lecciones aprendidas</span>
              <textarea
                v-model="recoveryForm.observaciones"
                rows="4"
                placeholder="Describe como se restableció el servicio, qué funcionó y qué se aprendió"
              ></textarea>
            </label>
            <button class="ct-btn" type="submit" :disabled="guardarRecMutation.isPending.value">
              <i class="fa-solid fa-shield-halved"></i>
              {{ guardarRecMutation.isPending.value ? 'Guardando…' : 'Guardar recuperacion' }}
            </button>
          </form>
        </section>

        <!-- ── Bitacora ── -->
        <section class="ct-panel">
          <div class="ct-panel__header">
            <div><p class="ct-eyebrow">Historial y auditoria</p><h2>Bitacora del evento</h2></div>
            <i class="fa-solid fa-clock-rotate-left ct-panel__icon"></i>
          </div>
          <form class="ct-log-form" @submit.prevent="crearBitacora">
            <textarea
              v-model="logDetalle"
              required
              rows="2"
              placeholder="Agrega una observacion, escalacion o novedad al historial…"
            ></textarea>
            <button class="ct-btn" type="submit" :disabled="crearBitacoraMutation.isPending.value">
              <i class="fa-solid fa-plus"></i>
              {{ crearBitacoraMutation.isPending.value ? 'Guardando…' : 'Agregar nota' }}
            </button>
          </form>
          <div v-if="bitacoras.length" class="ct-audit-feed">
            <article v-for="bt in bitacoras" :key="bt.id">
              <span>{{ bt.hora_registro }}</span>
              <div>
                <strong>{{ bt.tipo_bitacora }}</strong>
                <p>{{ bt.detalle }}</p>
                <small>{{ bt.actor || 'Sistema' }}</small>
              </div>
            </article>
          </div>
          <div v-else class="ct-empty-panel" style="margin-top:12px">
            La bitacora se alimenta automaticamente al crear registros. Tambien puedes agregar notas manuales.
          </div>
        </section>

      </template>
    </template>

  </div>
</template>

<style scoped>
/* ── Variables ── */
.ct-view {
  --ct-green:       #166534;
  --ct-green-strong:#14532d;
  --ct-green-soft:  #e8f5ef;
  --ct-blue:        #2563eb;
  --ct-blue-soft:   #eaf2ff;
  --ct-amber:       #b45309;
  --ct-amber-soft:  #fff7e6;
  --ct-red:         #b91c1c;
  --ct-red-soft:    #feeceb;
  --ct-border:      #e3e8ef;
  --ct-muted:       #667085;
  --ct-panel:       #ffffff;
  --ct-shadow:      0 2px 8px rgba(16,24,40,.05);
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-family: Inter, system-ui, -apple-system, "Segoe UI", sans-serif;
  color: #1f2937;
}

h1, h2, h3, p { margin: 0; }

/* ── Header ── */
.ct-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.ct-eyebrow { margin-bottom: 4px; color: var(--ct-green); font-size: .75rem; font-weight: 900; text-transform: uppercase; letter-spacing: .04em; }
.ct-title   { color: #111827; font-size: 1.05rem; font-weight: 700; line-height: 1.3; }

/* ── Nav ── */
.ct-nav { display: flex; flex-wrap: wrap; gap: 6px; padding: 10px 14px; background: var(--ct-panel); border: 1px solid var(--ct-border); border-radius: 10px; box-shadow: var(--ct-shadow); }
.ct-nav__btn { display: inline-flex; align-items: center; gap: 7px; padding: 7px 16px; border: 1px solid transparent; border-radius: 999px; background: transparent; color: #344054; font-size: .84rem; font-weight: 600; cursor: pointer; transition: background .15s; }
.ct-nav__btn:hover  { background: #f1f5f9; }
.ct-nav__btn.active { background: var(--ct-green-soft); border-color: #9ac7b5; color: var(--ct-green-strong); font-weight: 800; }

/* ── Control strip ── */
.ct-control-strip { display: grid; grid-template-columns: minmax(200px,1fr) 190px 220px; gap: 12px; align-items: end; padding: 14px; background: var(--ct-panel); border: 1px solid var(--ct-border); border-radius: 8px; box-shadow: var(--ct-shadow); }
label { display: grid; gap: 5px; }
label span { color: #475467; font-size: .78rem; font-weight: 800; }
select, input, textarea { width: 100%; min-height: 38px; border: 1px solid #d0d5dd; border-radius: 7px; background: #fff; color: #1f2937; padding: 7px 10px; font: inherit; }
textarea { resize: vertical; }
.ct-search-box { position: relative; display: flex; align-items: center; gap: 8px; min-height: 38px; border: 1px solid #d0d5dd; border-radius: 7px; padding: 0 10px; background: #fff; color: var(--ct-muted); }
.ct-search-box input { min-height: 36px; border: 0; padding: 0; outline: 0; flex: 1; }

/* ── Buttons ── */
.ct-btn, .ct-icon-btn { display: inline-flex; align-items: center; justify-content: center; gap: 7px; min-height: 38px; border-radius: 7px; cursor: pointer; font: inherit; font-weight: 800; white-space: nowrap; border: 1px solid var(--ct-green-strong); background: var(--ct-green); color: #fff; padding: 8px 16px; }
.ct-icon-btn { border-color: var(--ct-border); background: #fff; color: #344054; width: 34px; height: 34px; min-height: 34px; padding: 0; }
.ct-btn:disabled, input:disabled, select:disabled, textarea:disabled { cursor: not-allowed; opacity: .6; }

/* ── Empty states ── */
.ct-empty-start { display: grid; grid-template-columns: auto minmax(0,1fr) auto; gap: 14px; align-items: center; padding: 16px; border: 1px dashed #9ac7b5; border-radius: 8px; background: #f6fbf8; }
.ct-empty-start__icon { font-size: 2rem; color: var(--ct-green); }
.ct-empty-start h2 { margin-bottom: 4px; }
.ct-empty-start p:not(.ct-eyebrow) { color: var(--ct-muted); }
.ct-empty-panel { border: 1px dashed #cbd5df; border-radius: 8px; background: #f8fafc; padding: 16px; text-align: center; color: var(--ct-muted); }
.ct-no-expediente { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 48px 24px; border: 1px dashed #9ac7b5; border-radius: 8px; text-align: center; background: #f6fbf8; }
.ct-no-expediente i { font-size: 2.2rem; color: var(--ct-green); }
.ct-no-expediente h3 { color: #243347; }
.ct-no-expediente p { color: var(--ct-muted); max-width: 360px; }

/* ── Metric grid ── */
.ct-metric-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 14px; }
.ct-metric-card { display: flex; gap: 12px; min-height: 100px; border: 1px solid var(--ct-border); border-radius: 8px; background: var(--ct-panel); padding: 16px; box-shadow: var(--ct-shadow); }
.ct-metric-card__icon { display: grid; flex: 0 0 auto; place-items: center; width: 40px; height: 40px; border-radius: 8px; background: var(--ct-green-soft); color: var(--ct-green-strong); font-size: 1rem; }
.ct-metric-card p      { color: var(--ct-muted); font-size: .78rem; font-weight: 800; }
.ct-metric-card strong { display: block; margin-top: 2px; color: #101828; font-size: 1.6rem; line-height: 1.1; }
.ct-metric-card small  { display: block; margin-top: 6px; color: var(--ct-green); font-weight: 800; }

/* ── Panel ── */
.ct-panel { min-width: 0; border: 1px solid var(--ct-border); border-radius: 8px; background: var(--ct-panel); padding: 16px; box-shadow: var(--ct-shadow); }
.ct-panel__header { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; margin-bottom: 14px; }
.ct-panel__icon { color: var(--ct-green); font-size: 1.1rem; margin-top: 2px; }

/* ── Dashboard grid ── */
.ct-dashboard-grid { display: grid; grid-template-columns: minmax(0,1.8fr) minmax(280px,.7fr); gap: 16px; }

/* ── Event list ── */
.ct-event-list { display: grid; gap: 8px; }
.ct-event-row { display: grid; grid-template-columns: 120px minmax(180px,1fr) 140px; gap: 12px; align-items: center; width: 100%; border: 1px solid #eef2f6; border-radius: 8px; background: #fff; padding: 12px; color: #1f2937; text-align: left; cursor: pointer; transition: background .12s, border-color .12s; }
.ct-event-row:hover, .ct-event-row.selected { border-color: #9ac7b5; background: #f6fbf8; }
.ct-event-row strong, .ct-event-row small { display: block; }
.ct-event-row small { margin-top: 2px; color: var(--ct-muted); font-size: .75rem; }
.ct-event-row__title { min-width: 0; color: #243347; font-weight: 800; }

/* ── Badges ── */
.ct-badge { display: inline-flex; align-items: center; justify-content: center; width: fit-content; max-width: 100%; min-height: 26px; border-radius: 999px; padding: 4px 10px; font-size: .72rem; font-style: normal; font-weight: 900; white-space: nowrap; }
.ct-badge.success { background: var(--ct-green-soft); color: var(--ct-green-strong); }
.ct-badge.warning { background: var(--ct-amber-soft); color: var(--ct-amber); }
.ct-badge.info    { background: var(--ct-blue-soft);  color: var(--ct-blue); }
.ct-badge.danger  { background: var(--ct-red-soft);   color: var(--ct-red); }
.ct-badge.neutral { background: #eef2f6; color: #475467; }

/* ── Detail list ── */
.ct-detail-list { display: grid; gap: 10px; margin: 0; }
.ct-detail-list div { display: grid; gap: 3px; padding-bottom: 9px; border-bottom: 1px solid #edf1f5; }
.ct-detail-list dt { color: var(--ct-muted); font-size: .73rem; font-weight: 900; text-transform: uppercase; }
.ct-detail-list dd { margin: 0; color: #263548; font-weight: 750; }

/* ── RTO grid ── */
.ct-rto-grid { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 8px; margin-top: 14px; }
.ct-rto-grid span   { display: grid; gap: 2px; border: 1px solid var(--ct-border); border-radius: 7px; padding: 9px; background: #f8fafc; }
.ct-rto-grid strong { color: #101828; }
.ct-rto-grid small  { color: var(--ct-muted); font-size: .71rem; font-weight: 800; }

/* ── Event banner (Expediente) ── */
.ct-event-banner { display: grid; grid-template-columns: 1fr auto; gap: 24px; align-items: start; border: 1px solid var(--ct-border); border-left: 4px solid var(--ct-green); border-radius: 8px; background: var(--ct-panel); padding: 16px 20px; box-shadow: var(--ct-shadow); }
.ct-event-banner__code { font-family: ui-monospace, monospace; font-size: .78rem; font-weight: 900; color: var(--ct-green); }
.ct-event-banner__title { font-size: 1.1rem; font-weight: 800; color: #111827; margin: 4px 0; }
.ct-event-banner__meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: .85rem; color: var(--ct-muted); }
.ct-event-banner__right { display: flex; flex-direction: column; gap: 14px; align-items: flex-end; }
.ct-event-banner__stats { display: flex; gap: 20px; }
.ct-event-banner__stats div { display: grid; gap: 2px; text-align: center; }
.ct-event-banner__stats strong { color: #101828; font-size: 1.4rem; line-height: 1; }
.ct-event-banner__stats small  { color: var(--ct-muted); font-size: .7rem; font-weight: 800; text-transform: uppercase; }
.ct-estado-control { display: grid; gap: 5px; }
.ct-estado-label { color: #475467; font-size: .78rem; font-weight: 800; }
.ct-estado-row { display: flex; gap: 8px; align-items: center; }
.ct-estado-select { min-height: 34px; width: 180px; }
.ct-btn--sm { min-height: 34px; padding: 6px 14px; font-size: .84rem; }

/* ── Action list (Expediente) ── */
.ct-action-list { display: grid; gap: 8px; margin-top: 14px; }
.ct-action-row { display: grid; grid-template-columns: minmax(0,1fr) auto auto; gap: 12px; align-items: center; border: 1px solid #edf1f5; border-radius: 8px; padding: 11px 14px; background: #fbfcfd; }
.ct-action-row__body strong { display: block; color: #243347; }
.ct-action-row__body small  { display: block; margin-top: 3px; color: var(--ct-muted); font-size: .82rem; }
.ct-estado-accion { min-height: 30px; width: 140px; font-size: .78rem; font-weight: 800; border-radius: 999px; padding: 4px 10px; cursor: pointer; border: 2px solid transparent; }
.ct-estado-accion.success { background: var(--ct-green-soft); color: var(--ct-green-strong); border-color: #9ac7b5; }
.ct-estado-accion.warning { background: var(--ct-amber-soft); color: var(--ct-amber); border-color: #fcd18a; }
.ct-estado-accion.neutral { background: #eef2f6; color: #475467; border-color: #d0d5dd; }

/* ── Log form ── */
.ct-log-form { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 14px; }
.ct-log-form textarea { flex: 1; min-height: 60px; }

/* ── Audit feed ── */
.ct-audit-feed { display: grid; gap: 8px; }
.ct-audit-feed article { display: grid; grid-template-columns: 120px minmax(0,1fr); gap: 13px; align-items: start; border: 1px solid #edf1f5; border-radius: 8px; padding: 11px 14px; background: #fbfcfd; }
.ct-audit-feed article > span { color: var(--ct-green); font-weight: 900; font-size: .8rem; line-height: 1.4; word-break: break-word; }
.ct-audit-feed strong { display: block; color: #243347; }
.ct-audit-feed p      { margin-top: 3px; color: #344054; font-size: .9rem; }
.ct-audit-feed small  { display: block; margin-top: 3px; color: var(--ct-muted); font-size: .78rem; }

/* ── Table ── */
.ct-table-wrapper { overflow-x: auto; }
.ct-table-wrapper table { width: 100%; min-width: 700px; border-collapse: collapse; }
.ct-table-wrapper th { padding: 10px 13px; background: #f7f9fb; color: #6f7b8a; font-size: .72rem; font-weight: 900; text-align: left; text-transform: uppercase; }
.ct-table-wrapper td { padding: 12px 13px; border-bottom: 1px solid #edf1f5; color: #344054; font-size: .88rem; vertical-align: top; }
.ct-table-wrapper td small { display: block; margin-top: 3px; color: var(--ct-muted); }

/* ── Forms ── */
.ct-form-grid           { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 13px; }
.ct-form-grid--three    { grid-template-columns: repeat(3,minmax(0,1fr)); }
.ct-form-grid .span-2   { grid-column: span 2; }
.ct-form-grid--three .span-2 { grid-column: span 2; }
.ct-form-grid .span-3   { grid-column: 1 / -1; }

/* ── Responsive ── */
@media (max-width: 1000px) {
  .ct-dashboard-grid { grid-template-columns: 1fr; }
  .ct-control-strip  { grid-template-columns: repeat(2,minmax(0,1fr)); }
  .ct-event-banner   { grid-template-columns: 1fr; }
}
@media (max-width: 680px) {
  .ct-form-grid, .ct-form-grid--three,
  .ct-control-strip, .ct-metric-grid { grid-template-columns: 1fr; }
  .ct-event-row { grid-template-columns: 1fr; }
  .ct-action-row { grid-template-columns: 1fr auto auto; }
  .ct-rto-grid { grid-template-columns: repeat(3,minmax(0,1fr)); }
  .ct-log-form { flex-direction: column; }
  .ct-btn { width: 100%; }
}
</style>
