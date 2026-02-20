# 🚀 Setup Completo - Vercel + cron-job.org

Guía paso a paso para deployar tu sistema de reservas con Vercel.

---

## 📁 Estructura del Proyecto

Crea esta estructura de carpetas:

```
tennis-reservation/
├── api/
│   └── reserve.js          # Función serverless
├── vercel.json             # Configuración de Vercel
├── package.json            # Dependencias (vacío)
└── README.md               # Documentación
```

---

## 📝 Paso 1: Crear los Archivos

### Archivo: `api/reserve.js`

Copia el contenido del archivo `vercel-reserve.js` que te proporcioné.

### Archivo: `vercel.json`

```json
{
  "version": 2
}
```

### Archivo: `package.json`

```json
{
  "name": "tennis-reservation",
  "version": "1.0.0",
  "type": "module"
}
```

### Archivo: `.gitignore` (si usas Git)

```
node_modules/
.env
.vercel
```

---

## 🚀 Paso 2: Deploy a Vercel

### Opción A: Vercel CLI (Recomendado)

**1. Instalar Vercel CLI**

```bash
npm install -g vercel
```

**2. Login**

```bash
vercel login
```

**3. Deploy**

```bash
# Ir a la carpeta del proyecto
cd tennis-reservation

# Deploy
vercel

# Seguir las preguntas:
# ? Set up and deploy? Yes
# ? Which scope? Tu cuenta
# ? Link to existing project? No
# ? What's your project's name? tennis-reservation
# ? In which directory is your code located? ./

# Deploy a producción
vercel --prod
```

**4. Copiar URL**

Después del deploy, verás:

```
✅  Production: https://tennis-reservation-xxx.vercel.app
```

Copia esta URL.

### Opción B: Vercel Dashboard (Sin CLI)

**1. Ir a Vercel**

https://vercel.com/new

**2. Import Repository**

- Si usas GitHub: Conecta tu repositorio
- Si no: Click "Browse" y sube la carpeta

**3. Configure**

- Framework Preset: Other
- Root Directory: ./
- Build Command: (dejar vacío)
- Output Directory: (dejar vacío)

**4. Deploy**

Click "Deploy" y espera ~1 minuto.

**5. Copiar URL**

Tu sitio estará en: `https://tu-proyecto.vercel.app`

---

## 🔐 Paso 3: Configurar Variables de Entorno

**CRÍTICO:** Las variables se configuran DESPUÉS del deploy.

**1. Ir a Vercel Dashboard**

https://vercel.com/dashboard

**2. Seleccionar tu proyecto**

Click en "tennis-reservation"

**3. Ir a Settings**

Settings → Environment Variables

**4. Agregar Variables**

Click "Add" para cada una:

```
Name: EMAIL
Value: tu_email@nacionalclub.uy
Environments: ✓ Production ✓ Preview ✓ Development
```

```
Name: PASSWORD
Value: tu_contraseña_aquí
Environments: ✓ Production ✓ Preview ✓ Development
```

```
Name: GUEST_ID
Value: 12345678
Environments: ✓ Production ✓ Preview ✓ Development
```

**5. Redeploy**

Después de agregar las variables:
- Ir a "Deployments"
- Click en los 3 puntos (...) del último deployment
- Click "Redeploy"
- Esperar ~30 segundos

---

## 🧪 Paso 4: Probar que Funciona

### Test 1: Verificar Endpoint

Abre en el navegador:

```
https://tu-proyecto.vercel.app/api/reserve?action=CHECK_SLOTS&dayOfWeek=1
```

Deberías ver JSON con canchas disponibles.

### Test 2: Con curl

```bash
curl -X POST https://tu-proyecto.vercel.app/api/reserve \
  -H "Content-Type: application/json" \
  -d '{"action": "CHECK_SLOTS", "dayOfWeek": "1"}'
```

**Respuesta esperada:**

```json
{
  "success": true,
  "totalSlots": 12,
  "availableSlots": 5,
  "slots": [
    {
      "id": 123,
      "time": "19:00",
      "location": "Cancha de Tenis 2",
      "available": true
    }
  ],
  "logs": [...],
  "timestamp": "2026-02-20T..."
}
```

✅ Si ves esto, ¡funciona perfectamente!

❌ Si ves error, revisa:
- Variables de entorno configuradas
- Hiciste redeploy después de agregar variables
- Credenciales son correctas

---

## ⏰ Paso 5: Configurar cron-job.org

### 1. Crear Cuenta

https://console.cron-job.org/signup

### 2. Crear Cron Job

**Click "Create cronjob"**

**Información Básica:**
```
Title: Tennis Auto-Reserve Lunes 19:00
```

**Request:**
```
URL: https://tu-proyecto.vercel.app/api/reserve
Request method: POST
```

**Headers:**

Click "Add header":
```
Name: Content-Type
Value: application/json
```

**Request Body:**

```json
{
  "action": "AUTO_RESERVE",
  "dayOfWeek": "1",
  "daysAhead": "7",
  "preferredTimes": "19:00,18:00,20:00",
  "preferredLocations": "Cancha de Tenis 2,Cancha de Tenis 5"
}
```

