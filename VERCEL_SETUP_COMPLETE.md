# 🚀 Setup Completo - Vercel + cron-job.org

## 🚀 Deploy a Vercel

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
cd vercel-tennis-reservation

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

## 🔐 Configurar Variables de Entorno

**CRÍTICO:** Las variables se configuran DESPUÉS del deploy.

**1. Ir a Vercel Dashboard**

https://vercel.com/dashboard

**2. Seleccionar tu proyecto**

Click en "vercel-tennis-reservation"

**3. Ir a Settings**

Settings → Environment Variables

**4. Agregar Variables**

Click "Add" para cada una:

```
Name: EMAIL
Value:
Environments: ✓ Production ✓ Preview ✓ Development
```

```
Name: PASSWORD
Value: 
Environments: ✓ Production ✓ Preview ✓ Development
```

```
Name: GUEST_ID
Value: 
Environments: ✓ Production ✓ Preview ✓ Development
```

**5. Redeploy**

Después de agregar las variables:
- Ir a "Deployments"
- Click en los 3 puntos (...) del último deployment
- Click "Redeploy"
- Esperar ~30 segundos

---


## ⏰ Configurar cron-job.org

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
  "daysAhead": "0",
  "preferredTimes": "19:00",
  "preferredLocations": "Cancha de Tenis 5"
}
```

## 🎯 Acciones Disponibles

### 1. AUTO_RESERVE

**Parámetros:**
- `dayOfWeek`: 0-6 (0=Domingo, 1=Lunes, ...)
- `daysAhead`: Días de anticipación
- `preferredTimes`: Horarios separados por coma
- `preferredLocations`: Canchas separadas por coma

### 2. CHECK_SLOTS

```json
{
  "action": "CHECK_SLOTS",
  "dayOfWeek": "1"
}
```

### 3. VIEW_RESERVATIONS

```json
{
  "action": "VIEW_RESERVATIONS"
}
```

### 4. CANCEL_RESERVATION

```json
{
  "action": "CANCEL_RESERVATION",
  "reservationId": "456"
}
```

**URLs importantes:**
- **Vercel Dashboard:** https://vercel.com/dashboard
- **cron-job.org:** https://console.cron-job.org/
- **Tu endpoint:** https://tu-proyecto.vercel.app/api/reserve
