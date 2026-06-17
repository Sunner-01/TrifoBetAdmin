'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Search, RefreshCw, ChevronLeft, ChevronRight, Eye, AlertCircle
} from 'lucide-react'
import { getVerificaciones, VerificacionAdmin, VerificacionesResponse } from '@/lib/api'
import VerificationModal from '@/components/dashboard/modals/VerificationModal'

const ESTADO_COLORS: Record<string, string> = {
  pendiente: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20',
  aprobado: 'bg-green-500/10 text-green-500 border border-green-500/20',
  rechazado: 'bg-red-500/10 text-red-500 border border-red-500/20',
}

export default function VerificacionesPage() {
  const [data, setData] = useState<VerificacionesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterEstado, setFilterEstado] = useState<string>('pendiente')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [selectedVerification, setSelectedVerification] = useState<VerificacionAdmin | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchVerificaciones = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getVerificaciones({
        page,
        limit,
        estado: filterEstado || undefined,
      })
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar verificaciones')
    } finally {
      setLoading(false)
    }
  }, [page, limit, filterEstado])

  useEffect(() => {
    fetchVerificaciones()
  }, [fetchVerificaciones])

  const handleReview = (verificacion: VerificacionAdmin) => {
    setSelectedVerification(verificacion)
    setIsModalOpen(true)
  }

  const handleSaved = async () => {
    setIsModalOpen(false)
    setSelectedVerification(null)
    await fetchVerificaciones()
  }

  const verificaciones = data?.data || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Verificaciones KYC</h1>
          <p className="text-muted-foreground mt-1">
            Revisa y aprueba documentos de identidad de los usuarios
          </p>
        </div>
        <button
          onClick={fetchVerificaciones}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 bg-background border border-border hover:bg-muted text-foreground rounded-lg font-medium transition-colors text-sm disabled:opacity-50"
          title="Actualizar"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={filterEstado}
            onChange={(e) => {
              setFilterEstado(e.target.value)
              setPage(1)
            }}
            className="px-4 py-2 border border-border bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          >
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="aprobado">Aprobados</option>
            <option value="rechazado">Rechazados</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Usuario</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Documento (CI)</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado Actual</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : verificaciones.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <AlertCircle size={40} className="mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground text-sm">No hay verificaciones con este filtro</p>
                  </td>
                </tr>
              ) : (
                verificaciones.map((v) => (
                  <tr key={v.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {new Date(v.fecha_subida).toLocaleString('es-BO')}
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-foreground">
                        {v.usuario?.nombre} {v.usuario?.apellido1}
                      </p>
                      <p className="text-xs text-muted-foreground">{v.usuario?.correo}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-foreground">
                      {v.usuario?.ci || 'No registrado'}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${ESTADO_COLORS[v.estado]}`}>
                        {v.estado}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => handleReview(v)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium transition-colors"
                      >
                        <Eye size={16} />
                        {v.estado === 'pendiente' ? 'Revisar' : 'Ver detalle'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data && (
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
                Mostrando {Math.min((page - 1) * limit + 1, data.total)} a {Math.min(page * limit, data.total)} de {data.total} registros
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
                  disabled={page >= data.totalPages || loading}
                  onClick={() => setPage(p => p + 1)}
                  className="p-1 border border-border rounded-md hover:bg-muted disabled:opacity-50 text-foreground transition-colors"
                  title="Página Siguiente"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <VerificationModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedVerification(null) }}
        onSaved={handleSaved}
        verificacion={selectedVerification}
      />
    </div>
  )
}