**Schedule:**

```
Execution schedule: Advanced
Cron expression: 0 0 * * 1
```

Esto ejecuta cada Lunes a medianoche.

**Advanced Settings:**
```
Timeout: 60 seconds
Save responses: Yes ✓
```

### 3. Probar

- Click "Create"
- Click botón "▶ Run now"
- Ir a "Execution history"
- Verificar estado "Succeeded" (verde)
- Ver response con logs

---

## 📊 Configuraciones de Ejemplo

### Ejemplo 1: Lunes 19:00 (1 semana adelante)

```json
{
  "action": "AUTO_RESERVE",
  "dayOfWeek": "1",
  "daysAhead": "7",
  "preferredTimes": "19:00,18:00",
  "preferredLocations": "Cancha de Tenis 2"
}
```

Cron: `0 0 * * 1` (Lunes 00:00)

### Ejemplo 2: Miércoles 20:00

```json
{
  "action": "AUTO_RESERVE",
  "dayOfWeek": "3",
  "daysAhead": "7",
  "preferredTimes": "20:00,19:00,21:00",
  "preferredLocations": "Cancha de Tenis 5,Cancha de Tenis 2"
}
```

Cron: `0 0 * * 3` (Miércoles 00:00)

### Ejemplo 3: Check Diario

```json
{
  "action": "CHECK_SLOTS",
  "dayOfWeek": "1"
}
```

Cron: `0 6 * * *` (Diario 6 AM)

---

## 🎯 Acciones Disponibles

### 1. AUTO_RESERVE

Busca y reserva automáticamente.

**Parámetros:**
- `dayOfWeek`: 0-6 (0=Domingo, 1=Lunes, ...)
- `daysAhead`: Días de anticipación
- `preferredTimes`: Horarios separados por coma
- `preferredLocations`: Canchas separadas por coma

### 2. CHECK_SLOTS

Ver disponibilidad sin reservar.

```json
{
  "action": "CHECK_SLOTS",
  "dayOfWeek": "1"
}
```

### 3. VIEW_RESERVATIONS

Ver tus reservas actuales.

```json
{
  "action": "VIEW_RESERVATIONS"
}
```

### 4. CANCEL_RESERVATION

Cancelar una reserva.

```json
{
  "action": "CANCEL_RESERVATION",
  "reservationId": "456"
}
```

---

## 🔄 Cron Expressions

```
* * * * *
│ │ │ │ │
│ │ │ │ └─ Día semana (0-6)
│ │ │ └─── Mes (1-12)
│ │ └───── Día mes (1-31)
│ └─────── Hora (0-23)
└───────── Minuto (0-59)
```

**Ejemplos:**

| Descripción | Cron |
|-------------|------|
| Lunes 00:00 | `0 0 * * 1` |
| Miércoles 20:00 | `0 20 * * 3` |
| Viernes 18:30 | `30 18 * * 5` |
| Todos los días 6 AM | `0 6 * * *` |
| Lunes y Jueves 19:00 | `0 19 * * 1,4` |

---

## 🐛 Troubleshooting

### "Missing environment variables"

**Solución:**
1. Vercel Dashboard → Settings → Environment Variables
2. Verificar EMAIL, PASSWORD, GUEST_ID
3. Redeploy

### "401 Unauthorized"

**Solución:**
- Verificar credenciales en variables de entorno
- Probar login manual en el sitio web

### "Function timeout"

**Solución:**
- Aumentar timeout en cron-job.org (60 segundos)
- Vercel free tier: 10 segundos límite

### Logs no aparecen

**Solución:**
- Ver logs en Vercel Dashboard → Functions → reserve
- Habilitar "Save responses" en cron-job.org

---

## 📈 Monitoreo

### Ver Logs en Vercel

1. Vercel Dashboard
2. Tu proyecto
3. Functions → reserve
4. Ver invocations y logs

### Ver Ejecuciones en cron-job.org

1. cron-job.org dashboard
2. Tu cron job
3. Execution history
4. Click en ejecución para ver detalles

---

## ✅ Checklist Final

- [ ] Proyecto deployado en Vercel
- [ ] Variables de entorno configuradas (EMAIL, PASSWORD, GUEST_ID)
- [ ] Redeploy realizado después de agregar variables
- [ ] Test con curl exitoso
- [ ] Cron job creado en cron-job.org
- [ ] Method configurado como POST
- [ ] Header Content-Type agregado
- [ ] Request body configurado
- [ ] Test "Run now" exitoso
- [ ] Execution history muestra "Succeeded"

---

## 🎉 ¡Listo!

Tu sistema está funcionando. Cada semana se ejecutará automáticamente y hará las reservas.

**URLs importantes:**
- **Vercel Dashboard:** https://vercel.com/dashboard
- **cron-job.org:** https://console.cron-job.org/
- **Tu endpoint:** https://tu-proyecto.vercel.app/api/reserve

---

## 📞 Próximos Pasos

1. **Monitorea** execution history semanalmente
2. **Ajusta** horarios según disponibilidad
3. **Agrega** más días si necesitas
4. **Configura** email notifications en cron-job.org

**¡Disfruta de tus reservas automáticas! 🎾**
