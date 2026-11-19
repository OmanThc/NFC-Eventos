# PaySticker NFC — Multi-Empresa Cashless & Tasa BCV

Plataforma web POS Cashless multi-empresa con soporte Web NFC (`NTAG215`), conversión automática USD ↔ Bolívares (BCV), acceso independiente por empresa, PIN secreto para **Caja**, **Proveedores (por marca)** y **Administrador**, además de un **Panel Administrador Supremo** y sincronización en tiempo real con **Firebase Firestore** (`nfc-eventos-dbc31`).

---

## Arquitectura de Seguridad y Módulos

- **Pantalla de Inicio Multi-Empresa**: Cada negocio opera en su ambiente aislado. Los PINs nunca se muestran en la interfaz pública.
- **1. Caja (Recarga NFC)**: Protegida con **PIN de Caja**. Permite recargar stickers/pulseras en USD o Bolívares (BCV) registrando el método de pago.
- **2. Proveedores (Por Marca)**: Cada proveedor tiene su propia marca, lista de productos y **PIN numérico secreto**. Al registrar un nuevo proveedor se solicitan: nombre de marca, productos iniciales y PIN privado.
- **3. Administrador de Empresa**: Protegido con **PIN de Admin**. Permite actualizar tasa BCV, personalizar colores/marca, cambiar PINs (enmascarados), consultar el desglose de ventas por proveedor en **$ y Bs**, y exportar reportes CSV/JSON.
- **Admin Supremo**: Panel global con acceso maestro para editar textos de la pantalla de inicio, auditar movimientos y ventas de proveedores en todas las empresas, y reasignar PINs.

---

## Despliegue: GitHub + Vercel + Firebase

### 1. Subir el proyecto a GitHub
Descarga/exporta esta carpeta de proyecto (o clona el workspace) y ejecuta en tu terminal:

```bash
git init
git add .
git commit -m "feat: PaySticker NFC multi-empresa con Firebase, Caja PIN y Proveedores por marca"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/TU-REPOSITORIO.git
git push -u origin main
```

> **Seguridad:** Si necesitas crear un token personal para hacer `git push`, créalo en GitHub (`https://github.com/settings/personal-access-tokens/new`) con permiso `Contents: Read and write` sobre ese repositorio y úsalo únicamente en tu terminal local. Nunca pegues tokens privados en chats públicos ni los subas al código.

### 2. Desplegar en Vercel
1. Ingresa a [vercel.com](https://vercel.com) → **Add New Project** → selecciona tu repositorio de GitHub.
2. Verifica la configuración (ya incluida en `vercel.json`):
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Haz clic en **Deploy**. (La configuración cliente de Firebase ya viene cargada en `firebase-applet-config.json` para el proyecto `nfc-eventos-dbc31`).

### 3. Autorizar el dominio de Vercel en Firebase Authentication
Para que el inicio de sesión con Google funcione en tu URL de producción de Vercel:
1. Abre la consola de Firebase del proyecto **`nfc-eventos-dbc31`**:
   `https://console.firebase.google.com/project/nfc-eventos-dbc31/authentication/settings`
2. Ve a **Settings → Authorized domains → Add domain**.
3. Agrega tu dominio de Vercel (por ejemplo: `tu-proyecto.vercel.app`).

### 4. Desarrollo local
```bash
npm install
npm run dev
```
