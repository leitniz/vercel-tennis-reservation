# 🎾 Tennis Reservation - Vercel Template

Sistema automatizado de reservas para Nacional Club Social.

## 📦 Contenido

Este template incluye todo lo necesario para deployar con Vercel:

```
vercel-template/
├── api/
│   └── reserve.js      # Función serverless
├── vercel.json         # Configuración de Vercel
├── package.json        # Dependencias (ninguna)
└── README.md           # Esta guía
```

## 🚀 Deploy Rápido

### Método 1: Vercel CLI (3 minutos)

```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Ir a la carpeta
cd vercel-template

# 4. Deploy
vercel --prod
```

### Método 2: Vercel Dashboard (5 minutos)

1. Ir a https://vercel.com/new
2. Arrastrar la carpeta `vercel-template`
3. Click "Deploy"

## ⚙️ Configurar Variables de Entorno

**DESPUÉS del deploy:**

1. Vercel Dashboard → Tu proyecto → Settings → Environment Variables
2. Agregar:
   - `EMAIL` = tu_email@nacionalclub.uy
   - `PASSWORD` = tu_contraseña
   - `GUEST_ID` = 12345678
3. Redeploy

## 🧪 Probar

```bash
curl https://tu-proyecto.vercel.app/api/reserve?action=CHECK_SLOTS&dayOfWeek=1
```

## ⏰ Configurar cron-job.org

1. Ir a https://console.cron-job.org/
2. Crear cron job
3. URL: `https://tu-proyecto.vercel.app/api/reserve`
4. Method: POST
5. Body:
```json
{
  "action": "AUTO_RESERVE",
  "dayOfWeek": "1",
  "daysAhead": "7",
  "preferredTimes": "19:00,18:00"
}
```
6. Schedule: `0 0 * * 1`

## 📚 Documentación Completa

Ver `VERCEL_SETUP_COMPLETE.md` para guía detallada.

## ✅ Eso es Todo

Sin dependencias, sin compilación, sin configuración compleja.
Solo deploy y funciona.
