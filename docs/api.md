# Referencia de API

## 1. Convenciones

| Aspecto | Valor |
| --- | --- |
| URL local | `http://localhost:4000` |
| URL vía Docker/Nginx | `http://localhost:8080` |
| Prefijo de negocio | `/api` |
| Formato | JSON UTF-8 |
| Autenticación | `Authorization: Bearer <accessToken>` |
| Fechas | ISO 8601 UTC (`2026-10-24T15:30:00.000Z`) |
| IDs de incidente | Entero positivo; se muestran como `INC-000001` |
| IDs de usuario/comentario/actividad | UUID |

Todas las respuestas de error tienen la misma forma:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Los datos enviados no son válidos",
    "details": [
      { "field": "title", "message": "El título debe tener al menos 5 caracteres" }
    ],
    "requestId": "5c9f0b4e-6a7d-4f2e-9f11-2b7a1c3d4e5f"
  }
}
```

`requestId` también se devuelve en la cabecera `X-Request-Id`. Los errores 5xx nunca incluyen stack traces ni detalles de base de datos.

## 2. Autenticación

### `POST /api/auth/login`

Inicia sesión y emite la cookie `ih_refresh` (`HttpOnly`, `SameSite=Lax`, `Path=/api/auth`, `Secure` en producción).

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@incidenthub.dev",
  "password": "Admin123!"
}
```

Respuesta `200`:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 900,
  "user": {
    "id": "4a8b3c2d-...",
    "name": "Ana Administradora",
    "email": "admin@incidenthub.dev",
    "role": "ADMIN"
  }
}
```

Errores: `401 INVALID_CREDENTIALS`, `422 VALIDATION_ERROR`, `429 RATE_LIMITED`.

Límite: 10 intentos fallidos por IP cada 15 minutos; los logins exitosos no cuentan.

### `POST /api/auth/refresh`

Requiere la cookie `ih_refresh`. Rota el refresh token y devuelve un nuevo access token.

```http
POST /api/auth/refresh
Cookie: ih_refresh=...
```

Respuesta `200`: misma forma que login. La respuesta incluye una nueva cookie rotada.

Errores: `401 REFRESH_TOKEN_MISSING`, `401 INVALID_REFRESH_SESSION`. Si se detecta reutilización de un token ya rotado, se revoca la sesión completa.

Límite: 60 solicitudes por IP cada 15 minutos.

### `POST /api/auth/logout`

Revoca la sesión asociada a la cookie y la elimina. Es idempotente.

```http
POST /api/auth/logout
Cookie: ih_refresh=...
```

Respuesta: `204 No Content`.

### `GET /api/auth/me`

Requiere access token. Devuelve el usuario actualizado desde base de datos.

```http
GET /api/auth/me
Authorization: Bearer <accessToken>
```

Respuesta `200`:

```json
{
  "user": {
    "id": "4a8b3c2d-...",
    "name": "Ana Administradora",
    "email": "admin@incidenthub.dev",
    "role": "ADMIN"
  }
}
```

## 3. Incidentes

Todos los endpoints requieren access token. Un `REPORTER` solo puede ver y comentar incidentes reportados por él.

### `GET /api/incidents`

Lista paginada con filtros.

| Query | Tipo | Valores / límites | Por defecto |
| --- | --- | --- | --- |
| `page` | entero | 1–100000 | `1` |
| `pageSize` | entero | 1–100 | `10` |
| `search` | string | 1–120 caracteres; busca título, descripción y número `INC-...` | — |
| `status` | enum | `NEW`, `ASSIGNED`, `IN_PROGRESS`, `ON_HOLD`, `RESOLVED`, `CLOSED`, `CANCELLED` | — |
| `priority` | enum | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` | — |
| `category` | enum | `HARDWARE`, `SOFTWARE`, `NETWORK`, `ACCESS`, `EMAIL`, `OTHER` | — |
| `assigneeId` | UUID | Agente asignado | — |
| `unassigned` | boolean | `true`/`false`; no se puede combinar con `assigneeId` | — |
| `mine` | boolean | Solo asignados al usuario actual | — |
| `sort` | enum | `newest`, `oldest`, `priority` | `newest` |

Respuesta `200`:

```json
{
  "items": [
    {
      "id": 1,
      "ticketNumber": "INC-000001",
      "title": "No puedo acceder al ERP desde la VPN",
      "description": "Al conectarme por VPN...",
      "category": "ACCESS",
      "impact": "CRITICAL",
      "urgency": "HIGH",
      "priority": "CRITICAL",
      "status": "IN_PROGRESS",
      "reporter": {
        "id": "uuid",
        "name": "Andrés Usuario",
        "email": "andres.usuario@incidenthub.dev",
        "role": "REPORTER"
      },
      "assignee": {
        "id": "uuid",
        "name": "Diego Agente",
        "email": "diego.agente@incidenthub.dev",
        "role": "AGENT"
      },
      "slaDueAt": "2026-10-24T19:00:00.000Z",
      "slaStatus": "AT_RISK",
      "firstResponseAt": "2026-10-24T15:20:00.000Z",
      "resolvedAt": null,
      "closedAt": null,
      "createdAt": "2026-10-24T15:00:00.000Z",
      "updatedAt": "2026-10-24T15:20:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 31,
    "totalPages": 4
  }
}
```

