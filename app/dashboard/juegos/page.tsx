'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, Edit2, Trash2, ToggleRight, ToggleLeft } from 'lucide-react'
import GameModal from '@/components/dashboard/modals/GameModal'
import { getJuegosAdminStats, createJuego, updateJuego, deleteJuego, JuegoCasino } from '@/lib/api'

const typeStyles: Record<string, string> = {
  slots: 'bg-blue-500/10 text-blue-400',
  mesa: 'bg-purple-500/10 text-purple-400',
  instantaneo: 'bg-pink-500/10 text-pink-400',
  blackjack: 'bg-green-500/10 text-green-400',
  plinko: 'bg-yellow-500/10 text-yellow-400',
}

const typeLabels: Record<string, string> = {
  slots: 'Slots',
  mesa: 'Mesa',
  instantaneo: 'Instantáneo',
  blackjack: 'Blackjack',
  plinko: 'Plinko',
}

export default function JuegosPage() {
  const [games, setGames] = useState<JuegoCasino[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('todos')
  const [filterStatus, setFilterStatus] = useState<string>('todos')
  const [filterStats, setFilterStats] = useState<string>('todos')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedGame, setSelectedGame] = useState<JuegoCasino | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'metricas' | 'gestion'>('metricas')
  const [sortConfig, setSortConfig] = useState<{ key: keyof JuegoCasino; direction: 'asc' | 'desc' } | null>(null)

  const fetchGames = async () => {
    try {
      setLoading(true)
      const data = await getJuegosAdminStats()
      setGames(data)
    } catch (error) {
      console.error('Error fetching games:', error)
      alert('Error cargando juegos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGames()
  }, [])

  let filteredGames = games.filter((game) => {
    const matchesSearch =
      game.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.proveedor?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = filterType === 'todos' || game.categoria === filterType
    
    let matchesStatus = true;
    if (filterStatus === 'activos') matchesStatus = game.habilitado === true;
    if (filterStatus === 'inactivos') matchesStatus = game.habilitado === false;

    return matchesSearch && matchesType && matchesStatus
  })

  if (filterStats === 'mas_jugados') {
    filteredGames.sort((a, b) => (b.partidasJugadas || 0) - (a.partidasJugadas || 0))
  } else if (filterStats === 'menos_jugados') {
    filteredGames.sort((a, b) => (a.partidasJugadas || 0) - (b.partidasJugadas || 0))
  } else if (filterStats === 'mas_ganancias') {
    filteredGames.sort((a, b) => (b.gananciaNeta || 0) - (a.gananciaNeta || 0))
  } else if (filterStats === 'menos_ganancias') {
    filteredGames.sort((a, b) => (a.gananciaNeta || 0) - (b.gananciaNeta || 0))
  }

  const handleAddGame = () => {
    setSelectedGame(null)
    setIsModalOpen(true)
  }

  const handleEditGame = (game: JuegoCasino) => {
    setSelectedGame(game)
    setIsModalOpen(true)
  }

  const handleSaveGame = async (gameData: Partial<JuegoCasino>) => {
    try {
      if (selectedGame) {
        await updateJuego(selectedGame.id, gameData)
      } else {
        await createJuego(gameData)
      }
      setIsModalOpen(false)
      fetchGames()
    } catch (error) {
      console.error('Error saving game', error)
      alert('Error guardando el juego')
    }
  }

  const handleDeleteGame = async (id: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar este juego?')) {
      try {
        await deleteJuego(id)
        fetchGames()
      } catch (error) {
        console.error('Error deleting game', error)
        alert('Error eliminando el juego')
      }
    }
  }

  const toggleGameStatus = async (game: JuegoCasino) => {
    try {
      await updateJuego(game.id, { habilitado: !game.habilitado })
      fetchGames()
    } catch (error) {
      console.error('Error updating game status', error)
    }
  }

  const globalMontoApostado = games.reduce((sum, g) => sum + (g.montoApostado || 0), 0)
  const globalMontoRetorno = games.reduce((sum, g) => sum + (g.montoRetorno || 0), 0)
  const globalGananciaNeta = games.reduce((sum, g) => sum + (g.gananciaNeta || 0), 0)
  const globalPartidasJugadas = games.reduce((sum, g) => sum + (g.partidasJugadas || 0), 0)

  const handleSort = (key: keyof JuegoCasino) => {
    let direction: 'asc' | 'desc' = 'desc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc'
    }
    setSortConfig({ key, direction })
  }

  const sortedGames = [...filteredGames].sort((a, b) => {
    if (!sortConfig) return 0
    const aValue = a[sortConfig.key] || 0
    const bValue = b[sortConfig.key] || 0
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  if (loading) {
    return <div className="p-8 text-center">Cargando juegos...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Juegos</h1>
          <p className="text-muted-foreground">
            Administra todos los juegos disponibles en la plataforma
          </p>
        </div>
        <button
          onClick={handleAddGame}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors"
        >
          <Plus size={20} />
          Nuevo Juego
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('metricas')}
          className={`px-6 py-3 font-medium text-sm transition-colors relative ${
            activeTab === 'metricas' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Métricas y Análisis
          {activeTab === 'metricas' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('gestion')}
          className={`px-6 py-3 font-medium text-sm transition-colors relative ${
            activeTab === 'gestion' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Gestión de Catálogo
          {activeTab === 'gestion' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />
          )}
        </button>
      </div>

      {activeTab === 'metricas' ? (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-lg p-6">
              <p className="text-sm font-medium text-muted-foreground mb-2">Total Apostado (Volumen)</p>
              <p className="text-2xl font-bold text-foreground">Bs {globalMontoApostado.toFixed(2)}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <p className="text-sm font-medium text-muted-foreground mb-2">Retornos a Usuarios</p>
              <p className="text-2xl font-bold text-foreground">Bs {globalMontoRetorno.toFixed(2)}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <p className="text-sm font-medium text-muted-foreground mb-2">Ganancia Neta (GGR)</p>
              <p className={`text-2xl font-bold ${globalGananciaNeta >= 0 ? 'text-primary' : 'text-destructive'}`}>
                Bs {globalGananciaNeta.toFixed(2)}
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <p className="text-sm font-medium text-muted-foreground mb-2">Partidas Totales</p>
              <p className="text-2xl font-bold text-primary">{globalPartidasJugadas}</p>
            </div>
          </div>

          {/* Metrics Table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Juego</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-foreground cursor-pointer hover:bg-muted" onClick={() => handleSort('partidasJugadas')}>Partidas</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-foreground cursor-pointer hover:bg-muted" onClick={() => handleSort('montoApostado')}>Total Apostado</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-foreground cursor-pointer hover:bg-muted" onClick={() => handleSort('montoRetorno')}>Retornos</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-foreground cursor-pointer hover:bg-muted" onClick={() => handleSort('gananciaNeta')}>Ganancia (GGR)</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-foreground">RTP Real</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedGames.map((game) => {
                    const rtpReal = game.montoApostado ? ((game.montoRetorno || 0) / game.montoApostado) * 100 : 0
                    return (
                      <tr key={game.id} className="border-b border-border hover:bg-muted/50">
                        <td className="px-6 py-4 text-sm text-foreground font-medium">{game.nombre}</td>
                        <td className="px-6 py-4 text-sm text-center text-foreground">{game.partidasJugadas || 0}</td>
                        <td className="px-6 py-4 text-sm text-right text-foreground">Bs {(game.montoApostado || 0).toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm text-right text-foreground">Bs {(game.montoRetorno || 0).toFixed(2)}</td>
                        <td className={`px-6 py-4 text-sm text-right font-semibold ${(game.gananciaNeta || 0) >= 0 ? 'text-primary' : 'text-destructive'}`}>
                          Bs {(game.gananciaNeta || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm text-center font-medium">
                          {rtpReal.toFixed(2)}%
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre o proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-border bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="todos">Todos los tipos</option>
            <option value="slots">Slots</option>
            <option value="mesa">Juegos de Mesa</option>
            <option value="instantaneo">Instantáneos</option>
            <option value="blackjack">Blackjack</option>
            <option value="plinko">Plinko</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-border bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="todos">Cualquier estado</option>
            <option value="activos">Solo activos</option>
            <option value="inactivos">Solo inactivos</option>
          </select>
          <select
            value={filterStats}
            onChange={(e) => setFilterStats(e.target.value)}
            className="px-4 py-2 border border-border bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="todos">Ordenar por defecto</option>
            <option value="mas_jugados">Más jugados</option>
            <option value="menos_jugados">Menos jugados</option>
            <option value="mas_ganancias">Más ganancias (GGR)</option>
            <option value="menos_ganancias">Menos ganancias (GGR)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Nombre</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Categoría</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Proveedor</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-foreground">RTP</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-foreground">Jugadores</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Ingreso Hoy</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-foreground">Estado</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredGames.map((game) => (
                <tr key={game.id} className="border-b border-border hover:bg-muted/50">
                  <td className="px-6 py-4 text-sm text-foreground font-medium">{game.nombre}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${typeStyles[game.categoria] || typeStyles.slots}`}>
                      {typeLabels[game.categoria] || game.categoria}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{game.proveedor}</td>
                  <td className="px-6 py-4 text-sm text-center text-foreground font-medium">{game.rtp}%</td>
                  <td className="px-6 py-4 text-sm text-center text-foreground">{game.jugadoresActivos || 0}</td>
                  <td className="px-6 py-4 text-sm text-right text-foreground font-semibold">Bs {(game.ingresoHoy || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => toggleGameStatus(game)}
                      className="inline-flex items-center"
                      title={game.habilitado ? 'Desactivar' : 'Activar'}
                    >
                      {game.habilitado ? (
                        <ToggleRight className="text-primary" size={20} />
                      ) : (
                        <ToggleLeft className="text-muted-foreground" size={20} />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEditGame(game)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors text-foreground"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteGame(game.id)}
                        className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-destructive"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

          {filteredGames.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No se encontraron juegos que coincidan con tu búsqueda
            </div>
          )}
        </div>
      </div>
      )}

      {/* Game Modal */}
      <GameModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveGame}
        game={selectedGame || undefined}
      />
    </div>
  )
}
