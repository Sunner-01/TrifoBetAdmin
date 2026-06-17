'use client'

import { useState, useEffect, useCallback } from 'react'
import { Check, Loader2, Image as ImageIcon, UploadCloud, RefreshCw, X, ChevronLeft, ChevronRight } from 'lucide-react'

interface TransaccionRetiro {
  id: number
  monto: number
  fecha_creacion: string
  usuario: {
    nombre: string
    apellido1: string
    correo: string
  }
  cuenta_retiro: {
    billetera: string
    numero_cuenta: string
    nombre_titular: string
    qr_url: string | null
  }
}

export function SolicitudesRetiro() {
  const [retiros, setRetiros] = useState<TransaccionRetiro[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<number | null>(null)

  // Modal state
  const [activeRetiro, setActiveRetiro] = useState<TransaccionRetiro | null>(null)
  const [rejectingRetiro, setRejectingRetiro] = useState<number | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null)

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [totalRecords, setTotalRecords] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchRetiros = useCallback(async () => {
    setLoading(true)
    try {
      const token = sessionStorage.getItem('admin_token')
      const offset = (page - 1) * limit
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/retiros/admin/solicitudes?limit=${limit}&offset=${offset}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setRetiros(data.data || [])
        setTotalRecords(data.total || 0)
      }
    } catch (error) {
      console.error('Error', error)
    } finally {
      setLoading(false)
    }
  }, [page, limit])

  useEffect(() => {
    fetchRetiros()
  }, [fetchRetiros])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchRetiros()
    setIsRefreshing(false)
  }

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeRetiro || !file) return

    setSubmitting(true)
    const formData = new FormData()
    formData.append('comprobante', file)

    try {
      const token = sessionStorage.getItem('admin_token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/retiros/admin/procesar/${activeRetiro.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })

      if (res.ok) {
        setRetiros(retiros.filter(r => r.id !== activeRetiro.id))
        setNotification({ message: 'Retiro completado exitosamente', type: 'success' })
        closeModal()
      } else {
        const error = await res.json()
        setNotification({ message: `Error: ${error.message}`, type: 'error' })
      }
    } catch (error) {
      setNotification({ message: 'Error de conexión', type: 'error' })
    } finally {
      setSubmitting(false)
      setTimeout(() => setNotification(null), 3000)
    }
  }

  const handleReject = (id: number) => {
    setRejectingRetiro(id)
  }

  const confirmReject = async () => {
    if (!rejectingRetiro) return
    setSubmitting(true)
    try {
      const token = sessionStorage.getItem('admin_token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/retiros/admin/rechazar/${rejectingRetiro}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.ok) {
        setRetiros(retiros.filter(r => r.id !== rejectingRetiro))
        setNotification({ message: 'Retiro rechazado. El saldo ha sido devuelto al usuario.', type: 'success' })
        setRejectingRetiro(null)
      } else {
        const error = await res.json()
        setNotification({ message: `Error: ${error.message}`, type: 'error' })
      }
    } catch (error) {
      setNotification({ message: 'Error de conexión', type: 'error' })
    } finally {
      setSubmitting(false)
      setTimeout(() => setNotification(null), 3000)
    }
  }

  const closeModal = () => {
    setActiveRetiro(null)
    setFile(null)
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-foreground">Solicitudes de Retiro Pendientes</h2>
          <p className="text-sm text-muted-foreground">Realiza el pago a la cuenta indicada y sube el comprobante para finalizar.</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing || loading}
          className="flex items-center gap-2 px-3 py-1.5 bg-background border border-border hover:bg-muted text-foreground rounded-lg font-medium transition-colors text-sm disabled:opacity-50"
          title="Actualizar solicitudes"
        >
          <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
          Actualizar
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-sm font-semibold text-foreground">Fecha</th>
              <th className="px-4 py-3 text-sm font-semibold text-foreground">Usuario</th>
              <th className="px-4 py-3 text-sm font-semibold text-foreground">Monto a Pagar</th>
              <th className="px-4 py-3 text-sm font-semibold text-foreground">Destino</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Cargando solicitudes...</p>
                </td>
              </tr>
            ) : retiros.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  No hay solicitudes de retiro pendientes.
                </td>
              </tr>
            ) : (
              retiros.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                    {new Date(r.fecha_creacion).toLocaleString('es-BO')}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-foreground">{r.usuario?.nombre || 'Usuario'} {r.usuario?.apellido1 || ''}</p>
                    <p className="text-xs text-muted-foreground">{r.usuario?.correo || 'Sin correo'}</p>
                  </td>
                  <td className="px-4 py-3 text-foreground font-bold text-lg text-primary">
                    Bs {r.monto.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    {r.cuenta_retiro ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-blue-400 uppercase">
                          {r.cuenta_retiro.billetera}
                        </span>
                        <span className="text-sm font-mono">{r.cuenta_retiro.numero_cuenta}</span>
                        <span className="text-xs text-muted-foreground">Titular: {r.cuenta_retiro.nombre_titular}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-destructive">Cuenta no encontrada</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => setActiveRetiro(r)}
                        disabled={!r.cuenta_retiro}
                        className="px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50"
                      >
                        Procesar
                      </button>
                      <button
                        onClick={() => handleReject(r.id)}
                        className="px-3 py-1.5 bg-destructive/10 text-destructive hover:bg-destructive/20 text-sm font-medium rounded-lg shadow-sm transition-colors"
                        title="Rechazar y devolver dinero"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-muted/30 border-t border-border p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Mostrar</span>
          <select
            value={limit}
            onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
            className="border border-border bg-background rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-sm text-muted-foreground">registros por página</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Mostrando {Math.min((page - 1) * limit + 1, totalRecords)} a {Math.min(page * limit, totalRecords)} de {totalRecords} registros
          </span>
          <div className="flex gap-1">
            <button
              disabled={page === 1 || loading}
              onClick={() => setPage(p => p - 1)}
              className="p-1 border border-border rounded-md hover:bg-muted disabled:opacity-50 text-foreground transition-colors"
              title="Página Anterior"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              disabled={page >= Math.ceil(totalRecords / limit) || loading}
              onClick={() => setPage(p => p + 1)}
              className="p-1 border border-border rounded-md hover:bg-muted disabled:opacity-50 text-foreground transition-colors"
              title="Página Siguiente"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Procesamiento */}
      {activeRetiro && activeRetiro.cuenta_retiro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-card rounded-xl p-6 max-w-lg w-full shadow-2xl border border-border">
            <h3 className="text-xl font-bold mb-4">Procesar Retiro</h3>

            <div className="bg-muted/30 p-4 rounded-lg mb-6 border border-border">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Monto a Transferir:</p>
                  <p className="text-2xl font-bold text-primary">Bs {activeRetiro.monto.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground">Billetera Destino:</p>
                  <p className="font-semibold uppercase text-blue-400">{activeRetiro.cuenta_retiro.billetera}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Número de Cuenta:</p>
                  <p className="font-mono font-medium text-lg">{activeRetiro.cuenta_retiro.numero_cuenta}</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground">Titular:</p>
                  <p className="font-medium">{activeRetiro.cuenta_retiro?.nombre_titular || 'Desconocido'}</p>
                </div>
              </div>

              {activeRetiro.cuenta_retiro.qr_url && (
                <div className="mt-4 pt-4 border-t border-border flex flex-col items-center">
                  <p className="text-sm text-muted-foreground mb-2">Código QR del Cliente:</p>
                  <div className="bg-white p-2 rounded-lg inline-block">
                    <img src={activeRetiro.cuenta_retiro.qr_url} alt="QR" className="w-32 h-32 object-contain" />
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleProcess}>
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-foreground">
                  Subir Comprobante de Pago (Obligatorio)
                </label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    required
                  />
                  {file ? (
                    <div className="flex flex-col items-center text-primary">
                      <Check size={24} className="mb-2" />
                      <span className="font-medium">{file.name}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-muted-foreground">
                      <UploadCloud size={32} className="mb-2" />
                      <span>Haz clic o arrastra la captura del comprobante aquí</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!file || submitting}
                  className="px-6 py-2 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Confirmar y Completar Retiro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingRetiro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border w-full max-w-sm rounded-xl shadow-lg overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-border bg-muted/20">
              <h3 className="font-semibold text-foreground">Confirmar Rechazo</h3>
              <button
                onClick={() => setRejectingRetiro(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                disabled={submitting}
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <X className="text-destructive w-6 h-6" />
              </div>
              <p className="text-foreground text-sm">
                ¿Estás seguro de que deseas rechazar este retiro?
              </p>
              <p className="text-muted-foreground text-xs mt-2">
                El saldo retenido será devuelto automáticamente al usuario.
              </p>
            </div>
            <div className="p-4 bg-muted/20 border-t border-border flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingRetiro(null)}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmReject}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-destructive-foreground bg-destructive rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                Sí, Rechazar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {notification && (
        <div className={`fixed bottom-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium flex items-center gap-2 transition-all ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}>
          {notification.type === 'success' ? <Check size={18} /> : <X size={18} />}
          {notification.message}
        </div>
      )}
    </div>
  )
}
