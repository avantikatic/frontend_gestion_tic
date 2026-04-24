import { computed } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import axios from 'axios'
import apiUrl from '../../../config.js'

const headers = { Accept: 'application/json' }

/**
 * Query y mutación para la sección de resultados (bitácora) de un registro GSC.
 * @param {Ref<number|null>} idRegistro - ID del registro activo en el modal
 */
export function useGscResultados(idRegistro) {
  const queryClient = useQueryClient()

  const queryKey = computed(() => ['resultados-gsc', idRegistro.value])

  const { data: resultados, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () =>
      axios
        .post(
          `${apiUrl}/gestion-continuidad/listar_resultados_gsc`,
          { id_registro: idRegistro.value },
          { headers },
        )
        .then((r) => r.data.data ?? []),
    enabled: computed(() => !!idRegistro.value),
  })

  const agregarResultadoMutation = useMutation({
    mutationFn: ({ id_registro, texto }) =>
      axios.post(
        `${apiUrl}/gestion-continuidad/crear_resultado_gsc`,
        { id_registro, texto },
        { headers },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey.value })
    },
  })

  return {
    resultados: computed(() => resultados.value ?? []),
    isLoading,
    isError,
    agregarResultadoMutation,
  }
}
