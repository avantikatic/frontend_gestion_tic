<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import {
  useCctvDashboard,
  useCctvSedes,
  useCctvCamaras,
  useCctvCamarasPaginado,
  useCctvCargos,
  useCctvRegistros,
  useCctvCatalogos,
} from '../composables/cctv/useCctv.js'

const USUARIO = 'sistemas@avantika.com.co'

const activeView = ref('dashboard')
const error      = ref('')

// Filtro + paginacion de la tabla de camaras
const camarasFiltros = reactive({ id_sede: null, page: 1 })
function setCamarasSede(id) { camarasFiltros.id_sede = id || null; camarasFiltros.page = 1 }

// ── Composables ────────────────────────────────────────────────────────────────
const { dashboard, dashLoading }                                                                         = useCctvDashboard()
const { sites, sitesLoading, crearSedeMutation, actualizarSedeMutation, eliminarSedeMutation }          = useCctvSedes()
const { cameras, camerasLoading, crearCamaraMutation, actualizarCamaraMutation, eliminarCamaraMutation } = useCctvCamaras()
const { camarasPag, paginacion, camarasPagLoading } = useCctvCamarasPaginado(camarasFiltros)
const { roles, rolesLoading, crearCargoMutation, actualizarCargoMutation, eliminarCargoMutation }        = useCctvCargos()
const { changelogs, reviews, incidents, crearChangelogMutation, crearRevisionMutation, crearIncidenteMutation } = useCctvRegistros()
const { catalogos } = useCctvCatalogos()

const loading = computed(() => dashLoading.value || sitesLoading.value || camerasLoading.value || rolesLoading.value)

// Slug del nivel de acceso seleccionado — necesario para mostrar el fieldset de sedes
const nivelAccesoValor = computed(() => {
  const item = catalogos.value.niveles_acceso.find(n => n.id === roleForm.id_nivel_acceso)
  return item?.valor || ''
})

// ── Comboboxes buscables (sede / camara en Registros) ─────────────────────────
const combos = reactive({
  clSite:    { q: '', open: false },
  clCamera:  { q: '', open: false },
  incSite:   { q: '', open: false },
  incCamera: { q: '', open: false },
})

// Refs para auto-enfocar el input de busqueda al abrir
const refClSite    = ref(null)
const refClCamera  = ref(null)
const refIncSite   = ref(null)
const refIncCamera = ref(null)

function openCombo(combo, inputRef) {
  Object.values(combos).forEach(c => { if (c !== combo) c.open = false })
  combo.open = !combo.open
  if (combo.open) nextTick(() => inputRef.value?.focus())
}

function closeAllCombos(e) {
  if (!e.target.closest?.('.cv-combo')) {
    Object.values(combos).forEach(c => { c.open = false })
  }
}
onMounted(()   => document.addEventListener('mousedown', closeAllCombos))
onUnmounted(() => document.removeEventListener('mousedown', closeAllCombos))

// Opciones filtradas
const clSiteOpts = computed(() => {
  const t = combos.clSite.q.toLowerCase()
  return t ? sites.value.filter(s => s.nombre.toLowerCase().includes(t)) : sites.value
})
const clCameraOpts = computed(() => {
  const base = changeLogForm.id_sede
    ? cameras.value.filter(c => c.id_sede === changeLogForm.id_sede)
    : cameras.value
  const t = combos.clCamera.q.toLowerCase()
  return t ? base.filter(c =>
    (c.ubicacion_fisica + ' ' + (c.nombre_sede || '')).toLowerCase().includes(t)
  ) : base
})
const incSiteOpts = computed(() => {
  const t = combos.incSite.q.toLowerCase()
  return t ? sites.value.filter(s => s.nombre.toLowerCase().includes(t)) : sites.value
})
const incCameraOpts = computed(() => {
  const base = incidentForm.id_sede
    ? cameras.value.filter(c => c.id_sede === incidentForm.id_sede)
    : cameras.value
  const t = combos.incCamera.q.toLowerCase()
  return t ? base.filter(c =>
    (c.ubicacion_fisica + ' ' + (c.nombre_sede || '')).toLowerCase().includes(t)
  ) : base
})

// Selectores
function selectClSite(id) {
  changeLogForm.id_sede   = id
  changeLogForm.id_camara = null
  combos.clSite.q         = ''
  combos.clSite.open      = false
  combos.clCamera.q       = ''
}
function selectClCamera(id)  {
  changeLogForm.id_camara = id
  combos.clCamera.q       = ''
  combos.clCamera.open    = false
}
function selectIncSite(id) {
  incidentForm.id_sede   = id
  incidentForm.id_camara = null
  combos.incSite.q       = ''
  combos.incSite.open    = false
  combos.incCamera.q     = ''
}
function selectIncCamera(id) {
  incidentForm.id_camara = id
  combos.incCamera.q     = ''
  combos.incCamera.open  = false
}

// Etiquetas para mostrar la seleccion activa
function siteLabel(id)   { return sites.value.find(s => s.id_sede === id)?.nombre    || 'Sin sede especifica'   }
function cameraLabel(id) {
  const c = cameras.value.find(c => c.id_camara === id)
  return c ? `${c.nombre_sede} · ${c.ubicacion_fisica}` : 'Sin camara especifica'
}

// ── Navegación interna ─────────────────────────────────────────────────────────
const views = [
  { id: 'dashboard', label: 'Panel' },
  { id: 'sites',     label: 'Sedes' },
  { id: 'cameras',   label: 'Camaras' },
  { id: 'roles',     label: 'Cargos y permisos' },
  { id: 'records',   label: 'Registros' },
]

const viewTitle = computed(() => ({
  dashboard: 'Control de inventario CCTV',
  sites:     'Configuracion de sedes',
  cameras:   'Inventario de camaras',
  roles:     'Cargos y permisos',
  records:   'Evidencias y trazabilidad',
}[activeView.value]))

// ── Formularios ────────────────────────────────────────────────────────────────
const siteForm      = reactive(emptySite())
const cameraForm    = reactive(emptyCamera())
const roleForm      = reactive(emptyRole())
const changeLogForm = reactive(emptyChangeLog())
const reviewForm    = reactive(emptyReview())
const incidentForm  = reactive(emptyIncident())

