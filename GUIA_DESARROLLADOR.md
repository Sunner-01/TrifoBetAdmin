# Guía del Desarrollador - TrifoBet

## Introducción

Este documento proporciona instrucciones para continuar el desarrollo de TrifoBet con los cambios realizados.

## Estructura Actual del Proyecto

El proyecto está dividido en dos carpetas independientes:

```
/vercel/share/v0-project/
├── /frontend     ← Aplicación Next.js (USAR ESTA)
└── /backend      ← Estructura NestJS (A IMPLEMENTAR)
```

## Cambios Realizados (Resumen)

Se han implementado **5 cambios específicos**:

1. ✅ **Usuarios**: Campo "Habilitado" independiente (toggle en tabla)
2. ✅ **Transacciones**: Botones Aprobar/Rechazar para pendientes
3. ✅ **Soporte**: Nuevo módulo con chat en vivo e imágenes
4. ✅ **Reportes**: Filtros avanzados (tipo, período, rango) y descarga
5. ✅ **Estructura**: Frontend y Backend en carpetas separadas

## Cómo Ejecutar el Frontend

### 1. Navegar a la carpeta frontend
```bash
cd /vercel/share/v0-project/frontend
```

### 2. Instalar dependencias (si es necesario)
```bash
pnpm install
```

### 3. Ejecutar servidor de desarrollo
```bash
pnpm dev
```

### 4. Acceder a la aplicación
```
http://localhost:3000
```

### Credenciales de prueba
- **Email**: admin@trifobet.com
- **Contraseña**: 123456

## Archivos Modificados

### 1. Usuarios - Campo Habilitado

**Archivo**: `frontend/app/dashboard/usuarios/page.tsx`

**Cambios**:
- Interfaz `User`: Agregado `habilitado: boolean`
- Mockdata: Todos los usuarios con estado habilitado/deshabilitado
- Nueva columna: "Habilitado" con toggle
- Nueva función: `toggleUserEnabled(id)`

**Cómo usar**:
```typescript
const toggleUserEnabled = (id: string) => {
  setUsers(
    users.map((u) =>
      u.id === id ? { ...u, habilitado: !u.habilitado } : u
    )
  )
}
```

### 2. Transacciones - Aprobación

**Archivo**: `frontend/app/dashboard/transacciones/page.tsx`

**Cambios**:
- Estado: Agregados `'aprobada'` y `'rechazada'`
- Nueva columna: "Acciones" con botones
- Nuevas funciones: `handleApproveTransaction()` y `handleRejectTransaction()`
- Estados visuales: Verde (aprobada), Rojo (rechazada)

**Cómo usar**:
```typescript
const handleApproveTransaction = (id: string) => {
  setTransactions(
    transactions.map((t) =>
      t.id === id ? { ...t, estado: 'aprobada' } : t
    )
  )
}

const handleRejectTransaction = (id: string) => {
  setTransactions(
    transactions.map((t) =>
      t.id === id ? { ...t, estado: 'rechazada' } : t
    )
  )
}
```

### 3. Soporte - Chat en Vivo

**Archivo**: `frontend/app/dashboard/soporte/page.tsx`

**Cambios**:
- Nuevo archivo completo con interfaz `ChatMessage`
- Layout de dos columnas: usuarios | chat
- Soporte para imágenes
- Input de texto con botón de envío
- Botón para subir imágenes

**Interfaz ChatMessage**:
```typescript
interface ChatMessage {
  id: string
  usuario: string
  usuarioId: string
  contenido: string
  imagen?: string
  timestamp: string
  tipo: 'usuario' | 'admin'
}
```

**Funcionalidades**:
- Seleccionar usuario de la lista
- Ver historial de conversación
- Enviar mensajes de texto
- Subir y visualizar imágenes
- Timestamps automáticos

### 4. Reportes - Filtros Avanzados

**Archivo**: `frontend/app/dashboard/reportes/page.tsx`

**Cambios**:
- Tres selectores: tipo, período, rango temporal
- Función mejorada: `generatePDF()`
- Formato legible y profesional

**Filtros disponibles**:

1. **Tipo de Reporte**:
   - Reporte General
   - Transacciones
   - Depósitos
   - Retiros

2. **Período**:
   - Junio 2024
   - Mayo 2024
   - Abril 2024

3. **Rango Temporal**:
   - Últimos 5 Meses
   - Último Año

**Descarga**:
```typescript
const generatePDF = () => {
  // Genera archivo .txt con formato profesional
  // Incluye encabezados, métricas y separadores
  // Listo para presentación formal
}
```

