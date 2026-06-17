# Estructura del Proyecto TrifoBet

## Vista General

```
v0-project/
│
├── frontend/                    # Aplicación Next.js 16
│   ├── app/
│   │   ├── page.tsx            # Página de login
│   │   ├── layout.tsx          # Layout raíz
│   │   ├── globals.css         # Estilos globales (Tema Verde/Negro)
│   │   └── dashboard/
│   │       ├── layout.tsx      # Layout del dashboard
│   │       ├── page.tsx        # Dashboard principal
│   │       ├── usuarios/
│   │       │   └── page.tsx    # ✨ ACTUALIZADO: Campo Habilitado
│   │       ├── transacciones/
│   │       │   └── page.tsx    # ✨ ACTUALIZADO: Aprobar/Rechazar
│   │       ├── soporte/
│   │       │   └── page.tsx    # ✨ NUEVO: Chat en vivo
│   │       ├── juegos/
│   │       │   └── page.tsx    # Gestión de juegos
│   │       ├── apuestas/
│   │       │   └── page.tsx    # Apuestas deportivas
│   │       └── reportes/
│   │           └── page.tsx    # ✨ ACTUALIZADO: Filtros + Descarga
│   │
│   ├── components/
│   │   └── dashboard/
│   │       ├── Sidebar.tsx     # ✨ ACTUALIZADO: Enlace Soporte
│   │       ├── Navbar.tsx      # Barra superior
│   │       ├── StatsCard.tsx   # Tarjetas de estadísticas
│   │       ├── RecentUsers.tsx # Usuarios recientes
│   │       ├── RecentTransactions.tsx # Transacciones recientes
│   │       └── modals/
│   │           ├── UserModal.tsx
│   │           ├── GameModal.tsx
│   │           └── BetModal.tsx
│   │
│   ├── hooks/
│   │   └── useAuth.ts          # Hook de autenticación
│   │
│   ├── lib/
│   │   └── utils.ts            # Utilidades (cn function)
│   │
│   ├── public/
│   │   └── data/
│   │       ├── users.json      # Datos de usuarios
│   │       ├── transactions.json # Datos de transacciones
│   │       ├── games.json      # Datos de juegos
│   │       └── bets.json       # Datos de apuestas
│   │
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.mjs
│   └── postcss.config.mjs
│
├── backend/                     # Estructura NestJS (Documentada)
│   ├── BACKEND_README.md        # Descripción del backend
│   ├── BACKEND_SETUP.md         # Guía de instalación
│   ├── ARCHITECTURE.md          # Arquitectura detallada
│   │
│   └── (Estructura a crear según BACKEND_SETUP.md)
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   ├── auth/
│       │   ├── usuarios/
│       │   ├── transacciones/
│       │   ├── juegos/
│       │   ├── apuestas/
│       │   ├── reportes/
│       │   ├── config/
│       │   ├── guards/
│       │   ├── filters/
│       │   ├── interceptors/
│       │   ├── pipes/
│       │   └── middleware/
│       ├── test/
│       ├── package.json
│       ├── tsconfig.json
│       └── .env.example
│
├── CAMBIOS_REALIZADOS.md        # Resumen de cambios
├── ESTRUCTURA_PROYECTO.md       # Este archivo
├── ARCHITECTURE.md              # Arquitectura general (legado)
├── BACKEND_README.md            # README backend (legado)
├── BACKEND_SETUP.md             # Setup backend (legado)
└── PROJECT_SUMMARY.md           # Resumen proyecto (legado)

```

## Cambios Realizados

### 1. Módulo de Usuarios
- **Archivo**: `frontend/app/dashboard/usuarios/page.tsx`
- **Cambio**: Agregada columna "Habilitado" con toggle independiente
- **Interfaz**: Campo `habilitado: boolean` añadido
- **Funcionalidad**: `toggleUserEnabled()` para cambiar estado

### 2. Módulo de Transacciones
- **Archivo**: `frontend/app/dashboard/transacciones/page.tsx`
- **Cambio**: Agregada columna "Acciones" con botones Aprobar/Rechazar
- **Estados**: Añadidos `'aprobada'` y `'rechazada'`
- **Funcionalidad**: `handleApproveTransaction()` y `handleRejectTransaction()`

