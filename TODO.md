# TODO - Mejoras de Seguridad y Arquitectura

## 🚨 CRÍTICO - Arreglar ANTES de producción

### 1. Crear endpoints protegidos para n8n
**Ubicación:** `services/backend/src/routes/n8n.js` (nuevo archivo)

- [ ] Crear middleware `n8nAuth` que valide `x-api-key` header
- [ ] Endpoint `POST /n8n/job-offers` para crear ofertas
- [ ] Endpoint `POST /n8n/companies` para crear empresas
- [ ] Endpoint `GET /n8n/matching-users/:jobOfferId` para obtener usuarios que coincidan
- [ ] Endpoint `POST /n8n/notify-user` para registrar notificaciones enviadas
- [ ] Añadir `N8N_API_KEY` a secrets de Docker
- [ ] Registrar rutas en `app.js` con prefix `/n8n`

**Ejemplo middleware:**
```javascript
const n8nAuth = async (request, reply) => {
  const apiKey = request.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.N8N_API_KEY) {
    throw new HttpError(401, 'UNAUTHORIZED', 'Invalid API key.');
  }
};
```

### 2. Validación de email format
**En `services/backend/src/schemas/auth.js`:**

- [ ] Añadir `format: 'email'` a campo email en registerSchema
- [ ] Añadir `maxLength: 255` para prevenir DoS
- [ ] Considerar regex adicional si es necesario

## ⚠️ ALTA PRIORIDAD - Seguridad adicional

### 4. Implementar rate limiting
- [ ] Instalar: `npm install @fastify/rate-limit`
- [ ] Configurar en `app.js`:
  - Límite global: 100 requests/minuto
  - Límite para `/auth/login`: 5 requests/minuto
  - Límite para `/auth/register`: 10 requests/hora
- [ ] Añadir variables de entorno para configuración

### 5. Configurar CORS
- [ ] Instalar: `npm install @fastify/cors`
- [ ] Configurar origin permitidos en `app.js`
- [ ] Añadir `FRONTEND_URL` a variables de entorno
- [ ] Habilitar `credentials: true` para cookies

### 6. Mejorar logs de seguridad
- [ ] Log de intentos de login fallidos
- [ ] Log de creación/modificación de recursos sensibles
- [ ] Log de accesos denegados (403/401)
- [ ] Considerar integración con sistema de alertas

## 🔧 MEJORAS RECOMENDADAS


### 8. Índices adicionales para performance
- [ ] `CREATE INDEX ix_job_offers_status_published ON job_offers(status, published_at DESC)` para queries de n8n
- [ ] `CREATE INDEX ix_applications_user_created ON applications(user_id, created_at DESC)` para timeline
- [ ] Analizar query patterns y añadir según necesidad

### 9. Validaciones adicionales en schemas
- [ ] Validar URLs con format `uri` en campos url
- [ ] Añadir `minLength` a campos requeridos
- [ ] Validar rangos de salarios (min < max)
- [ ] Validar enum values en campos de texto libre

### 10. Mejorar manejo de transacciones
- [ ] Usar transacciones para operaciones multi-tabla
- [ ] Especialmente en creación de `application` + `application_cv_versions`
- [ ] Wrapper de transacciones en `services/crud.js`

## 🏗️ ARQUITECTURA CON N8N

### 11. Integrar n8n en docker-compose
- [ ] Añadir servicio `n8n` en `docker-compose.yml`
- [ ] Configurar persistencia de workflows (`n8n_data` volume)
- [ ] Configurar variables de entorno:
  - `N8N_BASIC_AUTH_ACTIVE=true`
  - `N8N_BASIC_AUTH_USER`
  - `N8N_BASIC_AUTH_PASSWORD`
  - `WEBHOOK_URL` apuntando al backend
- [ ] Exponer puerto 5678 solo en dev

