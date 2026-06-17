'use client'

import { useState, useEffect } from 'react'
import { Search, Download, ArrowDownRight, ArrowUpLeft, Loader2, FileText, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'

interface Transaccion {
  id: number
  usuario_id: number
  tipo: 'deposito' | 'retiro' | 'apuesta' | 'ganancia' | 'reembolso'
  monto: number
  estado: 'pendiente' | 'aprobado' | 'rechazado' | 'completado' | 'cancelado'
  descripcion: string
  fecha_creacion: string
  usuario: {
    nombre: string
    apellido1: string
    correo: string
    nombre_usuario: string
  }
  entidad_financiera?: { nombre: string }
  metodo_pago?: { nombre: string }
}

const statusStyles = {
  completado: 'bg-primary/10 text-primary',
  aprobado: 'bg-green-500/10 text-green-600',
  rechazado: 'bg-red-500/10 text-red-600',
  pendiente: 'bg-yellow-500/10 text-yellow-600',
  cancelado: 'bg-destructive/10 text-destructive',
}

const typeColors = {
  deposito: 'text-primary',
  retiro: 'text-muted-foreground',
  apuesta: 'text-blue-400',
  ganancia: 'text-green-400',
  reembolso: 'text-orange-400',
}

export default function TransaccionesPage() {
  const [transactions, setTransactions] = useState<Transaccion[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('todos')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [totalRecords, setTotalRecords] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const token = sessionStorage.getItem('admin_token')
      const offset = (page - 1) * limit
      let url = `${process.env.NEXT_PUBLIC_API_URL}/transacciones/admin/historial?limit=${limit}&offset=${offset}`
      if (filterType !== 'todos') url += `&tipo=${filterType}`
      if (filterStatus !== 'todos') url += `&estado=${filterStatus}`
      if (searchTerm) url += `&searchTerm=${encodeURIComponent(searchTerm)}`

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      if (res.ok) {
        const data = await res.json()
        setTransactions(data.transacciones)
        setTotalRecords(data.total || 0)
      }
    } catch (error) {
      console.error('Error cargando transacciones', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchTransactions()
    setIsRefreshing(false)
  }

  useEffect(() => {
    // Debounce de búsqueda
    const timer = setTimeout(() => {
      fetchTransactions()
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm, filterType, filterStatus, page, limit])

  const totalIngresos = transactions
    .filter((t) => (t.tipo === 'deposito' || t.tipo === 'ganancia') && (t.estado === 'completado' || t.estado === 'aprobado'))
    .reduce((sum, t) => sum + t.monto, 0)

  const totalEgresos = transactions
    .filter((t) => t.tipo === 'retiro' && (t.estado === 'completado' || t.estado === 'aprobado'))
    .reduce((sum, t) => sum + t.monto, 0)

  const formatId = (id: number) => `TRF-${id.toString().padStart(8, '0')}`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Transacciones</h1>
          <p className="text-muted-foreground">Registro completo de movimientos financieros</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing || loading}
            className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-medium transition-colors"
          >
            <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
            Actualizar
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors">
            <Download size={20} />
            Exportar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ArrowDownRight className="text-primary" size={20} />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Ingresos (Depósitos y Ganancias)</p>
          </div>
          <p className="text-2xl font-bold text-primary">Bs {totalIngresos.toFixed(2)}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-muted rounded-lg">
              <ArrowUpLeft className="text-muted-foreground" size={20} />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Egresos (Retiros)</p>
          </div>
          <p className="text-2xl font-bold text-muted-foreground">Bs {totalEgresos.toFixed(2)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder="Buscar por ID, usuario o concepto..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-border bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
            className="flex-1 px-4 py-2 border border-border bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          >
            <option value="todos">Todos los tipos</option>
            <option value="deposito">Recargas / Depósitos</option>
            <option value="retiro">Retiros</option>
            <option value="apuesta">Apuestas (Descuentos)</option>
            <option value="ganancia">Ganancias (Abonos)</option>
            <option value="reembolso">Reembolsos</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="flex-1 px-4 py-2 border border-border bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          >
            <option value="todos">Todos los estados</option>
            <option value="completado">Completados</option>
            <option value="aprobado">Aprobados</option>
            <option value="pendiente">Pendientes</option>
            <option value="rechazado">Rechazados</option>
            <option value="cancelado">Cancelados</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-sm font-semibold text-foreground whitespace-nowrap">ID Transacción</th>
                <th className="px-4 py-3 text-sm font-semibold text-foreground">Fecha</th>
                <th className="px-4 py-3 text-sm font-semibold text-foreground">Usuario</th>
                <th className="px-4 py-3 text-sm font-semibold text-foreground">Tipo</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">Monto</th>
                <th className="px-4 py-3 text-sm font-semibold text-foreground">Concepto</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Cargando transacciones...</p>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground font-medium">No se encontraron transacciones</p>
                    <p className="text-sm text-muted-foreground mt-1">Intenta con otros filtros de búsqueda</p>
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono font-medium text-foreground">
                      {formatId(t.id)}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(t.fecha_creacion).toLocaleString('es-BO')}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground">{t.usuario?.nombre_usuario || 'Desconocido'}</p>
                      <p className="text-xs text-muted-foreground">{t.usuario?.nombre} {t.usuario?.apellido1}</p>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        {t.tipo === 'deposito' || t.tipo === 'ganancia' ? (
                          <ArrowDownRight className={typeColors[t.tipo] || 'text-muted-foreground'} size={16} />
                        ) : (
                          <ArrowUpLeft className={typeColors[t.tipo] || 'text-muted-foreground'} size={16} />
                        )}
                        <span className={`capitalize ${typeColors[t.tipo] || 'text-muted-foreground'} font-medium`}>
                          {t.tipo === 'deposito' ? 'Recarga' : t.tipo === 'ganancia' ? 'Abono Ganancia' : t.tipo}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-foreground font-bold">
                      Bs {t.monto.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {t.descripcion}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                          statusStyles[t.estado] || statusStyles.pendiente
                        }`}
                      >
                        {t.estado}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        <div className="bg-muted/30 border-t border-border p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
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
      </div>
    </div>
  )
}