// ── CRUD sedes ─────────────────────────────────────────────────────────────────
async function saveSite() {
  error.value = ''
  try {
    const payload = { ...sitePayload(), usuario_creacion: USUARIO, usuario_actualizacion: USUARIO }
    if (siteForm.id_sede) {
      await actualizarSedeMutation.mutateAsync({ ...payload, id_sede: siteForm.id_sede })
    } else {
      await crearSedeMutation.mutateAsync(payload)
    }
    Object.assign(siteForm, emptySite())
  } catch (e) {
    error.value = e?.response?.data?.message || 'Error guardando sede.'
  }
}

function editSite(site) { Object.assign(siteForm, site) }
function removeSite(id)  { eliminarSedeMutation.mutate(id) }

// ── CRUD cámaras ───────────────────────────────────────────────────────────────
async function saveCamera() {
  error.value = ''
  try {
    const payload = { ...cameraPayload(), usuario_creacion: USUARIO, usuario_actualizacion: USUARIO }
    if (cameraForm.id_camara) {
      await actualizarCamaraMutation.mutateAsync({ ...payload, id_camara: cameraForm.id_camara })
    } else {
      await crearCamaraMutation.mutateAsync(payload)
    }
    Object.assign(cameraForm, emptyCamera())
  } catch (e) {
    error.value = e?.response?.data?.message || 'Error guardando camara.'
  }
}

function editCamera(cam)  { Object.assign(cameraForm, cam) }
function removeCamera(id) { eliminarCamaraMutation.mutate(id) }

// ── CRUD cargos ────────────────────────────────────────────────────────────────
async function saveRole() {
  error.value = ''
  try {
    const payload = { ...rolePayload(), usuario_creacion: USUARIO, usuario_actualizacion: USUARIO }
    if (roleForm.id_cargo) {
      await actualizarCargoMutation.mutateAsync({ ...payload, id_cargo: roleForm.id_cargo })
    } else {
      await crearCargoMutation.mutateAsync(payload)
    }
    Object.assign(roleForm, emptyRole())
  } catch (e) {
    error.value = e?.response?.data?.message || 'Error guardando cargo.'
  }
}

function editRole(role) {
  Object.assign(roleForm, {
    ...role,
    puede_ver_camaras:               Boolean(role.puede_ver_camaras),
    puede_editar_inventario:         Boolean(role.puede_editar_inventario),
    puede_administrar_configuracion: Boolean(role.puede_administrar_configuracion),
    ids_sedes: [...(role.ids_sedes || [])],
  })
}
function removeRole(id) { eliminarCargoMutation.mutate(id) }

// ── Registros ──────────────────────────────────────────────────────────────────
async function saveChangeLog() {
  error.value = ''
  try {
    await crearChangelogMutation.mutateAsync({ ...changeLogForm, usuario_creacion: USUARIO })
    Object.assign(changeLogForm, emptyChangeLog())
  } catch (e) {
    error.value = e?.response?.data?.message || 'Error guardando cambio.'
  }
}

async function saveReview() {
  error.value = ''
  try {
    await crearRevisionMutation.mutateAsync({ ...reviewForm, usuario_creacion: USUARIO })
    Object.assign(reviewForm, emptyReview())
  } catch (e) {
    error.value = e?.response?.data?.message || 'Error guardando revision.'
  }
}

async function saveIncident() {
  error.value = ''
  try {
    await crearIncidenteMutation.mutateAsync({ ...incidentForm, usuario_creacion: USUARIO })
    Object.assign(incidentForm, emptyIncident())
  } catch (e) {
    error.value = e?.response?.data?.message || 'Error guardando incidente.'
  }
}

// ── Payloads ───────────────────────────────────────────────────────────────────
function sitePayload() {
  return {
    nombre:                siteForm.nombre,
    ubicacion_general:     siteForm.ubicacion_general,
    responsable_operativo: siteForm.responsable_operativo,
    sistema_grabacion:     siteForm.sistema_grabacion,
    codigo_activo:         siteForm.codigo_activo,
    observaciones:         siteForm.observaciones,
  }
}

function cameraPayload() {
  return {
    id_sede:                         Number(cameraForm.id_sede),
    ubicacion_fisica:                cameraForm.ubicacion_fisica,
    id_estado_camara:                Number(cameraForm.id_estado_camara),
    dias_almacenamiento:             Number(cameraForm.dias_almacenamiento || 0),
    id_metodo_backup:                Number(cameraForm.id_metodo_backup),
    fecha_instalacion_actualizacion: cameraForm.fecha_instalacion_actualizacion,
    observaciones:                   cameraForm.observaciones,
  }
}

function rolePayload() {
  return {
    nombre:                          roleForm.nombre,
    id_nivel_acceso:                 Number(roleForm.id_nivel_acceso),
    justificacion_acceso:            roleForm.justificacion_acceso,
    puede_ver_camaras:               roleForm.puede_ver_camaras,
    puede_editar_inventario:         roleForm.puede_editar_inventario,
    puede_administrar_configuracion: roleForm.puede_administrar_configuracion,
    ids_sedes: nivelAccesoValor.value === 'sedes_especificas' ? roleForm.ids_sedes.map(Number) : [],
  }
}

