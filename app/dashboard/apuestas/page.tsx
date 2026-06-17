'use client'

import React from 'react'
import { useState, useEffect } from 'react'
import { Search, RefreshCw, TrendingUp, DollarSign, Clock, ChevronDown, ChevronRight, ChevronLeft, X } from 'lucide-react'
import { getTodasApuestas, getEstadisticasApuestas } from '@/lib/api'

const fmtBetId = (id: number | string) => `TRF-${String(id).padStart(8, '0')}`

const statusConfig: Record<string, { label: string; className: string }> = {
  pendiente: { label: 'Pendiente', className: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30' },
  ganada: { label: 'Ganada', className: 'bg-green-500/10  text-green-400  border border-green-500/30' },
  perdida: { label: 'Perdida', className: 'bg-red-500/10    text-red-400    border border-red-500/30' },
  cashout: { label: 'Cashout', className: 'bg-blue-500/10   text-blue-400   border border-blue-500/30' },
  cancelada: { label: 'Cancelada', className: 'bg-muted/30      text-muted-foreground border border-border' },
}

const tipoConfig: Record<string, string> = {
  simple: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30',
  combinada: 'bg-purple-500/10 text-purple-400 border border-purple-500/30',
  sistema: 'bg-cyan-500/10   text-cyan-400   border border-cyan-500/30',
}

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
      <div className="p-3 rounded-xl bg-primary/10 shrink-0">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function BetDetailPanel({ bet, onClose }: { bet: any; onClose: () => void }) {
  const st = statusConfig[bet.estado] || statusConfig.cancelada
  const tt = tipoConfig[bet.tipo] || tipoConfig.simple
  const items: any[] = bet.items || []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <span className="font-mono text-lg font-bold text-foreground">{fmtBetId(bet.id)}</span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${tt}`}>{bet.tipo?.toUpperCase()}</span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${st.className}`}>{st.label}</span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        {/* Meta info */}
        <div className="px-6 py-4 border-b border-border grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Usuario</p>
            <p className="font-semibold text-foreground">@{bet.usuario?.nombre_usuario || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Fecha y hora</p>
            <p className="font-semibold text-foreground">
              {new Date(bet.fecha_creacion || bet.created_at).toLocaleString('es-BO', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Monto apostado</p>
            <p className="font-bold text-foreground text-base">Bs {Number(bet.monto).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Cuota total</p>
            <p className="font-bold text-foreground text-base">{Number(bet.cuota_total || 0).toFixed(2)}x</p>
          </div>
          {bet.estado === 'cashout' ? (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Monto cashout</p>
              <p className="font-bold text-blue-400 text-base">Bs {Number(bet.monto_cashout).toFixed(2)}</p>
            </div>
          ) : (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Ganancia potencial</p>
              <p className={`font-bold text-base ${bet.estado === 'ganada' ? 'text-green-400' : 'text-foreground'}`}>
                Bs {Number(bet.ganancia_potencial).toFixed(2)}
              </p>
            </div>
          )}
          {bet.estado === 'ganada' && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Ganancia neta casino</p>
              <p className="font-bold text-red-400 text-base">-Bs {Number(bet.ganancia_potencial).toFixed(2)}</p>
            </div>
          )}
        </div>

        {/* Selecciones */}
        <div className="px-6 py-4 max-h-72 overflow-y-auto">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-3">
            Selecciones ({items.length})
          </p>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Sin selecciones registradas</p>
          ) : (
            <div className="space-y-3">
              {items.map((item: any, i: number) => (
                <div key={item.id || i} className="border border-border rounded-xl p-3 bg-muted/20">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-semibold text-sm text-foreground leading-tight">{item.evento_nombre || `Evento #${item.evento_deportivo_id}`}</p>
                    <span className="shrink-0 text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {Number(item.cuota).toFixed(2)}x
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mt-1.5">
                    <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">{item.mercado || '—'}</span>
                    <span className="text-xs font-medium text-foreground">{item.seleccion_display || item.seleccion}</span>
                    {item.resultado_bool === true && <span className="text-xs text-green-400 font-bold">✓ Correcto</span>}
                    {item.resultado_bool === false && <span className="text-xs text-red-400 font-bold">✗ Incorrecto</span>}
                    {item.resultado_bool === null && <span className="text-xs text-yellow-400">⏳ Pendiente</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-border flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-muted hover:bg-muted/70 rounded-lg text-sm font-medium transition-colors">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ApuestasPage() {
  const [bets, setBets] = useState<any[]>([])
  const [stats, setStats] = useState({ eventosActivos: 0, totalVolumen: 0, totalIngresos: 0 })
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'todos' | 'pendiente' | 'ganada' | 'perdida' | 'cashout'>('todos')
  const [selectedBet, setSelectedBet] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedRow, setExpandedRow] = useState<number | null>(null)

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [totalRecords, setTotalRecords] = useState(0)

  useEffect(() => {
    fetchBets()
  }, [page, limit, filterStatus])

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchBets = async () => {
    setLoading(true)
    try {
      const data = await getTodasApuestas({
        page,
        limit,
        search: searchTerm || undefined,
        estado: filterStatus === 'todos' ? undefined : filterStatus
      })
      setBets(data.data || [])
      setTotalRecords(data.total || 0)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const data = await getEstadisticasApuestas()
      setStats(data)
    } catch (e) {
      console.error(e)
    }
  }

  const filteredBets = bets.filter((bet) => {
    if (!searchTerm) return true
    return (
      bet.usuario?.nombre_usuario?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(bet.id).includes(searchTerm) ||
      fmtBetId(bet.id).toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const pendingCount = bets.filter(b => b.estado === 'pendiente').length
  const wonCount = bets.filter(b => b.estado === 'ganada').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Apuestas Deportivas</h1>
          <p className="text-muted-foreground mt-1">Monitoreo en tiempo real de todas las apuestas</p>
        </div>
        <button
          onClick={() => { fetchBets(); fetchStats() }}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 bg-background border border-border hover:bg-muted text-foreground rounded-lg font-medium transition-colors text-sm disabled:opacity-50"
          title="Actualizar"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Clock} label="Apuestas Pendientes" value={String(pendingCount)} sub="En espera de resultado" />
        <StatCard icon={TrendingUp} label="Volumen Total" value={`Bs ${stats.totalVolumen.toFixed(2)}`} sub="Monto total apostado" />
        <StatCard icon={DollarSign} label="Ingresos del Casino" value={`Bs ${stats.totalIngresos.toFixed(2)}`} sub="Apostado − Pagado" />
        <StatCard icon={Search} label="Apuestas Ganadas (usr)" value={String(wonCount)} sub="Por el usuario" />
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            type="text"
            placeholder="Buscar por usuario o ID de apuesta..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 border border-border bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value as any); setPage(1); }}
          className="px-4 py-2 border border-border bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm min-w-48"
        >
          <option value="todos">Todos los estados</option>
          <option value="pendiente">Pendientes</option>
          <option value="ganada">Ganadas</option>
          <option value="perdida">Perdidas</option>
          <option value="cashout">Cashout</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="w-8 px-4 py-3" />
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fecha y Hora</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Usuario</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Evento(s)</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cuota</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Monto</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Potencial</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 11 }).map((_, j) => (
                      <td key={j} className="px-4 py-4"><div className="h-4 bg-muted rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filteredBets.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-16 text-center">
                    <TrendingUp size={40} className="mx-auto text-muted-foreground mb-3 opacity-40" />
                    <p className="text-muted-foreground text-sm">No se encontraron apuestas</p>
                  </td>
                </tr>
              ) : filteredBets.map((bet) => {
                const st = statusConfig[bet.estado] || statusConfig.cancelada
                const tt = tipoConfig[bet.tipo] || tipoConfig.simple
                const items: any[] = bet.items || []
                const firstEvent = items[0]?.evento_nombre || '—'
                const moreEvents = items.length > 1 ? `+${items.length - 1} más` : null
                const isExpanded = expandedRow === bet.id

                return (
                  <React.Fragment key={bet.id}>
                    <tr
                      className={`hover:bg-muted/30 transition-colors cursor-pointer ${isExpanded ? 'bg-muted/20' : ''}`}
                      onClick={() => setExpandedRow(isExpanded ? null : bet.id)}
                    >
                      <td className="px-4 py-3 text-muted-foreground">
                        {isExpanded
                          ? <ChevronDown size={14} />
                          : <ChevronRight size={14} />
                        }
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(bet.fecha_creacion || bet.created_at).toLocaleString('es-BO', {
                          day: '2-digit', month: '2-digit', year: '2-digit',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono font-bold text-foreground">{fmtBetId(bet.id)}</td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        <span className="font-medium">@{bet.usuario?.nombre_usuario || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${tt}`}>
                          {bet.tipo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground max-w-52">
                        <p className="truncate">{firstEvent}</p>
                        {moreEvents && <span className="text-xs text-muted-foreground">{moreEvents}</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-center font-bold text-foreground">{Number(bet.cuota_total || 0).toFixed(2)}x</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-foreground whitespace-nowrap">Bs {Number(bet.monto).toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold whitespace-nowrap">
                        {bet.estado === 'cashout'
                          ? <span className="text-blue-400">Bs {Number(bet.monto_cashout).toFixed(2)}</span>
                          : <span className={bet.estado === 'ganada' ? 'text-green-400' : ''}>Bs {Number(bet.ganancia_potencial).toFixed(2)}</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${st.className}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedBet(bet) }}
                          className="text-xs text-primary hover:underline font-medium"
                        >
                          Ver más
                        </button>
                      </td>
                    </tr>
                    {/* Expanded inline row */}
                    {isExpanded && items.length > 0 && (
                      <tr className="bg-muted/10">
                        <td colSpan={11} className="px-8 py-3">
                          <div className="flex gap-3 flex-wrap">
                            {items.map((item: any, i: number) => (
                              <div key={i} className="bg-card border border-border rounded-lg px-3 py-2 text-xs min-w-48">
                                <p className="font-semibold text-foreground mb-1 leading-tight">{item.evento_nombre || `Evento #${item.evento_deportivo_id}`}</p>
                                <p className="text-muted-foreground">{item.mercado}</p>
                                <div className="flex items-center justify-between mt-1.5">
                                  <span className="font-medium text-foreground">{item.seleccion_display || item.seleccion}</span>
                                  <span className="text-primary font-bold">{Number(item.cuota).toFixed(2)}x</span>
                                </div>
                                {item.resultado_bool === true && <p className="text-green-400 text-[10px] mt-1 font-bold">✓ Correcto</p>}
                                {item.resultado_bool === false && <p className="text-red-400 text-[10px] mt-1 font-bold">✗ Incorrecto</p>}
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Footer count */}
        {!loading && totalRecords > 0 && (
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
                Mostrando {Math.min((page - 1) * limit + 1, totalRecords)} a {Math.min(page * limit, totalRecords)} de {totalRecords} apuestas
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
        )}
      </div>

      {/* Detail Modal */}
      {selectedBet && (
        <BetDetailPanel bet={selectedBet} onClose={() => setSelectedBet(null)} />
      )}
    </div>
  )
}