### 3. Nuevo Módulo de Soporte
- **Archivo**: `frontend/app/dashboard/soporte/page.tsx`
- **Tipo**: Chat en tiempo real
- **Características**:
  - Lista de usuarios con problemas
  - Panel de chat con mensajes
  - Soporte para compartir imágenes
  - Timestamps en mensajes
  - Input para respuestas del admin

### 4. Módulo de Reportes
- **Archivo**: `frontend/app/dashboard/reportes/page.tsx`
- **Cambios**:
  - Filtro por tipo de reporte (General, Transacciones, Depósitos, Retiros)
  - Filtro por período (últimos 5 meses, último año)
  - Descarga en formato texto legible y profesional
  - Función `generatePDF()` con formato estructurado

### 5. Actualización del Sidebar
- **Archivo**: `frontend/components/dashboard/Sidebar.tsx`
- **Cambio**: Agregado enlace a "Soporte" con icono MessageCircle
- **Posición**: Antes del botón de logout

## Estructura de Datos

### Interface User
```typescript
interface User {
  id: string
  nombre: string
  email: string
  telefono: string
  ciudad: string
  estado: 'activo' | 'inactivo'        // Estado de sesión
  habilitado: boolean                   // ✨ NUEVO
  saldo: number
  fechaRegistro: string
}
```

### Interface Transaction
```typescript
interface Transaction {
  id: string
  usuario: string
  tipo: 'deposito' | 'retiro' | 'apuesta' | 'premio'
  monto: number
  metodoPago: string
  fecha: string
  estado: 'completada' | 'pendiente' | 'fallida' | 'aprobada' | 'rechazada' // ✨ ACTUALIZADO
  concepto: string
}
```

### Interface ChatMessage
```typescript
interface ChatMessage {
  id: string
  usuario: string
  usuarioId: string
  contenido: string
  imagen?: string                       // ✨ NUEVO
  timestamp: string
  tipo: 'usuario' | 'admin'
}
```

## Tema y Estilos

**Colores principales:**
- Verde primario: `oklch(0.4 0.15 142)` (#2ECC71)
- Negro secundario: `oklch(0.2 0 0)` (#2C3E50)
- Fondo oscuro: `oklch(0.1 0 0)`
- Cards: `oklch(0.15 0 0)`

**Tipografía:**
- Fuente Sans: Geist
- Fuente Mono: Geist Mono

**Layout:**
- Sidebar colapsable
- Navbar responsive
- Tablas con scroll horizontal
- Modales para CRUD
- Cards para estadísticas

## Moneda

Todas las operaciones utilizan **Bolivianos (Bs )** con formato:
- Símbolo: `Bs `
- Decimales: 2
- Ejemplo: `Bs 1,234.56`

## Autenticación

**Hook**: `useAuth()` en `frontend/hooks/useAuth.ts`

**Funcionalidades:**
- `login(email, password)` - Inicia sesión
- `logout()` - Cierra sesión
- `isAuthenticated` - Estado de autenticación
- `isLoading` - Estado de carga
- `user` - Datos del usuario actual
- `error` - Mensaje de error

**Almacenamiento:**
- SessionStorage para tokens
- SessionStorage para datos de usuario

## Rutas Protegidas

```
/                      → Login
/dashboard             → Dashboard principal
/dashboard/usuarios    → Gestión de usuarios
/dashboard/transacciones → Gestión de transacciones
/dashboard/soporte     → Centro de soporte (✨ NUEVO)
/dashboard/juegos      → Gestión de juegos
/dashboard/apuestas    → Gestión de apuestas deportivas
/dashboard/reportes    → Reportes y análisis
```

## Desarrollo

### Instalar dependencias
```bash
cd frontend
pnpm install
```

### Ejecutar servidor de desarrollo
```bash
pnpm dev
```

### URL local
```
http://localhost:3000
```

### Credenciales demo
- Email: `admin@trifobet.com`
- Contraseña: `123456`

## Próximas Fases

### Fase 2: Backend NestJS
- Seguir guía en `backend/BACKEND_SETUP.md`
- Implementar API REST
- Configurar base de datos
- Implementar seguridad

### Fase 3: Integración
- Conectar frontend con APIs
- Reemplazar datos mock con datos reales
- Implementar WebSockets para chat en vivo
- Agregar validaciones de backend

### Fase 4: Producción
- Migrar a PostgreSQL
- Implementar autenticación segura
- Configurar HTTPS
- Desplegar en producción

---

**Nota**: Este proyecto mantiene arquitectura limpia, principios SOLID y código bien documentado.