// ── Valores por defecto ────────────────────────────────────────────────────────
function emptySite() {
  return { id_sede: null, nombre: '', ubicacion_general: '', responsable_operativo: '', sistema_grabacion: '', codigo_activo: '', observaciones: '' }
}
function emptyCamera() {
  return { id_camara: null, id_sede: '', codigo_equipo_grabacion: '', ubicacion_fisica: '', id_estado_camara: null, dias_almacenamiento: 0, id_metodo_backup: null, fecha_instalacion_actualizacion: new Date().toISOString().slice(0, 10), observaciones: '' }
}
function emptyRole() {
  return { id_cargo: null, nombre: '', id_nivel_acceso: null, justificacion_acceso: '', puede_ver_camaras: false, puede_editar_inventario: false, puede_administrar_configuracion: false, ids_sedes: [] }
}
function emptyChangeLog() {
  return { fecha_cambio: new Date().toISOString().slice(0, 10), id_sede: null, id_camara: null, descripcion: '', observaciones: '', cargo_responsable: 'Coordinador TIC' }
}
function emptyReview() {
  return { fecha_revision: new Date().toISOString().slice(0, 10), cargo_revisor: 'Coordinador TIC', camaras_activas: 0, camaras_mantenimiento: 0, camaras_inactivas: 0, almacenamiento_verificado: false, backups_verificados: false, accesos_verificados: false, hallazgos: '', proxima_revision: '' }
}
function emptyIncident() {
  return { fecha_incidente: new Date().toISOString().slice(0, 10), id_sede: null, id_camara: null, titulo: '', id_severidad: null, descripcion: '', accion_correctiva: '', id_estado_incidente: null }
}

// KPIs dinamicos por sede (camaras por sede, computado del estado local)
const camerasPerSite = computed(() =>
  sites.value.map(s => ({
    nombre:  s.nombre,
    camaras: cameras.value.filter(c => c.id_sede === s.id_sede).length,
  }))
)

// ── Helpers de UI ──────────────────────────────────────────────────────────────
function badgeClass(value) {
  if (['activa', 'todas_las_sedes', 'cerrado', 'baja'].includes(value))                         return 'ok'
  if (['en_mantenimiento', 'sedes_especificas', 'en_gestion', 'media'].includes(value))          return 'warn'
  if (['retirada', 'inactiva', 'sin_acceso', 'abierto', 'alta', 'critica'].includes(value))     return 'danger'
  return ''
}
function label(value) {
  return String(value || '').replaceAll('_', ' ').replace(/^\w/, l => l.toUpperCase())
}
</script>

