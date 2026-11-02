# Guía Paso a Paso para Desplegar el ERP en la Nube ☁️

Esta guía te permitirá desplegar el ERP para que el **administrador** y el **empleado** puedan trabajar simultáneamente desde cualquier ciudad del mundo a través de Internet con una URL pública y segura (HTTPS).

---

## 🌟 Arquitectura en la Nube

```text
┌─────────────────────────────────┐        ┌─────────────────────────────────┐
│     EMPLEADO (Ciudad A)         │        │    ADMINISTRADOR (Ciudad B)     │
│   Navegador / PC / Tablet       │        │     Navegador / PC / Tablet     │
│  empleado@empresa.com           │        │      admin@empresa.com          │
└────────────────┬────────────────┘        └────────────────┬────────────────┘
                 │                                          │
                 ▼                                          ▼
        ┌────────────────────────────────────────────────────────────┐
        │        FRONTEND (Vercel / Render / Netlify)                │
        │        URL: https://mi-erp.onrender.com                    │
        └─────────────────────────────┬──────────────────────────────┘
                                      │
                                      ▼
        ┌────────────────────────────────────────────────────────────┐
        │        BACKEND API (FastAPI en Render / Railway)           │
        │        URL: https://mi-erp-api.onrender.com                │
        └─────────────────────────────┬──────────────────────────────┘
                                      │
                                      ▼
        ┌────────────────────────────────────────────────────────────┐
        │        BASE DE DATOS COMPARTIDA (PostgreSQL)               │
        │      Todos los datos sincronizados en tiempo real          │
        └────────────────────────────────────────────────────────────┘
```

---

## 🚀 Opción 1: Despliegue en Render (1-Clic con render.yaml)

El repositorio incluye el archivo de configuración `render.yaml`, que crea automáticamente el Backend, el Frontend y la Base de Datos PostgreSQL.

### Pasos:
1. Sube tu proyecto a un repositorio en **GitHub** (o GitLab).
2. Entra a [render.com](https://render.com) e inicia sesión con tu cuenta de GitHub.
3. En el panel principal, haz clic en **New +** &rarr; selecciona **Blueprint**.
4. Selecciona tu repositorio del ERP.
5. Render leerá automáticamente el archivo `render.yaml` y te mostrará los 3 servicios:
   - `erp-postgres` (Base de datos PostgreSQL en la nube).
   - `erp-odoo-backend` (API FastAPI con Python).
   - `erp-odoo-frontend` (Aplicación web React).
6. Haz clic en **Apply**.
7. En unos 3-5 minutos tendrás tu URL pública (ejemplo: `https://erp-odoo-frontend.onrender.com`).

---

## ⚡ Opción 2: Despliegue Dividido (Vercel + Railway/Supabase)

Si prefieres la máxima velocidad en frontend:
1. **Base de Datos**: Crea una base de datos PostgreSQL gratuita en [Supabase](https://supabase.com) o [Neon.tech](https://neon.tech) y copia el `Connection string` (URI).
2. **Backend**: Conecta tu repositorio a [Railway.app](https://railway.app) o Render, añade la variable de entorno `DATABASE_URL` con la URL de tu base de datos.
3. **Frontend**: Sube la carpeta `frontend` a [Vercel](https://vercel.com) y añade la variable de entorno:
   - `VITE_API_URL = https://tu-backend.railway.app/api`

---

## 👥 Credenciales de Acceso Iniciales

| Rol | Correo | Contraseña | Sede / Ciudad Demo |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@empresa.com` | `admin123` | Madrid (Central) |
| **Empleado** | `empleado@empresa.com` | `empleado123` | Barcelona (Sucursal) |

*Nota: Una vez en producción, puedes crear tantos empleados o administradores adicionales como necesites.*
