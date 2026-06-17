'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Search, RefreshCw, ChevronLeft, ChevronRight, CheckCircle, XCircle,
  Clock, AlertCircle, Bell, TrendingUp, Zap, Eye, X, ExternalLink
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

function getToken() {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem('admin_token')
}

async function apiRecargas(path: string, options: RequestInit = {}) {
  const token = getToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  }
  const res = await fetch(`${API_URL}${path}`, { ...options, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Error desconocido' }))
    throw new Error(err.message || `Error ${res.status}`)
  }
  return res.json()
}

const ESTADO_COLORS: Record<string, string> = {
  pendiente: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  aprobado: 'bg-green-500/10 text-green-400 border border-green-500/20',
  rechazado: 'bg-red-500/10 text-red-400 border border-red-500/20',
}

function EstadoBadge({ estado }: { estado: string }) {
  const icon = estado === 'aprobado' ? <CheckCircle size={11} /> : estado === 'rechazado' ? <XCircle size={11} /> : <Clock size={11} />
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${ESTADO_COLORS[estado] || ''}`}>
      {icon} {estado}
    </span>
  )
}

function MatchIndicator({ ok }: { ok: boolean | null }) {
  if (ok === null) return <span className="text-muted-foreground text-xs">—</span>
  return ok
    ? <span className="text-green-400 text-sm">✓</span>
    : <span className="text-red-400 text-sm">✗</span>
}

// ─────────────────────────────────────────────────────────────
// Modal de detalle / acción
// ─────────────────────────────────────────────────────────────
function SolicitudModal({ solicitud, onClose, onActualizar }: {
  solicitud: any, onClose: () => void, onActualizar: () => void
}) {
  const [notas, setNotas] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAprobar = async () => {
    setLoading(true); setError('')
    try {
      await apiRecargas(`/recargas/admin/${solicitud.id}/aprobar`, {
        method: 'POST',
        body: JSON.stringify({ notas }),
      })
      onActualizar()
      onClose()
    } catch (e: any) {
      setError(e.message)
    } finally { setLoading(false) }
  }

  const handleRechazar = async () => {
    if (!notas.trim()) { setError('Debes escribir el motivo del rechazo.'); return }
    setLoading(true); setError('')
    try {
      await apiRecargas(`/recargas/admin/${solicitud.id}/rechazar`, {
        method: 'POST',
        body: JSON.stringify({ notas }),
      })
      onActualizar()
      onClose()
    } catch (e: any) {
      setError(e.message)
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-500 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="font-bold text-lg">Solicitud {solicitud.codigo_unico}</h2>
            <p className="text-sm text-muted-foreground">{solicitud.usuario?.nombre} {solicitud.usuario?.apellido1}</p>
          </div>
          <div className="flex items-center gap-3">
            <EstadoBadge estado={solicitud.estado} />
            <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Datos de la solicitud */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-muted/30 rounded-xl p-3">
              <p className="text-muted-foreground text-xs mb-1">Monto solicitado</p>
              <p className="font-bold text-xl text-green-400">Bs {parseFloat(solicitud.monto).toFixed(2)}</p>
            </div>
            <div className="bg-muted/30 rounded-xl p-3">
              <p className="text-muted-foreground text-xs mb-1">Código único</p>
              <p className="font-mono font-bold">{solicitud.codigo_unico}</p>
            </div>
            <div className="bg-muted/30 rounded-xl p-3">
              <p className="text-muted-foreground text-xs mb-1">Usuario</p>
              <p className="font-medium">{solicitud.usuario?.correo}</p>
            </div>
            <div className="bg-muted/30 rounded-xl p-3">
              <p className="text-muted-foreground text-xs mb-1">Nombre titular</p>
              <p className="font-medium">{solicitud.nombre_titular}</p>
            </div>
            <div className="bg-muted/30 rounded-xl p-3">
              <p className="text-muted-foreground text-xs mb-1">Fecha solicitud</p>
              <p className="text-xs">{new Date(solicitud.fecha_creacion).toLocaleString('es-PE')}</p>
            </div>
            <div className="bg-muted/30 rounded-xl p-3">
              <p className="text-muted-foreground text-xs mb-1">Procesado auto.</p>
              <p className="font-medium">{solicitud.procesado_auto ? <span className="text-green-400">Sí ✓</span> : 'No'}</p>
            </div>
          </div>

          {/* Datos del matching de Yape */}
          {solicitud.yape_nombre_pagador && (
            <div className="border border-violet-500/20 bg-violet-500/5 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Datos capturados de Yape</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Nombre pagador</p>
                  <p className="font-medium">{solicitud.yape_nombre_pagador || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Monto</p>
                  <p className="font-medium">Bs {solicitud.yape_monto || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Score nombre</p>
                  <p className={`font-bold ${solicitud.match_score >= 85 ? 'text-green-400' : 'text-red-400'}`}>
                    {solicitud.match_score ? `${solicitud.match_score}%` : '—'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Comprobante */}
          {solicitud.url_comprobante && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Comprobante subido por el usuario</p>
              <a href={solicitud.url_comprobante} target="_blank" rel="noopener noreferrer"
                className="block relative group">
                <img src={solicitud.url_comprobante} alt="Comprobante" className="w-full rounded-xl border border-border max-h-48 object-contain bg-black/20" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 rounded-xl transition-opacity">
                  <ExternalLink className="text-white w-6 h-6" />
                </div>
              </a>
            </div>
          )}

          {/* Notas y acciones (solo si está pendiente) */}
          {solicitud.estado === 'pendiente' && (
            <div className="space-y-3 pt-2 border-t border-border">
              <textarea
                value={notas}
                onChange={e => setNotas(e.target.value)}
                placeholder="Notas internas (opcional para aprobación, obligatorio para rechazo)..."
                rows={2}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-violet-500"
              />
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <div className="grid grid-cols-2 gap-3">
                <button onClick={handleRechazar} disabled={loading}
                  className="flex items-center justify-center gap-2 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl font-medium transition-colors disabled:opacity-50">
                  <XCircle size={16} /> Rechazar
                </button>
                <button onClick={handleAprobar} disabled={loading}
                  className="flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50">
                  <CheckCircle size={16} /> Aprobar
                </button>
              </div>
            </div>
          )}

          {/* Info si ya fue procesado */}
          {solicitud.estado !== 'pendiente' && solicitud.notas_admin && (
            <div className="bg-muted/30 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">Notas del administrador</p>
              <p className="text-sm">{solicitud.notas_admin}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// PÁGINA PRINCIPAL
// ─────────────────────────────────────────────────────────────
export default function RecargasAdminPage() {
  const [data, setData] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [notifs, setNotifs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterEstado, setFilterEstado] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [selectedSolicitud, setSelectedSolicitud] = useState<any>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [solicitudes, estadisticas, ultimasNotifs] = await Promise.all([
        apiRecargas(`/recargas/admin?page=${page}&limit=${limit}&estado=${filterEstado}&busqueda=${busqueda}`),
        apiRecargas('/recargas/admin/estadisticas'),
        apiRecargas('/recargas/admin/notificaciones?limit=5'),
      ])
      setData(solicitudes)
      setStats(estadisticas)
      setNotifs(ultimasNotifs)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [page, limit, filterEstado, busqueda])

  useEffect(() => { fetchAll() }, [fetchAll])

  const solicitudes = data?.data || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Recargas</h1>
          <p className="text-muted-foreground mt-1">Monitoreo y aprobación de recargas vía Yape QR</p>
        </div>
        <button onClick={fetchAll} disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 bg-background border border-border hover:bg-muted text-foreground rounded-lg font-medium transition-colors text-sm disabled:opacity-50"
          title="Actualizar">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={16} className="text-yellow-400" />
              <span className="text-xs text-muted-foreground font-medium">Pendientes</span>
            </div>
            <p className="text-2xl font-bold text-yellow-400">{stats.pendientes}</p>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-green-400" />
              <span className="text-xs text-muted-foreground font-medium">Monto aprobado hoy</span>
            </div>
            <p className="text-2xl font-bold text-green-400">Bs {stats.montoAprobadoHoy?.toFixed(2) || '0.00'}</p>
          </div>
          <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={16} className="text-violet-400" />
              <span className="text-xs text-muted-foreground font-medium">Aprobadas hoy</span>
            </div>
            <p className="text-2xl font-bold text-violet-400">{stats.aprobadas}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bell size={16} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">Última notif. Yape</span>
            </div>
            <p className="text-xs font-medium truncate">
              {stats.ultimaNotificacionYape
                ? new Date(stats.ultimaNotificacionYape.fecha_recibida).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
                : 'Sin datos'}
            </p>
          </div>
        </div>
      )}

      {/* Últimas notificaciones de Yape */}
      {notifs.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Bell size={14} className="text-violet-400" />
            Últimas notificaciones capturadas de Yape
          </h3>
          <div className="space-y-2">
            {notifs.map((n: any) => (
              <div key={n.id} className="flex items-center justify-between text-xs bg-muted/30 rounded-lg px-3 py-2">
                <span className="text-muted-foreground truncate max-w-xs">{n.texto_raw}</span>
                <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                  {n.monto && <span className="text-green-400 font-semibold">Bs {n.monto}</span>}
                  <span className={n.procesada ? 'text-green-400' : 'text-yellow-400'}>{n.procesada ? '✓ Procesada' : '⏳ Pendiente'}</span>
                  <span className="text-muted-foreground">{new Date(n.fecha_recibida).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={busqueda}
              onChange={e => { setBusqueda(e.target.value); setPage(1) }}
              placeholder="Buscar por código o nombre titular..."
              className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-violet-500"
            />
          </div>
          <select value={filterEstado} onChange={e => { setFilterEstado(e.target.value); setPage(1) }}
            className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-violet-500">
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="aprobado">Aprobados</option>
            <option value="rechazado">Rechazados</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                {['Código', 'Usuario', 'Monto', 'Titular', 'Match Yape', 'Auto.', 'Comprobante', 'Estado', 'Fecha', 'Acción'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 10 }).map((_, j) => (
                      <td key={j} className="px-4 py-4"><div className="h-4 bg-muted rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : solicitudes.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center">
                    <AlertCircle size={36} className="mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground text-sm">No hay solicitudes con este filtro</p>
                  </td>
                </tr>
              ) : (
                solicitudes.map((s: any) => (
                  <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-bold text-violet-400">{s.codigo_unico}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium">{s.usuario?.nombre} {s.usuario?.apellido1}</p>
                      <p className="text-xs text-muted-foreground">{s.usuario?.correo}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-green-400">Bs {parseFloat(s.monto).toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">{s.nombre_titular}</td>
                    <td className="px-4 py-3 text-center">
                      {s.match_score != null
                        ? <span className={`text-xs font-bold ${s.match_score >= 85 ? 'text-green-400' : 'text-red-400'}`}>{s.match_score}%</span>
                        : <span className="text-muted-foreground text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {s.procesado_auto ? <span className="text-green-400 text-sm">✓</span> : <span className="text-muted-foreground text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {s.url_comprobante
                        ? <a href={s.url_comprobante} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300 transition-colors"><ExternalLink size={14} /></a>
                        : <span className="text-muted-foreground text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3"><EstadoBadge estado={s.estado} /></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(s.fecha_creacion).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSelectedSolicitud(s)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-medium transition-colors">
                        <Eye size={13} />
                        {s.estado === 'pendiente' ? 'Gestionar' : 'Detalle'}
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

      {/* Modal */}
      {selectedSolicitud && (
        <SolicitudModal
          solicitud={selectedSolicitud}
          onClose={() => setSelectedSolicitud(null)}
          onActualizar={fetchAll}
        />
      )}
    </div>
  )
}