<template>
  <div class="cv">

    <!-- Nav interna -->
    <nav class="cv-nav">
      <button
        v-for="view in views"
        :key="view.id"
        class="cv-nav__item"
        :class="{ active: activeView === view.id }"
        type="button"
        @click="activeView = view.id"
      >
        {{ view.label }}
      </button>
    </nav>

    <!-- Topbar de la sección -->
    <header class="cv-topbar">
      <div>
        <p class="cv-eyebrow">Procedimiento de administracion CCTV · PR-TIC-06</p>
        <h1 class="cv-title">{{ viewTitle }}</h1>
      </div>
      <div class="cv-topbar-actions">
        <button class="cv-btn-ghost" type="button" @click="activeView = 'cameras'">
          + Nueva camara
        </button>
      </div>
    </header>

    <p v-if="error"   class="cv-alert">{{ error }}</p>
    <p v-if="loading" class="cv-loading">Cargando informacion…</p>

    <!-- ── PANEL (DASHBOARD) ─────────────────────────────────────────────── -->
    <section v-if="activeView === 'dashboard'" class="cv-view">
      <div class="cv-stats-grid">
        <article class="cv-metric">
          <span>Sedes</span>
          <strong>{{ dashboard.totales.sedes }}</strong>
        </article>
        <article class="cv-metric">
          <span>Cargos autorizados</span>
          <strong>{{ dashboard.totales.cargos_autorizados }}</strong>
        </article>
        <article v-for="s in camerasPerSite" :key="s.nombre" class="cv-metric cv-metric--site">
          <span>{{ s.nombre }}</span>
          <strong>{{ s.camaras }}</strong>
          <em>camaras</em>
        </article>
      </div>

      <div class="cv-panel">
        <div class="cv-section-head">
          <div>
            <h2>Resumen por sede</h2>
            <p>Control de camaras, almacenamiento y backups por ubicacion.</p>
          </div>
        </div>
        <div class="cv-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Sede</th><th>Ubicacion</th><th>Camaras</th><th>Almacenamiento</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!dashboard.por_sede.length">
                <td colspan="4" style="text-align:center;color:#6b7280">Sin sedes registradas. Agrega una sede para ver el resumen.</td>
              </tr>
              <tr v-for="site in dashboard.por_sede" :key="site.id_sede">
                <td><strong>{{ site.nombre }}</strong></td>
                <td>{{ site.ubicacion_general }}</td>
                <td>{{ site.camaras }}</td>
                <td>{{ site.dias_almacenamiento }} dias</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- ── SEDES ──────────────────────────────────────────────────────────── -->
    <section v-if="activeView === 'sites'" class="cv-view cv-split">

      <form class="cv-panel" @submit.prevent="saveSite">
        <div class="cv-section-head">
          <div>
            <h2>{{ siteForm.id_sede ? 'Editar sede' : 'Agregar sede' }}</h2>
            <p>Registra sedes antes de entregar el sistema a operacion.</p>
          </div>
        </div>
        <label>Nombre <input v-model="siteForm.nombre" required /></label>
        <label>Ubicacion general <input v-model="siteForm.ubicacion_general" required /></label>
        <label>Responsable operativo <input v-model="siteForm.responsable_operativo" /></label>
        <label>Sistema de grabacion <input v-model="siteForm.sistema_grabacion" placeholder="NVR, DVR, NAS" /></label>
        <label>Codigo de activo <input v-model="siteForm.codigo_activo" /></label>
        <label>Observaciones <textarea v-model="siteForm.observaciones"></textarea></label>
        <div class="cv-form-actions">
          <button class="cv-btn-primary" type="submit" :disabled="crearSedeMutation.isPending.value || actualizarSedeMutation.isPending.value">Guardar sede</button>
          <button class="cv-btn-ghost" type="button" @click="Object.assign(siteForm, emptySite())">Limpiar</button>
        </div>
      </form>

      <div class="cv-panel">
        <div class="cv-section-head">
          <div>
            <h2>Sedes configuradas</h2>
            <p>Base de crecimiento para nuevas oficinas, bodegas y centros de distribucion.</p>
          </div>
        </div>
        <div v-if="!sites.length" class="cv-empty">Sin sedes registradas. Agrega la primera sede.</div>
        <article v-for="site in sites" :key="site.id_sede" class="cv-card">
          <header>
            <div>
              <h3>{{ site.nombre }}</h3>
              <p>{{ site.ubicacion_general }} · {{ site.responsable_operativo || 'Sin responsable' }}</p>
            </div>
          </header>
          <p>{{ site.sistema_grabacion || 'Sistema de grabacion no definido' }}<span v-if="site.codigo_activo"> · <strong>{{ site.codigo_activo }}</strong></span></p>
          <div class="cv-row-actions">
            <button class="cv-btn-table" type="button" @click="editSite(site)">Editar</button>
            <button class="cv-btn-danger" type="button" @click="removeSite(site.id_sede)">Eliminar</button>
          </div>
        </article>
      </div>

    </section>

    <!-- ── CAMARAS ────────────────────────────────────────────────────────── -->
    <section v-if="activeView === 'cameras'" class="cv-view cv-split">

      <form class="cv-panel" @submit.prevent="saveCamera">
        <div class="cv-section-head">
          <div>
            <h2>{{ cameraForm.id_camara ? 'Editar camara' : 'Agregar camara' }}</h2>
            <p>Registra la ubicacion y el equipo NVR/DVR asociado.</p>
          </div>
        </div>
        <label>
          Sede
          <select v-model.number="cameraForm.id_sede" required>
            <option disabled value="">Seleccionar sede</option>
            <option v-for="site in sites" :key="site.id_sede" :value="site.id_sede">{{ site.nombre }}</option>
          </select>
        </label>
        <div v-if="cameraForm.id_camara" class="cv-auto-code">
          <span class="cv-muted-label">Codigo equipo</span>
          <strong>{{ cameraForm.codigo_equipo_grabacion }}</strong>
        </div>
        <!-- <div v-else class="cv-auto-code cv-auto-code--hint">
          <span>Codigo</span>
          <span class="cv-muted-label">Se asignara automaticamente al guardar (ej: DVR-CAM-12)</span>
        </div> -->
        <label>Ubicacion fisica <input v-model="cameraForm.ubicacion_fisica" required /></label>
        <label>
          Estado
          <select v-model.number="cameraForm.id_estado_camara" required>
            <option :value="null" disabled>Seleccionar estado</option>
            <option v-for="e in catalogos.estados_camara" :key="e.id" :value="e.id">{{ e.nombre }}</option>
          </select>
        </label>
        <label>Almacenamiento (dias) <input v-model.number="cameraForm.dias_almacenamiento" type="number" min="0" /></label>
        <label>
          Metodo de almacenamiento
          <select v-model.number="cameraForm.id_metodo_backup">
            <option :value="null" disabled>Seleccionar metodo</option>
            <option v-for="m in catalogos.metodos_backup" :key="m.id" :value="m.id">{{ m.nombre }}</option>
          </select>
        </label>
        <label>Fecha instalacion / actualizacion <input v-model="cameraForm.fecha_instalacion_actualizacion" type="date" /></label>
        <label>Observaciones <textarea v-model="cameraForm.observaciones"></textarea></label>
        <div class="cv-form-actions">
          <button class="cv-btn-primary" type="submit" :disabled="crearCamaraMutation.isPending.value || actualizarCamaraMutation.isPending.value">Guardar camara</button>
          <button class="cv-btn-ghost" type="button" @click="Object.assign(cameraForm, emptyCamera())">Limpiar</button>
        </div>
      </form>

      <div class="cv-panel">
        <div class="cv-section-head">
          <div>
            <h2>Camaras registradas</h2>
            <p>Estado, ubicacion, almacenamiento y equipo asociado.</p>
          </div>
          <select class="cv-search" :value="camarasFiltros.id_sede" @change="setCamarasSede(Number($event.target.value) || null)">
            <option :value="null">Todas las sedes</option>
            <option v-for="s in sites" :key="s.id_sede" :value="s.id_sede">{{ s.nombre }}</option>
          </select>
        </div>
        <div class="cv-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Equipo</th><th>Sede</th><th>Ubicacion</th><th>Estado</th><th>Almacenamiento</th><th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="camarasPagLoading">
                <td colspan="6" style="text-align:center;color:#6b7280">Cargando…</td>
              </tr>
              <tr v-else-if="!camarasPag.length">
                <td colspan="6" style="text-align:center;color:#6b7280">Sin camaras registradas.</td>
              </tr>
              <tr v-for="camera in camarasPag" :key="camera.id_camara">
                <td><strong>{{ camera.codigo_equipo_grabacion }}</strong></td>
                <td>{{ camera.nombre_sede }}</td>
                <td>{{ camera.ubicacion_fisica }}</td>
                <td><span class="cv-pill" :class="badgeClass(camera.estado_valor)">{{ camera.estado }}</span></td>
                <td>{{ camera.metodo_backup }} · {{ camera.dias_almacenamiento }} dias</td>
                <td>
                  <div class="cv-row-actions">
                    <button class="cv-btn-table" type="button" @click="editCamera(camera)">Editar</button>
                    <button class="cv-btn-danger" type="button" @click="removeCamera(camera.id_camara)">Eliminar</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- Paginacion -->
        <div v-if="paginacion.total_pages > 1" class="cv-pagination">
          <button class="cv-btn-ghost cv-pag-btn" :disabled="camarasFiltros.page <= 1" @click="camarasFiltros.page--">&#8592;</button>
          <span class="cv-pag-info">Pagina {{ paginacion.page }} de {{ paginacion.total_pages }} · {{ paginacion.total }} camaras</span>
          <button class="cv-btn-ghost cv-pag-btn" :disabled="camarasFiltros.page >= paginacion.total_pages" @click="camarasFiltros.page++">&#8594;</button>
        </div>
        <p v-else class="cv-pag-total">{{ paginacion.total }} camara{{ paginacion.total !== 1 ? 's' : '' }}</p>
      </div>

    </section>

    <!-- ── CARGOS Y PERMISOS ──────────────────────────────────────────────── -->
    <section v-if="activeView === 'roles'" class="cv-view cv-split">

      <form class="cv-panel" @submit.prevent="saveRole">
        <div class="cv-section-head">
          <div>
            <h2>{{ roleForm.id_cargo ? 'Editar cargo' : 'Agregar cargo' }}</h2>
            <p>El acceso se define por cargos, no por personas.</p>
          </div>
        </div>
        <label>Cargo <input v-model="roleForm.nombre" required /></label>
        <label>
          Alcance de acceso
          <select v-model.number="roleForm.id_nivel_acceso" required>
            <option :value="null" disabled>Seleccionar nivel</option>
            <option v-for="n in catalogos.niveles_acceso" :key="n.id" :value="n.id">{{ n.nombre }}</option>
          </select>
        </label>
        <fieldset v-if="nivelAccesoValor === 'sedes_especificas'" class="cv-fieldset">
          <legend>Sedes autorizadas</legend>
          <label v-for="site in sites" :key="site.id_sede" class="cv-check-row">
            <input v-model="roleForm.ids_sedes" :value="site.id_sede" type="checkbox" />
            {{ site.nombre }}
          </label>
        </fieldset>
        <fieldset class="cv-fieldset">
          <legend>Permisos</legend>
          <label class="cv-check-row"><input v-model="roleForm.puede_ver_camaras" type="checkbox" /> Ver camaras</label>
          <label class="cv-check-row"><input v-model="roleForm.puede_editar_inventario" type="checkbox" /> Editar inventario</label>
          <label class="cv-check-row"><input v-model="roleForm.puede_administrar_configuracion" type="checkbox" /> Administrar configuracion</label>
        </fieldset>
        <label>Justificacion <textarea v-model="roleForm.justificacion_acceso"></textarea></label>
        <div class="cv-form-actions">
          <button class="cv-btn-primary" type="submit" :disabled="crearCargoMutation.isPending.value || actualizarCargoMutation.isPending.value">Guardar cargo</button>
          <button class="cv-btn-ghost" type="button" @click="Object.assign(roleForm, emptyRole())">Limpiar</button>
        </div>
      </form>

      <div class="cv-panel">
        <div class="cv-section-head">
          <div>
            <h2>Cargos autorizados</h2>
            <p>Control de acceso y administracion segun procedimiento.</p>
          </div>
        </div>
        <div v-if="!roles.length" class="cv-empty">Sin cargos registrados.</div>
        <article v-for="role in roles" :key="role.id_cargo" class="cv-card">
          <header>
            <div>
              <h3>{{ role.nombre }}</h3>
              <p>{{ role.justificacion_acceso || 'Sin justificacion registrada' }}</p>
            </div>
            <span class="cv-pill" :class="badgeClass(role.nivel_acceso_valor)">{{ role.nivel_acceso }}</span>
          </header>
          <div class="cv-pill-row">
            <span v-if="role.puede_ver_camaras"               class="cv-pill ok">Ver camaras</span>
            <span v-if="role.puede_editar_inventario"         class="cv-pill warn">Editar inventario</span>
            <span v-if="role.puede_administrar_configuracion" class="cv-pill danger">Administrar</span>
            <span v-if="!role.puede_ver_camaras"              class="cv-pill danger">Sin acceso CCTV</span>
          </div>
          <div class="cv-row-actions">
            <button class="cv-btn-table" type="button" @click="editRole(role)">Editar</button>
            <button class="cv-btn-danger" type="button" @click="removeRole(role.id_cargo)">Eliminar</button>
          </div>
        </article>
      </div>

    </section>

    <!-- ── REGISTROS ──────────────────────────────────────────────────────── -->
    <section v-if="activeView === 'records'" class="cv-view cv-records-grid">

      <!-- Revision periodica -->
      <form class="cv-panel" @submit.prevent="saveReview">
        <h2>Revision periodica</h2>
        <label>Fecha <input v-model="reviewForm.fecha_revision" type="date" required /></label>
        <label>Responsable <input v-model="reviewForm.cargo_revisor" required /></label>
        <div class="cv-three-cols">
          <label>Activas <input v-model.number="reviewForm.camaras_activas" type="number" min="0" /></label>
          <label>Mantenimiento <input v-model.number="reviewForm.camaras_mantenimiento" type="number" min="0" /></label>
          <label>Inactivas <input v-model.number="reviewForm.camaras_inactivas" type="number" min="0" /></label>
        </div>
        <fieldset class="cv-fieldset">
          <legend>Validaciones</legend>
          <label class="cv-check-row"><input v-model="reviewForm.almacenamiento_verificado" type="checkbox" /> Almacenamiento</label>
          <label class="cv-check-row"><input v-model="reviewForm.backups_verificados" type="checkbox" /> Backups</label>
          <label class="cv-check-row"><input v-model="reviewForm.accesos_verificados" type="checkbox" /> Accesos</label>
        </fieldset>
        <label>Hallazgos <textarea v-model="reviewForm.hallazgos"></textarea></label>
        <label>Proxima revision <input v-model="reviewForm.proxima_revision" type="date" /></label>
        <button class="cv-btn-primary" type="submit" :disabled="crearRevisionMutation.isPending.value">Guardar revision</button>
      </form>

      <!-- Cambios y novedades -->
      <form class="cv-panel" @submit.prevent="saveChangeLog">
        <h2>Cambios y novedades</h2>
        <label>Fecha <input v-model="changeLogForm.fecha_cambio" type="date" required /></label>
        <label>
          Sede
          <div class="cv-combo" @mousedown.stop>
            <button type="button" class="cv-combo__trigger" @click="openCombo(combos.clSite, refClSite)">
              <span :class="{ 'cv-combo__placeholder': !changeLogForm.id_sede }">{{ siteLabel(changeLogForm.id_sede) }}</span>
              <span class="cv-combo__caret">▾</span>
            </button>
            <div v-if="combos.clSite.open" class="cv-combo__panel">
              <input ref="refClSite" v-model="combos.clSite.q" class="cv-combo__search" type="text" placeholder="Buscar sede..." @keydown.esc="combos.clSite.open = false" />
              <ul class="cv-combo__list">
                <li class="cv-combo__null" @mousedown.prevent="selectClSite(null)">Sin sede especifica</li>
                <li v-for="s in clSiteOpts" :key="s.id_sede"
                    class="cv-combo__item" :class="{ 'cv-combo__selected': changeLogForm.id_sede === s.id_sede }"
                    @mousedown.prevent="selectClSite(s.id_sede)">{{ s.nombre }}</li>
                <li v-if="combos.clSite.q && !clSiteOpts.length" class="cv-combo__empty">Sin resultados</li>
              </ul>
            </div>
          </div>
        </label>
        <label>
          Camara
          <div class="cv-combo" @mousedown.stop>
            <button type="button" class="cv-combo__trigger" @click="openCombo(combos.clCamera, refClCamera)">
              <span :class="{ 'cv-combo__placeholder': !changeLogForm.id_camara }">{{ cameraLabel(changeLogForm.id_camara) }}</span>
              <span class="cv-combo__caret">▾</span>
            </button>
            <div v-if="combos.clCamera.open" class="cv-combo__panel">
              <input ref="refClCamera" v-model="combos.clCamera.q" class="cv-combo__search" type="text" placeholder="Buscar camara..." @keydown.esc="combos.clCamera.open = false" />
              <ul class="cv-combo__list">
                <li class="cv-combo__null" @mousedown.prevent="selectClCamera(null)">Sin camara especifica</li>
                <li v-for="c in clCameraOpts" :key="c.id_camara"
                    class="cv-combo__item" :class="{ 'cv-combo__selected': changeLogForm.id_camara === c.id_camara }"
                    @mousedown.prevent="selectClCamera(c.id_camara)">{{ c.nombre_sede }} · {{ c.ubicacion_fisica }}</li>
                <li v-if="combos.clCamera.q && !clCameraOpts.length" class="cv-combo__empty">Sin resultados</li>
              </ul>
            </div>
          </div>
        </label>
        <label>Descripcion <textarea v-model="changeLogForm.descripcion" required></textarea></label>
        <label>Observaciones <textarea v-model="changeLogForm.observaciones"></textarea></label>
        <button class="cv-btn-primary" type="submit" :disabled="crearChangelogMutation.isPending.value">Guardar cambio</button>
      </form>

      <!-- Incidentes -->
      <form class="cv-panel" @submit.prevent="saveIncident">
        <h2>Incidentes o fallas</h2>
        <label>Fecha <input v-model="incidentForm.fecha_incidente" type="date" required /></label>
        <label>Titulo <input v-model="incidentForm.titulo" required /></label>
        <label>
          Sede afectada
          <div class="cv-combo" @mousedown.stop>
            <button type="button" class="cv-combo__trigger" @click="openCombo(combos.incSite, refIncSite)">
              <span :class="{ 'cv-combo__placeholder': !incidentForm.id_sede }">{{ siteLabel(incidentForm.id_sede) }}</span>
              <span class="cv-combo__caret">▾</span>
            </button>
            <div v-if="combos.incSite.open" class="cv-combo__panel">
              <input ref="refIncSite" v-model="combos.incSite.q" class="cv-combo__search" type="text" placeholder="Buscar sede..." @keydown.esc="combos.incSite.open = false" />
              <ul class="cv-combo__list">
                <li class="cv-combo__null" @mousedown.prevent="selectIncSite(null)">Sin sede especifica</li>
                <li v-for="s in incSiteOpts" :key="s.id_sede"
                    class="cv-combo__item" :class="{ 'cv-combo__selected': incidentForm.id_sede === s.id_sede }"
                    @mousedown.prevent="selectIncSite(s.id_sede)">{{ s.nombre }}</li>
                <li v-if="combos.incSite.q && !incSiteOpts.length" class="cv-combo__empty">Sin resultados</li>
              </ul>
            </div>
          </div>
        </label>
        <label>
          Camara afectada
          <div class="cv-combo" @mousedown.stop>
            <button type="button" class="cv-combo__trigger" @click="openCombo(combos.incCamera, refIncCamera)">
              <span :class="{ 'cv-combo__placeholder': !incidentForm.id_camara }">{{ cameraLabel(incidentForm.id_camara) }}</span>
              <span class="cv-combo__caret">▾</span>
            </button>
            <div v-if="combos.incCamera.open" class="cv-combo__panel">
              <input ref="refIncCamera" v-model="combos.incCamera.q" class="cv-combo__search" type="text" placeholder="Buscar camara..." @keydown.esc="combos.incCamera.open = false" />
              <ul class="cv-combo__list">
                <li class="cv-combo__null" @mousedown.prevent="selectIncCamera(null)">Sin camara especifica</li>
                <li v-for="c in incCameraOpts" :key="c.id_camara"
                    class="cv-combo__item" :class="{ 'cv-combo__selected': incidentForm.id_camara === c.id_camara }"
                    @mousedown.prevent="selectIncCamera(c.id_camara)">{{ c.nombre_sede }} · {{ c.ubicacion_fisica }}</li>
                <li v-if="combos.incCamera.q && !incCameraOpts.length" class="cv-combo__empty">Sin resultados</li>
              </ul>
            </div>
          </div>
        </label>
        <div class="cv-two-cols">
          <label>
            Severidad
            <select v-model.number="incidentForm.id_severidad" required>
              <option :value="null" disabled>Seleccionar severidad</option>
              <option v-for="s in catalogos.severidades" :key="s.id" :value="s.id">{{ s.nombre }}</option>
            </select>
          </label>
          <label>
            Estado
            <select v-model.number="incidentForm.id_estado_incidente" required>
              <option :value="null" disabled>Seleccionar estado</option>
              <option v-for="e in catalogos.estados_incidente" :key="e.id" :value="e.id">{{ e.nombre }}</option>
            </select>
          </label>
        </div>
        <label>Descripcion <textarea v-model="incidentForm.descripcion" required></textarea></label>
        <label>Accion correctiva <textarea v-model="incidentForm.accion_correctiva"></textarea></label>
        <button class="cv-btn-primary" type="submit" :disabled="crearIncidenteMutation.isPending.value">Guardar incidente</button>
      </form>

      <!-- Historial unificado -->
      <section class="cv-panel cv-history">
        <h2>Ultimos registros</h2>
        <div v-if="!changelogs.length && !reviews.length && !incidents.length" class="cv-empty">
          Sin registros guardados aun.
        </div>
        <article v-for="log in changelogs.slice(0,5)" :key="`log-${log.id_registro_cambio}`" class="cv-history-item">
          <strong>{{ log.fecha_cambio }} · {{ log.descripcion }}</strong>
          <span>{{ log.nombre_sede || 'General' }}</span>
        </article>
        <article v-for="rev in reviews.slice(0,5)" :key="`rev-${rev.id_revision}`" class="cv-history-item">
          <strong>{{ rev.fecha_revision }} · Revision periodica</strong>
          <span>{{ rev.hallazgos || 'Sin hallazgos registrados' }}</span>
        </article>
        <article v-for="inc in incidents.slice(0,5)" :key="`inc-${inc.id_incidente}`" class="cv-history-item">
          <strong>{{ inc.fecha_incidente }} · {{ inc.titulo }}</strong>
          <span>{{ inc.estado }} · {{ inc.severidad }}</span>
        </article>
      </section>

    </section>
  </div>