### 12. Crear workflows base en n8n
- [ ] Workflow: Scraping de InfoJobs cada 15 minutos
- [ ] Workflow: Scraping de LinkedIn (si API disponible)
- [ ] Workflow: Matching de ofertas → usuarios
- [ ] Workflow: Generación de CV con OpenAI
- [ ] Workflow: Notificación a usuarios (email/webhook)
- [ ] Exportar workflows a `services/n8n/workflows/` para versionado

### 13. Endpoints adicionales para UI
**Backend necesita exponer:**
- [ ] `GET /api/job-offers` (público, con paginación y filtros)
- [ ] `GET /api/job-offers/:id` (público, detalles completos)
- [ ] `GET /api/applications/:id/cv-version` (obtener CV usado)
- [ ] `POST /api/applications/:id/approve` (shortcut para cambiar status)
- [ ] `GET /api/dashboard/stats` (resumen para usuario: aplicaciones, ofertas nuevas)

## 📝 DOCUMENTACIÓN

### 14. Documentar API
- [ ] Crear `services/backend/API.md` con endpoints disponibles
- [ ] Ejemplos de requests/responses
- [ ] Documentar códigos de error
- [ ] Considerar Swagger/OpenAPI si el proyecto crece

### 15. Actualizar CRUD_ARCHITECTURE.md
- [ ] Documentar sistema de ownership types
- [ ] Explicar `createGuard` y `existsJoin`
- [ ] Añadir diagramas de flujo para n8n integration
- [ ] Ejemplos de uso de endpoints `/n8n/*`

## 🧪 TESTING

### 16. Tests de seguridad
- [ ] Test: Usuario no puede modificar ofertas de trabajo
- [ ] Test: Usuario no puede acceder a applications de otros
- [ ] Test: createGuard previene creación de recursos ajenos
- [ ] Test: Rate limiting funciona correctamente
- [ ] Test: n8n API key es requerida

### 17. Tests de integración
- [ ] Test: Flujo completo de aplicación (crear → aprobar → enviar)
- [ ] Test: Creación de CV version ligada a application
- [ ] Test: Soft delete de applications
- [ ] Test: Paginación y filtros en listings

## 🔐 SECRETS Y CONFIGURACIÓN

### 18. Añadir secrets faltantes
**En `secrets/`:**
- [ ] Crear `n8n_api_key.txt`
- [ ] Crear `n8n_encryption_key.txt`
- [ ] Crear `openai_api_key.txt` (para n8n workflows)

**En docker-compose.yml:**
- [ ] Registrar nuevos secrets
- [ ] Pasar a backend como `N8N_API_KEY_FILE`
- [ ] Pasar a n8n como variables de entorno

### 19. Variables de entorno adicionales
**En `.env` (crear si no existe):**
- [ ] `FRONTEND_URL=http://localhost:3000`
- [ ] `RATE_LIMIT_MAX=100`
- [ ] `RATE_LIMIT_WINDOW=60000`
- [ ] `LOG_LEVEL=info`
- [ ] `NODE_ENV=development`

## 📊 MÉTRICAS Y MONITOREO

### 20. Logging estructurado
- [ ] Configurar pretty printing solo en development
- [ ] JSON logs en producción
- [ ] Context en cada log (userId, requestId)

### 21. Health checks mejorados
- [ ] `/health` endpoint con checks de DB connection
- [ ] `/health/ready` para Kubernetes readiness
- [ ] `/health/live` para Kubernetes liveness

## 🚀 ANTES DE DEPLOY A PRODUCCIÓN

### Checklist final:
- [ ] Todos los items CRÍTICOS completados
- [ ] Rate limiting configurado
- [ ] CORS configurado con origin específico
- [ ] Secrets fuera del repositorio
- [ ] `SECURE_COOKIE=true` en producción
- [ ] `JWT_SECRET` con mínimo 32 caracteres random
- [ ] Logs configurados (no debug en producción)
- [ ] Database backups configurados
- [ ] SSL/TLS terminado en reverse proxy
- [ ] Documentación actualizada
