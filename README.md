# 🎾 Tennis Reservation - Vercel

## 🚀 Deploy

### Método 1: Vercel CLI

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

## 🧪 Test

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