</template>

<style scoped>
.cv {
  --cv-bg:      #f6f8fb;
  --cv-surface: #ffffff;
  --cv-line:    #dce5e8;
  --cv-ink:     #172126;
  --cv-muted:   #657178;
  --cv-accent:  #0f766e;
  --cv-accent-s:#115e59;
  --cv-danger:  #b42318;
  --cv-warn:    #a16207;
  --cv-ok:      #15803d;
  --cv-shadow:  0 2px 8px rgba(34,51,60,.06);

  display: flex;
  flex-direction: column;
  gap: 16px;
  font-family: Inter, system-ui, -apple-system, "Segoe UI", sans-serif;
  color: var(--cv-ink);
}

.cv-nav { display: flex; flex-wrap: wrap; gap: 6px; padding: 10px 14px; background: var(--cv-surface); border: 1px solid var(--cv-line); border-radius: 10px; box-shadow: var(--cv-shadow); }
.cv-nav__item { border: 1px solid transparent; background: transparent; border-radius: 8px; min-height: 36px; padding: 0 14px; color: #35464d; font-weight: 700; cursor: pointer; font-size: .88rem; transition: background .12s; }
.cv-nav__item:hover { background: #e9f5f3; }
.cv-nav__item.active { background: #e9f5f3; border-color: #cbe7e2; color: var(--cv-accent-s); }

.cv-topbar { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
.cv-eyebrow { color: var(--cv-accent); font-size: .75rem; font-weight: 900; letter-spacing: .04em; text-transform: uppercase; margin: 0 0 4px; }
.cv-title { font-size: clamp(1.4rem,2vw,1.9rem); font-weight: 800; margin: 0; color: #111827; }
.cv-topbar-actions { display: flex; gap: 10px; }

.cv-btn-primary, .cv-btn-ghost, .cv-btn-danger, .cv-btn-table {
  border: 1px solid transparent; border-radius: 8px; min-height: 38px; padding: 0 14px; white-space: nowrap; font: inherit; cursor: pointer; font-weight: 700; font-size: .88rem;
}
.cv-btn-primary { background: var(--cv-accent); color: #fff; }
.cv-btn-primary:hover:not(:disabled) { background: var(--cv-accent-s); }
.cv-btn-primary:disabled { opacity: .55; cursor: not-allowed; }
.cv-btn-ghost, .cv-btn-table { background: #fff; color: var(--cv-ink); border-color: var(--cv-line); }
.cv-btn-danger { background: #fff5f5; color: var(--cv-danger); border-color: #ffd5d2; }

.cv-alert   { border-radius: 8px; padding: 11px 14px; color: var(--cv-danger); background: #fff1ef; border: 1px solid #ffd5d2; margin: 0; }
.cv-loading { border-radius: 8px; padding: 11px 14px; color: #315f5a; background: #e8f6f4; border: 1px solid #c9e9e5; margin: 0; }

.cv-view { display: block; }
.cv-split { display: grid; grid-template-columns: minmax(300px,400px) minmax(0,1fr); gap: 18px; align-items: start; }
.cv-records-grid { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 18px; align-items: start; }
.cv-history { grid-column: 1 / -1; }

.cv-stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 14px; margin-bottom: 4px; align-items: stretch; }
.cv-metric { background: var(--cv-surface); border: 1px solid var(--cv-line); border-radius: 8px; padding: 18px 20px; box-shadow: var(--cv-shadow); display: flex; flex-direction: column; }
.cv-metric span { color: var(--cv-muted); display: block; font-size: .88rem; line-height: 1.3; min-height: 2.6em; margin-bottom: 8px; }
.cv-metric strong { display: block; font-size: 2rem; color: var(--cv-ink); }
.cv-metric--site strong { font-size: 1.6rem; color: var(--cv-accent); }
.cv-metric--site em { font-size: .78rem; color: var(--cv-muted); font-style: normal; margin-top: 2px; display: block; }

.cv-panel { background: var(--cv-surface); border: 1px solid var(--cv-line); border-radius: 8px; padding: 18px 20px; box-shadow: var(--cv-shadow); display: grid; gap: 14px; }

.cv-section-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; }
.cv-section-head h2 { margin: 0 0 4px; font-size: 1rem; }
.cv-section-head p, .cv-panel p { color: var(--cv-muted); font-size: .88rem; line-height: 1.5; margin: 0; }

.cv label { display: grid; gap: 6px; color: #344246; font-size: .88rem; font-weight: 700; }
.cv input, .cv select, .cv textarea { width: 100%; border: 1px solid var(--cv-line); border-radius: 8px; min-height: 40px; padding: 0 11px; color: var(--cv-ink); background: #fff; font: inherit; font-size: .88rem; }
.cv textarea { min-height: 80px; padding-top: 9px; resize: vertical; }
.cv input:focus, .cv select:focus, .cv textarea:focus { outline: 3px solid rgba(15,118,110,.15); border-color: var(--cv-accent); }
.cv-form-actions, .cv-row-actions, .cv-pill-row, .cv-topbar-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.cv-two-cols   { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.cv-three-cols { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; }

.cv-fieldset { border: 1px solid var(--cv-line); border-radius: 8px; display: grid; gap: 9px; margin: 0; padding: 13px; }
.cv-fieldset legend { color: var(--cv-muted); font-weight: 800; padding: 0 5px; font-size: .84rem; }
.cv-check-row { display: flex; align-items: center; gap: 9px; font-weight: 600; font-size: .88rem; }
.cv-check-row input { width: 16px; min-height: 16px; }

.cv-table-wrap { overflow-x: auto; }
.cv-table-wrap table, .cv table { width: 100%; min-width: 680px; border-collapse: collapse; }
.cv th { border-bottom: 1px solid var(--cv-line); padding: 10px; color: var(--cv-muted); font-size: .74rem; text-transform: uppercase; text-align: left; }
.cv td { border-bottom: 1px solid var(--cv-line); padding: 11px 10px; font-size: .9rem; vertical-align: middle; }
.cv-search { max-width: 220px; min-height: 36px; border: 1px solid var(--cv-line); border-radius: 8px; padding: 0 10px; font: inherit; font-size: .86rem; }

.cv-card { border: 1px solid var(--cv-line); border-radius: 8px; padding: 13px; display: grid; gap: 10px; background: #fff; }
.cv-card header { display: flex; justify-content: space-between; gap: 10px; align-items: flex-start; }
.cv-card h3 { margin: 0 0 3px; font-size: .95rem; }
.cv-card p { margin: 0; color: var(--cv-muted); font-size: .86rem; }

.cv-history-item { border: 1px solid var(--cv-line); border-radius: 8px; padding: 11px 13px; display: grid; gap: 3px; background: #fff; }
.cv-history-item strong { font-size: .88rem; color: var(--cv-ink); }
.cv-history-item span   { font-size: .82rem; color: var(--cv-muted); }

.cv-pill { border-radius: 999px; background: #edf2f4; color: #3f5054; padding: 4px 10px; font-size: .74rem; font-weight: 800; display: inline-flex; align-items: center; min-height: 26px; white-space: nowrap; }
.cv-pill.ok     { background: #e7f7ee; color: var(--cv-ok); }
.cv-pill.warn   { background: #fff7df; color: var(--cv-warn); }
.cv-pill.danger { background: #fff1ef; color: var(--cv-danger); }

.cv-empty { border: 1px dashed #c9d8dc; border-radius: 8px; background: #f8fafa; padding: 16px; text-align: center; color: var(--cv-muted); font-size: .88rem; }

/* ── Paginacion ─────────────────────────────────────────────────────────────── */
.cv-pagination { display: flex; align-items: center; gap: 10px; justify-content: center; padding-top: 4px; }
.cv-pag-btn    { min-width: 36px; padding: 0 10px; font-size: 1rem; }
.cv-pag-info   { font-size: .84rem; color: var(--cv-muted); }
.cv-pag-total  { font-size: .84rem; color: var(--cv-muted); text-align: center; margin: 0; }

/* ── Combobox buscable ──────────────────────────────────────────────────────── */
.cv-combo { position: relative; }

.cv-combo__trigger {
  width: 100%; min-height: 40px; padding: 0 11px;
  border: 1px solid var(--cv-line); border-radius: 8px;
  background: #fff; color: var(--cv-ink);
  font: inherit; font-size: .88rem; cursor: pointer;
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  text-align: left;
}
.cv-combo__trigger:hover  { border-color: #9ab5ba; }
.cv-combo__trigger:focus  { outline: 3px solid rgba(15,118,110,.15); border-color: var(--cv-accent); }
.cv-combo__caret          { color: var(--cv-muted); font-size: .7rem; flex-shrink: 0; }
.cv-combo__placeholder    { color: #9ab0b5; }

.cv-combo__panel {
  position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 200;
  background: #fff; border: 1px solid var(--cv-line); border-radius: 8px;
  box-shadow: 0 6px 20px rgba(23,33,38,.13); overflow: hidden;
}

.cv .cv-combo__panel input,
.cv-combo__search {
  display: block; width: 100%; box-sizing: border-box;
  padding: 9px 11px; min-height: 38px;
  border: none; border-bottom: 1px solid var(--cv-line); border-radius: 0;
  font: inherit; font-size: .86rem; color: var(--cv-ink); background: #fff;
  outline: none;
}
.cv-combo__search:focus { border-bottom-color: var(--cv-accent); }

.cv-combo__list {
  list-style: none; margin: 0; padding: 4px 0;
  max-height: 200px; overflow-y: auto;
}
.cv-combo__list li { padding: 9px 13px; font-size: .88rem; cursor: pointer; }
.cv-combo__item:hover      { background: #f0f6f5; }
.cv-combo__null            { color: var(--cv-muted); }
.cv-combo__null:hover      { background: #f0f6f5; }
.cv-combo__selected        { color: var(--cv-accent); font-weight: 700; }
.cv-combo__empty           { color: var(--cv-muted); font-style: italic; cursor: default; }

.cv-auto-code { display: flex; flex-direction: column; gap: 4px; }
.cv-auto-code span { font-size: .88rem; font-weight: 700; color: #344246; }
.cv-auto-code strong { font-size: .9rem; color: var(--cv-accent); letter-spacing: .03em; }
.cv-auto-code--hint strong, .cv-muted-label { font-weight: 400; color: var(--cv-muted); font-size: .82rem; }

@media (max-width: 1100px) {
  .cv-stats-grid    { grid-template-columns: repeat(2,minmax(0,1fr)); }
  .cv-records-grid  { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 860px) {
  .cv-split         { grid-template-columns: 1fr; }
  .cv-records-grid  { grid-template-columns: 1fr; }
  .cv-two-cols, .cv-three-cols { grid-template-columns: 1fr; }
}
@media (max-width: 580px) {
  .cv-stats-grid { grid-template-columns: 1fr 1fr; }
  .cv-btn-primary, .cv-btn-ghost { width: 100%; }
}
</style>
