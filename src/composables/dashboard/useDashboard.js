import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import axios from 'axios'
import apiUrl from '../../../config.js'

const headers = { Accept: 'application/json' }

/**
 * Query de métricas del dashboard.
 * Se re-ejecuta automáticamente cuando cambian from o to.
 *
 * @param {Ref<string>} from  - Fecha inicio (YYYY-MM-DD) o ''
 * @param {Ref<string>} to    - Fecha fin   (YYYY-MM-DD) o ''
 */
export function useMetricasDashboard(from, to) {
  const queryKey = computed(() => ['metricas-dashboard', from.value, to.value])

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey,
    queryFn: () =>
      axios
        .post(
          `${apiUrl}/dashboard/obtener_metricas_dashboard`,
          {
            fecha_inicio: from.value || null,
            fecha_fin: to.value || null,
          },
          { headers },
        )
        .then((r) => r.data.data),
  })

  const metricas = computed(() => data.value ?? {
    totals: { total: 0, gestion: 0, estrategicos: 0, prioridad_alta: 0 },
    estados: { abiertos: 0, en_proceso: 0, completados: 0 },
    tipos_soporte: [],
    macroprocesos: [],
    prioridades: [],
    asignados: [],
  })

  return { metricas, isLoading, isError, isFetching }
}
