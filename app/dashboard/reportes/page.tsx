'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts'
import { FileText, Download, TrendingUp, Users, DollarSign, Activity } from 'lucide-react'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'

const COLORS = ['#00C49F', '#0088FE', '#FFBB28', '#FF8042', '#AF19FF']

export default function ReportesPage() {
  const [activeTab, setActiveTab] = useState('financieros')
  const [loading, setLoading] = useState(true)

  // Datos
  const [cashflow, setCashflow] = useState({ totalDepositos: 0, totalRetiros: 0, balance: 0 })
  const [ggr, setGgr] = useState({ totalApostado: 0, totalPagado: 0, ggr: 0 })
  const [depositosMetodo, setDepositosMetodo] = useState([])
  const [topJugadores, setTopJugadores] = useState([])
  const [rentabilidadCasino, setRentabilidadCasino] = useState([])
  const [eficienciaSoporte, setEficienciaSoporte] = useState({ abiertos: 0, cerrados: 0, porCategoria: {} })

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }
      const baseUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/reportes`

      const [resCash, resGgr, resMetodo, resTop, resCasino, resSoporte] = await Promise.all([
        fetch(`${baseUrl}/financieros/cashflow`, { headers }).then(res => res.ok ? res.json() : null),
        fetch(`${baseUrl}/financieros/ggr`, { headers }).then(res => res.ok ? res.json() : null),
        fetch(`${baseUrl}/financieros/depositos-metodo`, { headers }).then(res => res.ok ? res.json() : null),
        fetch(`${baseUrl}/jugadores/top`, { headers }).then(res => res.ok ? res.json() : null),
        fetch(`${baseUrl}/casino/rentabilidad`, { headers }).then(res => res.ok ? res.json() : null),
        fetch(`${baseUrl}/soporte/eficiencia`, { headers }).then(res => res.ok ? res.json() : null),
      ])

      if (resCash) setCashflow(resCash)
      if (resGgr) setGgr(resGgr)
      if (resMetodo) setDepositosMetodo(resMetodo)
      if (resTop) setTopJugadores(resTop)
      if (resCasino) setRentabilidadCasino(resCasino)
      if (resSoporte) setEficienciaSoporte(resSoporte)

    } catch (e) {
      console.error('Error fetching reports', e)
    } finally {
      setLoading(false)
    }
  }

  // EXPORTACIONES
  const exportToPDF = (title: string, tableId: string) => {
    const doc = new jsPDF()
    doc.text(`Reporte: ${title}`, 14, 15)
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 25)
    
    // @ts-ignore
    doc.autoTable({
      html: `#${tableId}`,
      startY: 30,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [0, 168, 132] }
    })
    
    doc.save(`${title.replace(/ /g, '_').toLowerCase()}.pdf`)
  }

  const exportToExcel = (title: string, tableId: string) => {
    const table = document.getElementById(tableId)
    const wb = XLSX.utils.table_to_book(table, { sheet: "Reporte" })
    XLSX.writeFile(wb, `${title.replace(/ /g, '_').toLowerCase()}.xlsx`)
  }

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Calculando Reportes...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reportes Avanzados</h1>
          <p className="text-muted-foreground">Sistema Integral de Analíticas y Tesorería</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-max">
        {[
          { id: 'financieros', icon: DollarSign, label: 'Finanzas' },
          { id: 'jugadores', icon: Users, label: 'Jugadores' },
          { id: 'juegos', icon: Activity, label: 'Casino & Apuestas' },
          { id: 'soporte', icon: FileText, label: 'Soporte' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-colors ${
              activeTab === tab.id 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:bg-background/50'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* CONTENIDO TABS */}
      <div className="space-y-6">
        
        {/* TAB 1: FINANCIEROS */}
        {activeTab === 'financieros' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Tarjetas KPI */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card border border-border p-6 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">GGR (Gross Gaming Revenue)</p>
                <h3 className="text-2xl font-bold text-green-500">Bs. {ggr.ggr.toFixed(2)}</h3>
                <p className="text-xs text-muted-foreground mt-2">Apostado: Bs.{ggr.totalApostado.toFixed(2)} | Pagado: Bs.{ggr.totalPagado.toFixed(2)}</p>
              </div>
              <div className="bg-card border border-border p-6 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Flujo de Caja Real</p>
                <h3 className={`text-2xl font-bold ${cashflow.balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  Bs. {cashflow.balance.toFixed(2)}
                </h3>
                <p className="text-xs text-muted-foreground mt-2">Ingresos: Bs.{cashflow.totalDepositos.toFixed(2)} | Egresos: Bs.{cashflow.totalRetiros.toFixed(2)}</p>
              </div>
              <div className="bg-card border border-border p-6 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Margen (GGR / Apostado)</p>
                <h3 className="text-2xl font-bold text-blue-500">
                  {ggr.totalApostado > 0 ? ((ggr.ggr / ggr.totalApostado) * 100).toFixed(1) : 0}%
                </h3>
              </div>
            </div>

            {/* Graficos Financieros */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-card border border-border p-6 rounded-lg">
                <h3 className="text-lg font-bold mb-4">Ingresos y Egresos (Cashflow)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Depósitos Entrantes', monto: cashflow.totalDepositos, fill: '#00C49F' },
                      { name: 'Retiros Pagados', monto: cashflow.totalRetiros, fill: '#FF8042' }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(val) => `Bs. ${val}`} />
                      <Bar dataKey="monto" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-card border border-border p-6 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">Depósitos por Método de Pago</h3>
                  <div className="flex gap-2">
                    <button onClick={() => exportToExcel('Depositos por Metodo', 'table-metodos')} className="p-2 bg-green-600/20 text-green-500 rounded hover:bg-green-600/40" title="Excel"><Download size={16} /></button>
                    <button onClick={() => exportToPDF('Depositos por Metodo', 'table-metodos')} className="p-2 bg-red-600/20 text-red-500 rounded hover:bg-red-600/40" title="PDF"><FileText size={16} /></button>
                  </div>
                </div>
                <div className="h-64 flex items-center">
                  <ResponsiveContainer width="50%" height="100%">
                    <PieChart>
                      <Pie data={depositosMetodo} dataKey="total" nameKey="metodo" cx="50%" cy="50%" outerRadius={80} label>
                        {depositosMetodo.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val) => `Bs. ${val}`} />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div className="w-1/2 overflow-y-auto max-h-64 pl-4">
                    <table id="table-metodos" className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr><th className="text-left p-2">Método</th><th className="text-right p-2">Total (Bs)</th></tr>
                      </thead>
                      <tbody>
                        {depositosMetodo.map((m: any, i: number) => (
                          <tr key={i} className="border-b border-border">
                            <td className="p-2">{m.metodo}</td>
                            <td className="p-2 text-right font-medium">{Number(m.total).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: JUGADORES */}
        {activeTab === 'jugadores' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-card border border-border p-6 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Top Jugadores (Mayor Volumen Apostado)</h3>
                <div className="flex gap-2">
                  <button onClick={() => exportToExcel('Top Jugadores', 'table-top-jugadores')} className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm"><Download size={14} /> Excel</button>
                  <button onClick={() => exportToPDF('Top Jugadores', 'table-top-jugadores')} className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm"><FileText size={14} /> PDF</button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table id="table-top-jugadores" className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="p-3">#</th>
                      <th className="p-3">ID Usuario</th>
                      <th className="p-3">Nombre</th>
                      <th className="p-3">Correo</th>
                      <th className="p-3 text-right">Volumen Apostado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topJugadores.map((jugador: any, idx) => (
                      <tr key={jugador.usuario?.id} className="border-b border-border hover:bg-muted/30">
                        <td className="p-3 font-bold text-muted-foreground">{idx + 1}</td>
                        <td className="p-3">{jugador.usuario?.id}</td>
                        <td className="p-3">{jugador.usuario?.nombre} {jugador.usuario?.apellido1}</td>
                        <td className="p-3">{jugador.usuario?.correo}</td>
                        <td className="p-3 text-right font-bold text-green-500">Bs. {Number(jugador.total).toFixed(2)}</td>
                      </tr>
                    ))}
                    {topJugadores.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No hay datos suficientes</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: JUEGOS Y APUESTAS */}
        {activeTab === 'juegos' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-card border border-border p-6 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Rentabilidad por Juego de Casino</h3>
                <div className="flex gap-2">
                  <button onClick={() => exportToExcel('Rentabilidad Casino', 'table-rentabilidad')} className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm"><Download size={14} /> Excel</button>
                  <button onClick={() => exportToPDF('Rentabilidad Casino', 'table-rentabilidad')} className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm"><FileText size={14} /> PDF</button>
                </div>
              </div>

              <div className="h-80 mb-8">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rentabilidadCasino} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="juego" />
                    <YAxis />
                    <Tooltip formatter={(val) => `Bs. ${val}`} />
                    <Legend />
                    <Bar dataKey="apostado" name="Total Apostado" fill="#0088FE" />
                    <Bar dataKey="pagado" name="Premios Pagados" fill="#FF8042" />
                    <Bar dataKey="ggr" name="GGR (Ganancia Casa)" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="overflow-x-auto">
                <table id="table-rentabilidad" className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="p-3">Juego</th>
                      <th className="p-3 text-right">Apostado (Volumen)</th>
                      <th className="p-3 text-right">Pagado (Premios)</th>
                      <th className="p-3 text-right">GGR (Ganancia Casa)</th>
                      <th className="p-3 text-right">Margen (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rentabilidadCasino.map((j: any, idx) => (
                      <tr key={idx} className="border-b border-border hover:bg-muted/30">
                        <td className="p-3 font-medium capitalize">{j.juego.replace('_', ' ')}</td>
                        <td className="p-3 text-right">Bs. {Number(j.apostado).toFixed(2)}</td>
                        <td className="p-3 text-right">Bs. {Number(j.pagado).toFixed(2)}</td>
                        <td className={`p-3 text-right font-bold ${j.ggr >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          Bs. {Number(j.ggr).toFixed(2)}
                        </td>
                        <td className="p-3 text-right text-blue-400">
                          {j.apostado > 0 ? ((j.ggr / j.apostado) * 100).toFixed(2) : 0}%
                        </td>
                      </tr>
                    ))}
                    {rentabilidadCasino.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No hay actividad de casino registrada</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SOPORTE */}
        {activeTab === 'soporte' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
            <div className="bg-card border border-border p-6 rounded-lg flex flex-col justify-center items-center">
              <h3 className="text-lg font-bold mb-2">Eficiencia de Resolución (SLA)</h3>
              <p className="text-muted-foreground text-sm mb-6 text-center">Proporción de tickets cerrados vs pendientes.</p>
              
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={[
                        { name: 'Cerrados / Resueltos', value: eficienciaSoporte.cerrados, fill: '#00C49F' },
                        { name: 'Abiertos / Pendientes', value: eficienciaSoporte.abiertos, fill: '#FF8042' }
                      ]} 
                      dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} label
                    />
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-card border border-border p-6 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Problemas por Categoría</h3>
                <button onClick={() => exportToPDF('Soporte Categorias', 'table-soporte')} className="p-2 bg-red-600/20 text-red-500 rounded hover:bg-red-600/40" title="Descargar PDF"><FileText size={16} /></button>
              </div>

              <table id="table-soporte" className="w-full text-left border-collapse mt-4">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="p-3">Categoría</th>
                    <th className="p-3 text-right">Cant. Tickets</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(eficienciaSoporte.porCategoria || {}).map(([cat, total], i) => (
                    <tr key={i} className="border-b border-border">
                      <td className="p-3 font-medium">{cat}</td>
                      <td className="p-3 text-right">{total as number}</td>
                    </tr>
                  ))}
                  {Object.keys(eficienciaSoporte.porCategoria || {}).length === 0 && (
                    <tr><td colSpan={2} className="p-4 text-center text-muted-foreground">No hay tickets registrados</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
