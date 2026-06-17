'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Search, Edit2, UserX, UserCheck, RefreshCw,
  ChevronLeft, ChevronRight, Users, Eye,
} from 'lucide-react'
import {
  getUsuarios, toggleHabilitarUsuario, UsuarioAdmin, UsuariosResponse,
} from '@/lib/api'
import UserModal from '@/components/dashboard/modals/UserModal'

const ROL_LABELS: Record<number, string> = {
  1: 'Administrador',
  2: 'Jugador',
  3: 'Soporte',
  4: 'Afiliado',
}

const ROL_COLORS: Record<number, string> = {
  1: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  2: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  3: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  4: 'bg-green-500/10 text-green-400 border border-green-500/20',
}

export default function UsuariosPage() {
  const [data, setData] = useState<UsuariosResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [filterHabilitado, setFilterHabilitado] = useState<'' | 'true' | 'false'>('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [selectedUser, setSelectedUser] = useState<UsuarioAdmin | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  const fetchUsuarios = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getUsuarios({
        page,
        limit,
        search: searchTerm || undefined,
        habilitado: filterHabilitado || undefined,
      })
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }, [page, limit, searchTerm, filterHabilitado])

  useEffect(() => {
    fetchUsuarios()
  }, [fetchUsuarios])

  // Búsqueda con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  const handleToggleHabilitar = async (usuario: UsuarioAdmin) => {
    setTogglingId(usuario.id)
    try {
      await toggleHabilitarUsuario(usuario.id)
      await fetchUsuarios()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar estado')
    } finally {
      setTogglingId(null)
    }
  }

  const handleEditUser = (user: UsuarioAdmin) => {
    setSelectedUser(user)
    setIsModalOpen(true)
  }

  const handleSaveUser = async () => {
    setIsModalOpen(false)
    setSelectedUser(null)
    await fetchUsuarios()
  }

  const usuarios = data?.data || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Usuarios</h1>
          <p className="text-muted-foreground mt-1">
            {data ? `${data.total} usuarios registrados en el sistema` : 'Cargando...'}
          </p>
        </div>
        <button
          onClick={fetchUsuarios}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 bg-background border border-border hover:bg-muted text-foreground rounded-lg font-medium transition-colors text-sm disabled:opacity-50"
          title="Actualizar"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
            <input
              type="text"
              placeholder="Buscar por nombre, usuario o correo..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
          <select
            value={filterHabilitado}
            onChange={(e) => {
              setFilterHabilitado(e.target.value as '' | 'true' | 'false')
              setPage(1)
            }}
            className="px-4 py-2 border border-border bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          >
            <option value="">Todos los estados</option>
            <option value="true">Habilitados</option>
            <option value="false">Suspendidos</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Usuario</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Correo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">País</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Saldo</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rol</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : usuarios.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <Users size={40} className="mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground text-sm">No se encontraron usuarios</p>
                  </td>
                </tr>
              ) : (
                usuarios.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                    {/* Usuario */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.foto_perfil_url || 'https://res.cloudinary.com/dyqepg2hy/image/upload/v1763771339/trifobet/avatars/default-avatar.png'}
                          alt={u.nombre_usuario}
                          className="w-9 h-9 rounded-full object-cover border border-border"
                        />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {u.nombre} {u.apellido1}
                          </p>
                          <p className="text-xs text-muted-foreground">@{u.nombre_usuario}</p>
                        </div>
                      </div>
                    </td>
                    {/* Correo */}
                    <td className="px-4 py-3 text-sm text-muted-foreground">{u.correo}</td>
                    {/* País */}
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono bg-muted px-2 py-0.5 rounded text-foreground">
                        {u.pais_codigo}
                      </span>
                    </td>
                    {/* Saldo */}
                    <td className="px-4 py-3 text-sm text-right font-medium text-foreground">
                      Bs. {Number(u.saldo).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                    </td>
                    {/* Rol */}
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${ROL_COLORS[u.rol_id] || 'bg-muted text-muted-foreground'}`}>
                        {ROL_LABELS[u.rol_id] || `Rol ${u.rol_id}`}
                      </span>
                    </td>
                    {/* Estado */}
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.habilitado
                          ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                          : 'bg-red-500/10 text-red-500 border border-red-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.habilitado ? 'bg-green-500' : 'bg-red-500'}`} />
                        {u.habilitado ? 'Activo' : 'Suspendido'}
                      </span>
                    </td>
                    {/* Acciones */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEditUser(u)}
                          className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                          title="Editar usuario"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleToggleHabilitar(u)}
                          disabled={togglingId === u.id}
                          className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${
                            u.habilitado
                              ? 'hover:bg-red-500/10 text-muted-foreground hover:text-red-500'
                              : 'hover:bg-green-500/10 text-muted-foreground hover:text-green-500'
                          }`}
                          title={u.habilitado ? 'Suspender usuario' : 'Reactivar usuario'}
                        >
                          {togglingId === u.id ? (
                            <RefreshCw size={15} className="animate-spin" />
                          ) : u.habilitado ? (
                            <UserX size={15} />
                          ) : (
                            <UserCheck size={15} />
                          )}
                        </button>
                        <button
                          onClick={() => handleEditUser(u)}
                          className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                          title="Ver detalle"
                        >
                          <Eye size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
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
                Mostrando {Math.min((page - 1) * limit + 1, data.total)} a {Math.min(page * limit, data.total)} de {data.total} usuarios
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
      <UserModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedUser(null) }}
        onSave={handleSaveUser}
        user={selectedUser || undefined}
      />
    </div>
  )
}