### 5. Sidebar - Soporte

**Archivo**: `frontend/components/dashboard/Sidebar.tsx`

**Cambios**:
- Importado icono `MessageCircle` de Lucide
- Agregado item de menú: `{ href: '/dashboard/soporte', label: 'Soporte', icon: MessageCircle }`

## Datos Mock

Los datos mock se encuentran en:

```
/frontend/public/data/
├── users.json           # 5 usuarios de prueba
├── transactions.json    # Transacciones de ejemplo
├── games.json          # Juegos de prueba
└── bets.json           # Apuestas de prueba
```

## Próximos Pasos

### Para Integración con Backend

1. **Crear cliente HTTP**:
   ```bash
   pnpm add axios
   ```

2. **Crear servicio para cada módulo**:
   ```typescript
   // services/api/usuarios.ts
   import axios from 'axios'
   
   const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
   
   export const usuariosService = {
     getAll: () => axios.get(`${API_URL}/usuarios`),
     getById: (id: string) => axios.get(`${API_URL}/usuarios/${id}`),
     create: (data) => axios.post(`${API_URL}/usuarios`, data),
     update: (id: string, data) => axios.put(`${API_URL}/usuarios/${id}`, data),
     delete: (id: string) => axios.delete(`${API_URL}/usuarios/${id}`),
   }
   ```

3. **Reemplazar datos mock con API calls**:
   ```typescript
   useEffect(() => {
     usuariosService.getAll()
       .then(res => setUsers(res.data))
       .catch(err => console.error(err))
   }, [])
   ```

### Para Chat en Vivo (WebSocket)

1. **Instalar socket.io-client**:
   ```bash
   pnpm add socket.io-client
   ```

2. **Crear hook useSocket**:
   ```typescript
   // hooks/useSocket.ts
   import { useEffect, useState } from 'react'
   import io from 'socket.io-client'
   
   export const useSocket = () => {
     const [socket, setSocket] = useState(null)
     
     useEffect(() => {
       const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL)
       setSocket(newSocket)
       
       return () => newSocket.close()
     }, [])
     
     return socket
   }
   ```

## Variables de Entorno

Crear archivo `.env.local` en `/frontend`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

## Testing

Para agregar pruebas unitarias:

```bash
pnpm add -D jest @testing-library/react @testing-library/jest-dom
```

## Troubleshooting

### Error: "Cannot find module '@/components/...'"

- Verificar que el alias `@/` está configurado en `tsconfig.json`
- Debe apuntar a la carpeta raíz del frontend

### Página en blanco

- Verificar console del navegador (F12) para errores
- Verificar que el servidor está corriendo en puerto 3000

### Estilos no se aplican

- Verificar que `globals.css` está importado en `layout.tsx`
- Verificar que Tailwind está configurado correctamente

## Comandos Útiles

```bash
# Desarrollo
pnpm dev

# Build
pnpm build

# Ejecutar build
pnpm start

# Linting
pnpm lint

# Type checking
pnpm type-check
```

## Convenciones de Código

### Estructura de componentes
```typescript
'use client'  // Si es un componente cliente

import { useState } from 'react'
import { SomeIcon } from 'lucide-react'

interface Props {
  // Interface props
}

export default function ComponentName({ prop }: Props) {
  // Lógica
  
  return (
    // JSX
  )
}
```

### Nombres
- Componentes: PascalCase (ComponentName.tsx)
- Funciones: camelCase (handleClick)
- Constantes: UPPER_SNAKE_CASE (MAX_ITEMS)
- Archivos: kebab-case (component-name.tsx) EXCEPTO componentes

### Estilos
- Usar Tailwind CSS
- Usar clases semánticas
- No agregar estilos inline
- Usar diseño tokens en globals.css

## Documentación

- `CAMBIOS_REALIZADOS.md` - Resumen de cambios
- `ESTRUCTURA_PROYECTO.md` - Estructura detallada
- `BACKEND_SETUP.md` - Guía backend (en `/backend`)
- `ARCHITECTURE.md` - Arquitectura general (en `/backend`)

## Soporte

Para preguntas sobre los cambios realizados, consultar:
1. `CAMBIOS_REALIZADOS.md` - Cambios específicos
2. `ESTRUCTURA_PROYECTO.md` - Estructura del código
3. Archivos de documentación en `/backend`

---

**Última actualización**: Junio 9, 2024
**Versión**: 1.0
