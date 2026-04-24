import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed } from 'vue'
import axios from 'axios'
import apiUrl from '../../../config.js'

const HEADERS = { Accept: 'application/json' }

// ─────────────────────────────────────────────
// Inbox M365 – obtener_correos
// ─────────────────────────────────────────────
export function useCorreos() {
  const queryClient = useQueryClient()

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['tickets-correos'],
    queryFn: () =>
      axios
        .post(`${apiUrl}/obtener_correos`, {}, { headers: HEADERS })
        .then(r => r.data.data),
    staleTime: 0,
  })

  const correos = computed(() => data.value?.emails ?? [])
  const token   = computed(() => data.value?.token  ?? '')

  function syncCorreos() {
    queryClient.invalidateQueries({ queryKey: ['tickets-correos'] })
  }

  return { correos, token, isLoading, isFetching, syncCorreos }
}

// ─────────────────────────────────────────────
// Lista principal – filtrar_tickets
// ─────────────────────────────────────────────
export function useTicketsFiltrados(params) {
  // params: { vista, q, fEstado, fAsignado, fTipoSoporte, fMacro, fTipoTicket }

  const { data, isLoading, isFetching } = useQuery({
    queryKey: computed(() => [
      'tickets-filtrados',
      params.vista.value,
      params.q.value,
      params.fEstado.value,
      params.fAsignado.value,
      params.fTipoSoporte.value,
      params.fMacro.value,
      params.fTipoTicket.value,
    ]),
    queryFn: () => {
      const body = {
        vista:       params.vista.value,
        limite:      100,
        offset:      0,
      }
      if (params.q.value?.trim())          body.q            = params.q.value.trim()
      if (params.fEstado.value)            body.fEstado      = params.fEstado.value
      if (params.fAsignado.value)          body.fAsignado    = params.fAsignado.value
      if (params.fTipoSoporte.value)       body.fTipoSoporte = params.fTipoSoporte.value
      if (params.fMacro.value)             body.fMacro       = params.fMacro.value
      if (params.fTipoTicket.value)        body.fTipoTicket  = params.fTipoTicket.value
      return axios
        .post(`${apiUrl}/filtrar_tickets`, body, { headers: HEADERS })
        .then(r => r.data.data.tickets ?? [])
    },
    enabled: computed(() => params.vista.value !== 'inbox'),
    staleTime: 0,
    placeholderData: prev => prev,
  })

  const ticketsCorreos = computed(() => data.value ?? [])

  return { ticketsCorreos, isLoading, isFetching }
}

// ─────────────────────────────────────────────
// Mutation – descartar_correo
// ─────────────────────────────────────────────
export function useDescartarCorreo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (m) =>
      axios.post(
        `${apiUrl}/descartar_correo`,
        { messageId: m.id || m.messageId, id: m.id || m.messageId },
        { headers: HEADERS },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets-correos'] })
    },
  })
}

// ─────────────────────────────────────────────
// Mutation – actualizar_ticket
// ─────────────────────────────────────────────
export function useActualizarCampo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ ticket_id, message_id, campo, valor }) =>
      axios.post(
        `${apiUrl}/actualizar_ticket`,
        { ticket_id, message_id, campo, valor },
        { headers: HEADERS },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets-filtrados'] })
    },
  })
}

// ─────────────────────────────────────────────
// Mutation – responder_correo
// ─────────────────────────────────────────────
export function useEnviarRespuesta() {
  return useMutation({
    mutationFn: ({ message_id, respuesta, ticket_id }) =>
      axios.post(
        `${apiUrl}/responder_correo`,
        { message_id, respuesta, ticket_id },
        { headers: HEADERS },
      ),
  })
}

// ─────────────────────────────────────────────
// Mutation – convertir_correo_ticket
// ─────────────────────────────────────────────
export function useConvertirCorreo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (m) =>
      axios.post(
        `${apiUrl}/convertir_correo_ticket`,
        { messageId: m.id || m.messageId, id: m.id || m.messageId },
        { headers: HEADERS },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets-correos'] })
      queryClient.invalidateQueries({ queryKey: ['tickets-filtrados'] })
    },
  })
}
