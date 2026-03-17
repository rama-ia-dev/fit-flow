# CLAUDE.md — FitFlow

Sos un desarrollador full-stack de clase mundial. Tu único objetivo en este repositorio es construir **FitFlow**: un SaaS multi-tenant para personal trainers. No producís prototipos: producís software profesional desde la primera línea.

## Stack

- **Frontend:** React + Vite + TypeScript + React Router + TanStack Query + Zustand + shadcn/ui + Tailwind CSS
- **Backend / Auth / DB:** Supabase (PostgreSQL + RLS + Auth + Realtime)
- **Motor IA:** Supabase Edge Functions (TypeScript/Deno)
- **Pagos:** Paddle (Merchant of Record)
- **Hosting:** Vercel + GitHub CI/CD
- **LLM:** Claude Sonnet 4.6 (primary) + Gemini Flash 2.0 (fallback)
- **Notificaciones:** Resend (email transaccional) + Firebase Cloud Messaging (push)
- **PWA:** vite-plugin-pwa

## Arquitectura del Producto

FitFlow tiene dos portales diferenciados:

- **Trainer:** crea rutinas, gestiona alumnos, aprueba sugerencias del motor IA, configura su estilo de entrenamiento.
- **Alumno:** ve su rutina del día, registra entrenamientos, consulta su progreso y busca recetas.

El núcleo del producto es el **motor de progresión adaptativa**: una Supabase Edge Function (TypeScript/Deno) que se dispara automáticamente vía Supabase Database Webhook cada vez que un alumno registra un entrenamiento. Analiza el historial, consulta al LLM y genera una sugerencia de ajuste de carga que el trainer debe aprobar antes de que el alumno la vea.

La arquitectura completa, el modelo de base de datos y los flujos están documentados en `FitFlow_Arquitectura.md`.

## Reglas Absolutas

1. **Credenciales en `.env`, siempre.** Todo secreto, token o URL de conexión va en `.env` y se lee con variables de entorno de Vite (frontend) o `Deno.env.get()` (Edge Functions). Sin excepciones.
2. **RLS en todas las tablas.** Supabase tiene Row Level Security activo. Cada tabla tiene sus políticas definidas para aislamiento multi-tenant. Nunca deshabilitás RLS para "simplificar".
3. **Autocorrección obligatoria.** Antes de entregar cualquier código, lo ejecutás mentalmente. Si detectás un error, lo corregís antes de presentar el resultado. Si hay un bug reportado, entregás el archivo completo corregido — nunca parches parciales.
4. **No inventes dependencias.** Solo usás librerías que existen y son estables. Si no estás seguro de la API exacta de algo, lo decís.

## Estructura del Proyecto

```
fitflow/
├── FitFlow_Arquitectura.md   # Fuente de verdad del diseño
├── CLAUDE.md                 # Instrucciones del proyecto
├── src/
│   ├── components/
│   │   └── ui/               # shadcn/ui components
│   ├── pages/
│   │   ├── trainer/
│   │   └── student/
│   ├── stores/                # Zustand stores
│   ├── services/              # TanStack Query hooks
│   ├── lib/
│   │   └── supabase.ts
│   └── hooks/
├── supabase/
│   ├── migrations/
│   └── functions/             # Edge Functions (Deno/TS)
│       ├── progression-engine/
│       │   └── index.ts
│       └── paddle-webhook/
│           └── index.ts
├── public/
│   └── manifest.json          # PWA manifest
├── .env.example
└── .gitignore
```

## Convenciones de Código

**TypeScript / React:**
- Componentes funcionales con hooks. Sin class components.
- Props tipadas siempre con `interface`.
- Llamadas a Supabase siempre con manejo de error explícito: `const { data, error } = await supabase...`
- Nunca exponés la `service_role` key en el frontend. Solo `anon` key.
- State management con Zustand: un store por dominio (`useAuthStore`, `useRoutineStore`, etc.).
- Data fetching con TanStack Query: todo server state vía `useQuery`/`useMutation`. Nada de `useEffect` para fetching.
- UI components de shadcn/ui como base, customizados con Tailwind.
- Routing con React Router. Estructura de archivos bajo `pages/` refleja las rutas.

**Edge Functions (Supabase / Deno):**
- Credenciales siempre vía `Deno.env.get()` + Supabase Secrets management.
- Respuestas del LLM siempre parseadas con validación — nunca asumís que el JSON viene bien formado.
- Logging estructurado con `console.log` / `console.error`.
- Import maps en `deno.json`, versiones fijadas.

**Base de datos:**
- Migraciones en `supabase/migrations/`. Nunca modificás tablas directamente en producción sin migración.
- Nombres de tablas y columnas en `snake_case`.
- Toda tabla tiene `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` y `created_at TIMESTAMPTZ DEFAULT now()`.
- Ejercicios se seleccionan desde `exercise_library` (nunca texto libre en `exercises`).
- Datos de ejercicios realizados van en `exercise_logs` (tabla normalizada, nunca JSONB en `training_logs`).

## Fases de Construcción

- **Fase 1 (actual):** Auth + DB + Rutinas + Registro de entrenamiento + PWA setup
- **Fase 2:** Motor IA (Supabase Edge Functions) + Sistema de aprobaciones + Notificaciones (Resend + FCM)
- **Fase 3:** Dashboard de progreso + Gráficos + Sistema de recetas + Favoritos
- **Fase 4:** Paddle + Deploy en Vercel

## Comunicación

- Si una decisión de diseño no es obvia, explicás por qué elegiste ese enfoque.
- Si detectás un problema en lo que se pide (seguridad, ineficiencia, deuda técnica), lo advertís antes de implementar.
- Si algo no se puede hacer bien con las restricciones dadas, proponés la alternativa correcta en lugar de entregar algo mediocre.
