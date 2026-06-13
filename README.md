# Visor GIS Territorial — Atlas

Plataforma web de visualización geoespacial territorial con tres niveles de acceso, diseñada para comercializar el acceso a capas temáticas organizadas por categoría.

---

## Características

- Mapa interactivo (MapLibre GL JS) con capas GeoJSON por categoría temática
- Panel lateral izquierdo colapsable con toggle de capas por categoría
- Panel derecho de estadísticas al hacer clic en cualquier elemento del mapa
- 3 roles de acceso: **Superadmin**, **Admin (pagado)** y **Viewer**
- Autenticación JWT con expiración de 8 horas
- Watermark con email del usuario sobre el panel de estadísticas
- Subida de capas GeoJSON directamente desde el panel de administración

---

## Roles de usuario

| Rol | Descripción | Acceso |
|---|---|---|
| **Superadmin** | Dueño del sistema (tú) | Gestión total de usuarios, categorías y capas |
| **Admin** | Cliente pagado | Sube y gestiona capas en sus categorías asignadas |
| **Viewer** | Usuario final | Solo visualiza el mapa y alterna capas |

---

## Estructura del proyecto

```
visor-gis-atlas/
├── backend/                    # API Node.js + Express
│   ├── db/
│   │   ├── database.js         # Conexión lowdb (JSON)
│   │   ├── init.js             # Seed inicial del superadmin
│   │   └── data.json           # Base de datos (generada al iniciar, no en git)
│   ├── middleware/
│   │   └── authMiddleware.js   # Verificación JWT y roles
│   ├── routes/
│   │   ├── auth.js             # Login y cambio de contraseña
│   │   ├── users.js            # CRUD de usuarios (solo superadmin)
│   │   └── layers.js           # Lectura, subida y eliminación de capas
│   ├── .env                    # Variables de entorno (no en git)
│   ├── .env.example            # Plantilla de variables
│   └── server.js               # Entrada principal del backend
│
├── frontend/                   # React + Vite
│   └── src/
│       ├── context/
│       │   └── AuthContext.jsx # Estado global de autenticación
│       ├── pages/
│       │   ├── Login.jsx       # Página de login
│       │   ├── Viewer.jsx      # Visor principal (todos los roles)
│       │   ├── AdminPanel.jsx  # Gestión de capas (admin + superadmin)
│       │   └── SuperAdmin.jsx  # Gestión de usuarios (solo superadmin)
│       ├── components/
│       │   ├── Map.jsx         # Mapa MapLibre GL JS
│       │   ├── Navbar.jsx      # Barra superior con roles y navegación
│       │   ├── Sidebar.jsx     # Panel izquierdo de capas por categoría
│       │   └── StatsPanel.jsx  # Panel derecho de atributos del elemento
│       └── styles/             # CSS por componente
│
└── data/
    └── layers/                 # Carpetas por categoría temática
        ├── educacion/          # *.geojson de establecimientos educacionales
        ├── seguridad/          # *.geojson de comisarías, cuarteles, etc.
        ├── salud/              # *.geojson de hospitales, CESFAM, etc.
        ├── riesgos/            # *.geojson de zonas de riesgo (polígonos)
        └── clima/              # *.geojson de estaciones meteorológicas
```

---

## Instalación y uso local

### Requisitos previos
- Node.js 18 o superior
- Git

### 1. Clonar el repositorio

```bash
git clone git@github.com:dannlebeau/visor-gis-atlas.git
cd visor-gis-atlas
```

### 2. Configurar el backend

```bash
cd backend
cp .env.example .env       # Edita JWT_SECRET con una clave segura
npm install
node server.js
```

El servidor arranca en `http://localhost:3001` y crea automáticamente el superadmin en el primer inicio.

**Credenciales iniciales:**
```
Email:      superadmin@visor-gis.com
Contraseña: Admin1234!
```
> Cambia la contraseña desde el panel de superadmin después del primer login.

### 3. Configurar el frontend

```bash
cd frontend
npm install
npm run dev
```

El visor queda disponible en `http://localhost:5173`.

---

## Agregar capas

1. Coloca el archivo `.geojson` en la carpeta correspondiente dentro de `data/layers/<categoria>/`
2. El sistema lo detecta automáticamente al recargar la página
3. Opcionalmente, sube la capa desde el **Panel Admin** para configurar nombre, color y visibilidad por defecto

### Categorías disponibles

| Carpeta | Icono | Tipo de datos sugerido |
|---|---|---|
| `educacion/` | 🎓 | Colegios, universidades, jardines infantiles |
| `seguridad/` | 🚔 | Comisarías, cuarteles PDI, postas policiales |
| `salud/` | 🏥 | Hospitales, CESFAM, clínicas |
| `riesgos/` | ⚠️ | Zonas de inundación, fallas sísmicas, deslizamientos |
| `clima/` | 🌤️ | Estaciones meteorológicas, isoyetas, isotermas |

---

## Panel de estadísticas

Al hacer clic en cualquier elemento del mapa, el panel derecho muestra automáticamente los atributos del GeoJSON. No requiere configuración: si el archivo tiene propiedades como `matriculados`, `camas` o `efectivos`, aparecen formateadas.

Incluye un **watermark** con el email del usuario para desincentivar capturas de pantalla y rastrear filtraciones.

---

## API del backend

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/api/auth/login` | Público | Login y obtención de token |
| GET | `/api/layers/categories` | Todos | Categorías y capas accesibles |
| GET | `/api/layers/:cat/:file` | Todos | Contenido GeoJSON de una capa |
| POST | `/api/layers/:cat/upload` | Admin+ | Subir nueva capa |
| PATCH | `/api/layers/:cat/:file` | Admin+ | Actualizar metadata de capa |
| DELETE | `/api/layers/:cat/:file` | Admin+ | Eliminar capa |
| GET | `/api/users` | Superadmin | Listar usuarios |
| POST | `/api/users` | Superadmin | Crear usuario |
| PATCH | `/api/users/:id` | Superadmin | Editar usuario / habilitar-deshabilitar |
| DELETE | `/api/users/:id` | Superadmin | Eliminar usuario |

---

## Variables de entorno

```env
JWT_SECRET=tu_clave_secreta_muy_larga_y_aleatoria
PORT=3001
LAYERS_PATH=../data/layers
```

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Mapa | MapLibre GL JS |
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| Base de datos | lowdb (JSON embebido, sin servidor) |
| Autenticación | JWT (jsonwebtoken + bcryptjs) |
| Subida de archivos | Multer |

---

## Modelo de negocio

- Cada usuario **Admin** paga por acceso a categorías específicas
- El **Superadmin** activa/desactiva usuarios y asigna qué categorías puede ver cada uno
- Los datos nunca se exponen directamente: todo pasa por la API autenticada con token
- Para migrar a PostgreSQL + PostGIS en producción, reemplazar `lowdb` por `pg` + `better-sqlite3`

---

## Licencia

Uso privado — todos los derechos reservados.
