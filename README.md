# SpiderWeb ARG - Programación, Diseño y Creatividad Digital

Web principal de **SpiderWeb ARG**, agencia digital especializada en desarrollo de software, diseño web, marketing digital, diseño gráfico, edición de video y gestión de redes de marca. Desde Mendoza, Argentina, al mundo.

---

## 🌟 Características Principales

### 🖥️ Frontend & Experiencia de Usuario
- **Diseño Moderno & Táctico (HUD / Cyberpunk)**: Estética visual con overlays de scanlines, efectos de esquinas HUD, transiciones fluidas y micro-animaciones.
- **Hero Interactivo**: Animación de entrada splash, efecto typewriter dinámico y métricas clave de la agencia.
- **Sección de Servicios**: Presentación interactiva de los 4 pilares:
  - Programación Web & Software a medida
  - Diseño Gráfico & Identidad Visual
  - Edición de Video & Publicidad
  - Redes de Marca & Community Management
- **Galería de Diseños y Publicidad**: Renderizado dinámico con modal emergente para previsualizar detalles y publicaciones de clientes.
- **Proyectos Destacados**: Galería interactiva con slider y scrollbar personalizado sincronizado.
- **Carrusel Infinito de Clientes / Sponsors**: Visualización continua y automática de marcas y sponsors.
- **Sección FAQ Interactiva**: Acordeón dinámico de preguntas frecuentes.
- **Formulario de Contacto**: Integrado con backend vía Nodemailer para envío directo de correos electrónicos.
- **Personalización de Tema**: Selector de color de acento dinámico (Hue slider y aleatorio) y soporte de temas con `theme.js`.
- **Diseño 100% Responsive**: Optimizado para cualquier resolución de pantalla (móviles, tablets y escritorio).

### ⚙️ Backend & Panel de Administración
- **Panel de Control `/admin`**: Interfaz de administración segura protegida mediante autenticación **JWT** y cookies `httpOnly`.
- **Gestión CRUD Completa**:
  - 📁 **Proyectos**: Alta, edición, eliminación y subida de capturas.
  - 🤝 **Sponsors / Clientes**: Administración de logos y enlaces.
  - 🎨 **Diseños**: Carga y gestión de piezas gráficas y logos de clientes.
- **Integración con SPIDERWEB ARG API**:
  - Almacenamiento en base de datos SQL relacional.
  - Carga y borrado de archivos multimedia mediante Spider Storage y proxy de imágenes `/api/images/:id`.
- **API REST**: Endpoints públicos y protegidos para el consumo de datos y formularios.

---

## 🛠️ Tecnologías

### Frontend
- **HTML5 Semántico** & **CSS3** (Variables CSS, Flexbox, CSS Grid, Animaciones avanzadas)
- **JavaScript Moderno (ES6+)** (Fetch API, Intersection Observer, manipulación de DOM)
- **Font Awesome 6** & **Google Fonts** (Barlow Condensed, Share Tech Mono, Inter)

### Backend
- **Node.js** & **Express.js 5**
- **SPIDERWEB ARG API** (Consultas SQL y Storage para imágenes)
- **JWT (JSON Web Tokens)** & **Cookie-Parser** (Autenticación y sesiones seguras)
- **Multer** & **Form-Data** (Procesamiento de archivos en memoria y subida a storage)
- **Nodemailer** (Envío automatizado de mensajes de contacto)
- **CORS** & **Dotenv**

---

## 📂 Estructura del Proyecto

```
SpiderWebTest/
├── admin/                     # Panel de administración
│   ├── index.html             # Dashboard de gestión CRUD
│   ├── login.html             # Vista de autenticación
│   └── js/                    # Lógica del panel de administración
├── lib/
│   └── spider.js              # Cliente de conexión con SPIDERWEB ARG API (SQL + Storage)
├── public/                    # Archivos estáticos y assets del frontend
│   ├── assets/
│   │   ├── css/               # Hojas de estilo (styletest.css, responsive.css)
│   │   ├── data/              # Datos de respaldo / configuración
│   │   ├── font/              # Tipografías locales
│   │   ├── img/               # Recursos visuales, capturas y logos
│   │   └── js/                # Lógica del cliente (script.js)
│   └── theme.js               # Motor de personalización de tema y colores
├── index.html                 # Página principal de SpiderWeb ARG
├── indextest.html             # Versión de pruebas / desarrollo
├── server.js                  # Servidor Express, rutas de API y autenticación
├── package.json               # Dependencias y scripts del proyecto
├── vercel.json                # Configuración de despliegue en Vercel
└── README.md                  # Documentación del proyecto
```

---

## 🌐 Ecosistema SpiderWeb ARG

- 🔗 **Sitio Web Oficial**: [SpiderWeb ARG](https://francocalegari.github.io/SpiderWebTest/)
- ⚙️ **SPIDERWEB ARG API**: [spiderwebargapi.com.ar](https://spiderwebargapi.com.ar/)
- 👥 **Comunidad SpiderWeb ARG**: [spiderwebarg-community.vercel.app](https://spiderwebarg-community.vercel.app/)

---

## 🚀 Instalación y Ejecución Local

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/FrancoCalegari/SpiderWebTest.git
   cd SpiderWebTest
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno (`.env`):**
   Crea un archivo `.env` en la raíz del proyecto con la siguiente estructura:
   ```env
   PORT=3000
   SESSION_SECRET=tu_secreto_jwt
   ADMIN_USER=tu_usuario_admin
   ADMIN_PASSWORD=tu_password_admin

   # SPIDERWEB ARG API
   SPIDER_API_URL=https://api.spiderwebarg.com/api/v1
   SPIDER_API_KEY=tu_spider_api_key
   SPIDER_DB_NAME=tu_base_de_datos
   SPIDER_STORAGE_PROJECT_ID=tu_project_id

   # Configuración de Correo (Nodemailer)
   SMTP_HOST=smtp.tuservidor.com
   SMTP_PORT=465
   SMTP_USER=tu_correo@dominio.com
   SMTP_PASS=tu_contraseña_smtp
   ADMIN_MAIL=correo_destino@dominio.com
   ```

4. **Iniciar el servidor:**
   ```bash
   npm start
   ```
   El sitio estará disponible en `http://localhost:3000` y el panel de administración en `http://localhost:3000/admin`.

---

## 👥 Equipo Spider-Web ARG

- **Franco Calegari**: Desarrollo Web y Software (Python, JS, SPIDERWEB ARG API).
- **Gabriel Reina**: Desarrollo Web y Software (Python, JS, SPIDERWEB ARG API).