`totalPages` es `0` cuando no hay resultados.

### `POST /api/incidents`

Crea un incidente. La prioridad y el SLA se calculan en el servidor.

```http
POST /api/incidents
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "title": "La impresora de facturación no responde",
  "description": "La impresora de la oficina principal no imprime desde esta mañana.",
  "category": "HARDWARE",
  "impact": "HIGH",
  "urgency": "MEDIUM"
}
```

Validaciones: título 5–200, descripción 10–10000, enums obligatorios, objeto estricto.

Respuesta: `201` con el detalle del incidente (misma forma que `GET /api/incidents/:id`).

### `GET /api/incidents/:id`

Devuelve el detalle con comentarios, actividades y transiciones permitidas.

```json
{
  "id": 1,
  "ticketNumber": "INC-000001",
  "...": "campos de IncidentResponse",
  "comments": [
    {
      "id": "uuid",
      "content": "Ya validé que el usuario existe.",
      "isInternal": false,
      "createdAt": "2026-10-24T15:10:00.000Z",
      "author": { "id": "uuid", "name": "Diego Agente", "email": "...", "role": "AGENT" }
    }
  ],
  "activities": [
    {
      "id": "uuid",
      "action": "STATUS_CHANGED",
      "detail": "Incidente en revisión",
      "fromStatus": "ASSIGNED",
      "toStatus": "IN_PROGRESS",
      "createdAt": "2026-10-24T15:15:00.000Z",
      "actor": { "id": "uuid", "name": "Diego Agente", "email": "...", "role": "AGENT" }
    }
  ],
  "allowedTransitions": ["ON_HOLD", "RESOLVED", "CANCELLED"]
}
```

Los comentarios internos se omiten para `REPORTER`. `allowedTransitions` es `[]` para reportantes.

Errores: `404 INCIDENT_NOT_FOUND` si no existe o está fuera del alcance del usuario.

### `PATCH /api/incidents/:id`

Actualiza título, descripción, categoría, impacto o urgencia. Debe enviarse al menos un campo.

```json
{
  "title": "ERP inaccesible desde VPN (actualizado)",
  "urgency": "HIGH"
}
```

Reglas:

- `ADMIN`/`AGENT`: pueden editar cualquier incidente visible.
- `REPORTER`: solo incidentes en estado `NEW` y no puede modificar impacto ni urgencia.
- Si cambia impacto o urgencia, se recalcula prioridad y SLA desde `createdAt`.

Respuesta: `200` con el detalle actualizado.

### `PATCH /api/incidents/:id/status`

Solo `ADMIN` y `AGENT`.

```json
{
  "status": "RESOLVED",
  "note": "Se restableció el acceso y se validó con el usuario."
}
```

`note` es opcional (1–500). La transición se valida contra la máquina de estados.

Errores: `409 INVALID_STATUS_TRANSITION`, `404 INCIDENT_NOT_FOUND`, `403 FORBIDDEN`.

Respuesta: `200` con el detalle actualizado.

### `PATCH /api/incidents/:id/assign`

Solo `ADMIN` y `AGENT`.

```json
{
  "assigneeId": "uuid-del-agente",
  "note": "Asignado por turno de mañana"
}
```

Reglas:

- `ADMIN` puede asignar a cualquier agente o admin activo.
- `AGENT` solo puede asignarse a sí mismo.
- No se puede asignar un incidente `RESOLVED`, `CLOSED` o `CANCELLED`.
- Si el incidente está en `NEW`, pasa a `ASSIGNED`.
- Se registra `firstResponseAt` si aún no existía.

Errores: `400 INVALID_ASSIGNEE`, `403 FORBIDDEN`, `409 INCIDENT_NOT_ASSIGNABLE`, `409 ALREADY_ASSIGNED`.

### `POST /api/incidents/:id/comments`

Agrega un comentario público o una nota interna.

```json
{
  "content": "Se aplicó el parche en el servidor de aplicaciones.",
  "isInternal": true
}
```

Reglas:

- `content`: 1–2000 caracteres.
- `isInternal`: por defecto `false`.
- Solo `ADMIN`/`AGENT` pueden crear notas internas.
- El primer comentario del equipo actualiza `firstResponseAt`.
- Se registra una actividad `COMMENTED`.

Respuesta: `201`:

```json
{
  "comment": {
    "id": "uuid",
    "content": "Se aplicó el parche...",
    "isInternal": true,
    "createdAt": "2026-10-24T16:00:00.000Z",
    "author": { "id": "uuid", "name": "Diego Agente", "email": "...", "role": "AGENT" }
  }
}
```

## 4. Dashboard

### `GET /api/dashboard`

Requiere access token. `ADMIN`/`AGENT` ven alcance global; `REPORTER` solo sus incidentes.

