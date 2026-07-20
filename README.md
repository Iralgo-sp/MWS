# Vehículos del hogar

Aplicación para llevar el control de todos los vehículos de la casa (bicis, motos,
coches): datos de compra, mantenimiento/reparaciones y seguros.

## Stack

- **Backend**: Node.js + Fastify + Prisma + SQLite (`backend/`)
- **Frontend**: React + Vite + TypeScript + Tailwind CSS, como PWA instalable (`frontend/`)

Todo corre en local por ahora (sin nube, sin Cloudflare ni nada que configurar). El día
que se quiera acceder desde fuera de casa, el mismo backend se puede desplegar tal cual
en cualquier hosting (Railway, Render, Fly.io, un VPS...) cambiando solo la variable
`DATABASE_URL` (y, si se quiere más capacidad, pasando de SQLite a Postgres con Prisma).

## Arrancar en local

Primera vez:

```bash
cd backend
npm install
npx prisma migrate dev   # crea la base SQLite (backend/prisma/dev.db)
npm run dev               # backend en http://localhost:3001
```

En otra terminal:

```bash
cd frontend
npm install
npm run dev               # frontend en http://localhost:5173
```

Abre `http://localhost:5173` en el navegador del PC.

## Acceder desde el móvil (misma WiFi, sin nube)

Con ambos servidores arrancados como arriba (ya escuchan en `0.0.0.0`, no solo en
`localhost`):

1. Averigua la IP local del PC: `ipconfig` (Windows) y busca la `Dirección IPv4` de tu
   adaptador WiFi/Ethernet (algo como `192.168.x.x`).
2. Desde el móvil, conectado a la misma red WiFi, abre en el navegador:
   `http://<IP-DEL-PC>:5173`
3. En el menú del navegador puedes elegir "Añadir a pantalla de inicio" para instalarla
   como app (PWA).

Mientras el PC esté encendido y ambos `npm run dev` corriendo, cualquier dispositivo de
la misma WiFi puede usar la app con los mismos datos.

## Estructura

```
backend/
  prisma/schema.prisma   # modelos: Vehicle, MaintenanceRecord, InsurancePolicy
  src/index.ts            # servidor Fastify
  src/routes/              # endpoints REST
frontend/
  src/pages/                # listado, detalle, formulario de vehículo
  src/components/           # layout, secciones de mantenimiento/seguro
  src/api/                  # cliente HTTP + tipos
```

## Próximos pasos posibles

- Desplegar el backend en un hosting gratuito y apuntar el frontend ahí cuando se quiera
  acceso fuera de casa (sin cambiar el código, solo configuración).
- Fotos/documentos adjuntos por vehículo.
- Recordatorios de renovación de seguro / ITV.
