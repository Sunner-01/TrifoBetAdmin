'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Search, UserPlus, ShieldAlert, CheckCircle, XCircle, RefreshCw, KeyRound, Eye, ChevronLeft, ChevronRight, BarChart3, Edit2
} from 'lucide-react'
import {
  getPersonal, createPersonal, toggleHabilitarPersonal, resetPasswordPersonal, getPersonalStats
} from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import PersonalModal from './PersonalModal'
import PersonalStatsModal from './PersonalStatsModal'
import PersonalViewModal from './PersonalViewModal'

const ROL_LABELS: Record<number, string> = {
  1: 'Administrador',
  3: 'Soporte',
  5: 'Verificador',
  6: 'Cajero / Finanzas',
}

const ROL_COLORS: Record<number, string> = {
  1: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  3: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  5: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  6: 'bg-green-500/10 text-green-400 border border-green-500/20',
}

export default function PersonalPage() {
  const { user } = useAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState<any>(null)
  const [selectedStatsId, setSelectedStatsId] = useState<number | null>(null)
  const [selectedViewWorker, setSelectedViewWorker] = useState<any>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  const fetchPersonal = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getPersonal({ page, limit, search: searchTerm || undefined })
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar personal')
    } finally {
      setLoading(false)
    }
  }, [page, limit, searchTerm])

  useEffect(() => {
    fetchPersonal()
  }, [fetchPersonal])

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  const handleToggleEstado = async (id: number) => {
    if (!window.confirm('¿Seguro que deseas cambiar el estado de acceso de este trabajador?')) return
    setActionLoading(id)
    try {
      await toggleHabilitarPersonal(id)
      await fetchPersonal()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleResetPassword = async (id: number) => {
    if (!window.confirm('¿Restablecer la contraseña a la por defecto (Pass123.)?')) return
    setActionLoading(id)
    try {
      const res = await resetPasswordPersonal(id)
      alert(res.message)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  if (user?.rol_id !== 1) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <ShieldAlert size={64} className="text-red-500/50" />
        <h2 className="text-2xl font-bold">Acceso Denegado</h2>
        <p className="text-muted-foreground">No tienes permisos para ver o gestionar al personal administrativo.</p>
      </div>
    )
  }

  const personal = data?.data || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestión de Personal</h1>
          <p className="text-muted-foreground mt-1">Administra accesos, contraseñas y roles del equipo.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchPersonal}
            className="flex items-center gap-2 px-4 py-2 bg-card border border-border hover:bg-muted rounded-xl transition-colors text-sm font-medium"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white rounded-xl transition-all duration-300 text-sm font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] hover:-translate-y-0.5"
          >
            <UserPlus size={18} />
            Nuevo Trabajador
          </button>
        </div>
      </div>

      <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl p-5 flex flex-col sm:flex-row gap-4 items-center shadow-lg">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-emerald-500" size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre, correo o usuario..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-background/50 border border-border/50 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-inner"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto bg-background/50 border border-border/50 rounded-xl px-4 py-2 shadow-inner">
          <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Mostrar:</span>
          <select
            value={limit}
            onChange={(e) => { setLimit(Number(e.target.value)); setPage(1) }}
            className="bg-transparent text-sm focus:outline-none font-bold text-foreground cursor-pointer"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Trabajador</th>
                <th className="px-6 py-4 font-medium">Rol</th>
                <th className="px-6 py-4 font-medium">Estado</th>
                <th className="px-6 py-4 font-medium text-center">Transacciones (Total)</th>
                <th className="px-6 py-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && !personal.length ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    Cargando personal...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-red-400">
                    {error}
                  </td>
                </tr>
              ) : personal.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No se encontraron trabajadores
                  </td>
                </tr>
              ) : (
                personal.map((p: any) => (
                  <tr key={p.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{p.nombre}</span>
                        <span className="text-xs text-muted-foreground">{p.correo}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${ROL_COLORS[p.rol_id] || 'bg-gray-500/10 text-gray-400'}`}>
                        {ROL_LABELS[p.rol_id] || p.rol?.nombre || 'Desconocido'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        p.habilitado 
                          ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {p.habilitado ? <CheckCircle size={12}/> : <XCircle size={12}/>}
                        {p.habilitado ? 'Activo' : 'Suspendido'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-mono font-medium">
                      {p.transacciones_procesadas || 0}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedViewWorker(p)}
                          className="p-2 hover:bg-emerald-500/10 hover:text-emerald-400 text-muted-foreground rounded-xl transition-all duration-300 hover:scale-110"
                          title="Ver Perfil Detallado"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedWorker(p)
                            setIsCreateModalOpen(true)
                          }}
                          className="p-2 hover:bg-blue-500/10 hover:text-blue-400 text-muted-foreground rounded-xl transition-all duration-300 hover:scale-110"
                          title="Editar Perfil"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => setSelectedStatsId(p.id)}
                          className="p-2 hover:bg-emerald-500/10 hover:text-emerald-400 text-muted-foreground rounded-xl transition-all duration-300 hover:scale-110"
                          title="Ver Rendimiento Detallado"
                        >
                          <BarChart3 size={18} />
                        </button>
                        <button
                          onClick={() => handleResetPassword(p.id)}
                          disabled={actionLoading === p.id || p.id === user?.id}
                          className="p-2 hover:bg-yellow-500/10 hover:text-yellow-400 text-muted-foreground rounded-xl transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:hover:scale-100"
                          title="Restablecer Contraseña"
                        >
                          <KeyRound size={18} />
                        </button>
                        <button
                          onClick={() => handleToggleEstado(p.id)}
                          disabled={actionLoading === p.id || p.id === user?.id}
                          className="p-2 hover:bg-red-500/10 hover:text-red-400 text-muted-foreground rounded-xl transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:hover:scale-100"
                          title={p.habilitado ? 'Suspender Acceso' : 'Habilitar Acceso'}
                        >
                          {p.habilitado ? <XCircle size={18} /> : <CheckCircle size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
            <span className="text-sm text-muted-foreground">
              Mostrando {personal.length} de {data.total}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="flex items-center px-4 text-sm font-medium border border-border rounded-lg bg-background">
                {page} / {data.totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {isCreateModalOpen && (
        <PersonalModal
          initialData={selectedWorker}
          onClose={() => {
            setIsCreateModalOpen(false)
            setSelectedWorker(null)
          }}
          onSuccess={() => {
            setIsCreateModalOpen(false)
            setSelectedWorker(null)
            fetchPersonal()
          }}
        />
      )}

      {selectedStatsId && (
        <PersonalStatsModal
          userId={selectedStatsId}
          onClose={() => setSelectedStatsId(null)}
        />
      )}

      {selectedViewWorker && (
        <PersonalViewModal
          worker={selectedViewWorker}
          onClose={() => setSelectedViewWorker(null)}
        />
      )}
    </div>
  )
}