```json
{
  "generatedAt": "2026-10-24T16:00:00.000Z",
  "scope": "GLOBAL",
  "kpis": {
    "totalIncidents": 31,
    "openIncidents": 18,
    "unassignedIncidents": 5,
    "inProgressIncidents": 7,
    "slaAtRisk": 3,
    "slaBreached": 2,
    "resolvedLast7Days": 9,
    "averageResolutionHours": 6.4,
    "slaComplianceRate": 88.9
  },
  "statusDistribution": [{ "status": "NEW", "count": 5 }],
  "priorityDistribution": [{ "priority": "CRITICAL", "count": 4 }],
  "categoryDistribution": [{ "category": "NETWORK", "count": 8 }],
  "trend": [{ "date": "2026-10-24", "created": 4, "resolved": 2 }],
  "recentIncidents": []
}
```

`averageResolutionHours` y `slaComplianceRate` son `null` si no hay incidentes resueltos.

## 5. Usuarios

### `GET /api/users/agents`

Devuelve usuarios activos con rol `ADMIN` o `AGENT`, ordenados por rol y nombre. Se usa para el selector de asignación.

```json
{
  "users": [
    {
      "id": "uuid",
      "name": "Diego Agente",
      "email": "diego.agente@incidenthub.dev",
      "role": "AGENT"
    }
  ]
}
```

## 6. Health checks

| Endpoint | Uso | Respuesta |
| --- | --- | --- |
| `GET /health` | Alias de liveness | `200 { "status": "ok", "uptimeSeconds": 12, "timestamp": "..." }` |
| `GET /health/live` | Liveness | Igual |
| `GET /health/ready` | Readiness; consulta PostgreSQL | `200 { "status": "ready", "checks": { "database": "up" } }` o `503` |
| `GET /api/health/...` | Alias bajo `/api` | Igual |

Los health checks no se registran en el log de acceso para evitar ruido.

## 7. Códigos de error

| HTTP | Código | Significado |
| --- | --- | --- |
| 400 | `BAD_REQUEST` | Solicitud inválida |
| 400 | `INVALID_JSON` | JSON malformado |
| 400 | `INVALID_ASSIGNEE` | Agente inexistente o inactivo |
| 400 | `DATABASE_REQUEST_ERROR` | Operación de base de datos no válida |
| 401 | `UNAUTHORIZED` | Falta token o es inválido |
| 401 | `INVALID_ACCESS_TOKEN` | Access token inválido/expirado |
| 401 | `INVALID_CREDENTIALS` | Correo o contraseña incorrectos |
| 401 | `REFRESH_TOKEN_MISSING` | No hay cookie de refresh |
| 401 | `INVALID_REFRESH_SESSION` | Sesión revocada, expirada o reutilizada |
| 401 | `ACCOUNT_UNAVAILABLE` | Cuenta inactiva |
| 403 | `FORBIDDEN` | Rol sin permisos |
| 403 | `CORS_ORIGIN_DENIED` | Origen no permitido |
| 404 | `NOT_FOUND` | Recurso genérico inexistente |
| 404 | `INCIDENT_NOT_FOUND` | Incidente inexistente o fuera de alcance |
| 409 | `CONFLICT` | Conflicto genérico |
| 409 | `RESOURCE_CONFLICT` | Restricción única de base de datos |
| 409 | `INVALID_STATUS_TRANSITION` | Transición de estado no permitida |
| 409 | `INCIDENT_NOT_EDITABLE` | Reportante intenta editar un incidente no editable |
| 409 | `INCIDENT_NOT_ASSIGNABLE` | Incidente finalizado/cancelado |
| 409 | `ALREADY_ASSIGNED` | Ya está asignado a ese agente |
| 422 | `VALIDATION_ERROR` | Body, params o query inválidos |
| 429 | `RATE_LIMITED` | Límite de solicitudes excedido |
| 500 | `INTERNAL_SERVER_ERROR` | Error no controlado |

## 8. Ejemplo de flujo con `curl`

```bash
# 1. Login y almacenamiento de cookie
curl -sS -c cookies.txt -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@incidenthub.dev","password":"Admin123!"}' > login.json

TOKEN=$(jq -r '.accessToken' login.json)

# 2. Crear incidente
curl -sS -X POST http://localhost:8080/api/incidents \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"title":"VPN intermitente","description":"La VPN se desconecta cada 10 minutos.","category":"NETWORK","impact":"HIGH","urgency":"HIGH"}'

# 3. Listar incidentes abiertos
curl -sS "http://localhost:8080/api/incidents?status=NEW&sort=priority" \
  -H "Authorization: Bearer $TOKEN"

# 4. Rotar refresh token
curl -sS -b cookies.txt -c cookies.txt -X POST http://localhost:8080/api/auth/refresh > refresh.json
```

## 9. Rate limits

| Ámbito | Ventana | Límite |
| --- | --- | --- |
| API global | 15 min | 600 solicitudes/IP |
| Login | 15 min | 10 fallos/IP |
| Refresh | 15 min | 60 solicitudes/IP |

Los límites se omiten en `NODE_ENV=test` para no interferir con las suites. En despliegues con varias réplicas se debe usar un store compartido.
