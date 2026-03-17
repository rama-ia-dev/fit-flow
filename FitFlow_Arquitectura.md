# FitFlow — Arquitectura Completa & Documento de Diseño
**SaaS para Personal Trainers**
*Violet Wave AI — v2.0*

---

## Tabla de Contenidos

1. [Visión General del Producto](#1-visión-general-del-producto)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Modelo de Base de Datos](#3-modelo-de-base-de-datos-supabase)
4. [Arquitectura de Módulos Frontend](#4-arquitectura-de-módulos-frontend)
5. [Motor de IA de Progresión](#5-motor-de-ia-de-progresión-supabase-edge-functions)
6. [Flujo de Aprobación del Entrenador](#6-flujo-de-aprobación-del-entrenador)
7. [Sistema de Recetas](#7-sistema-de-recetas)
8. [Sistema de Suscripciones](#8-sistema-de-suscripciones-paddle)
9. [Roadmap de Construcción](#9-roadmap-de-construcción)
10. [Prompts de Arranque para Claude Code](#10-prompts-de-arranque-para-claude-code)
11. [PWA y Estrategia Mobile](#11-pwa-y-estrategia-mobile)
12. [Notificaciones (Resend + FCM)](#12-notificaciones-resend--fcm)

---

## 1. Visión General del Producto

FitFlow es una plataforma SaaS multi-tenant diseñada para personal trainers independientes y pequeños estudios. Permite gestionar alumnos, rutinas adaptativas con IA, registro de entrenamientos y un repositorio de recetas con filtros avanzados, todo bajo un modelo de suscripción mensual escalable según la cantidad de alumnos.

### 1.1 El Problema que Resuelve

| Problema actual | Solución FitFlow |
|---|---|
| Rutinas gestionadas por WhatsApp o PDF estáticos | Portal digital con rutinas dinámicas actualizadas automáticamente |
| Sin historial estructurado de entrenamientos | Registro por sesión con estadísticas y gráficos de progresión |
| Progresión de cargas manual o intuitiva | Motor de IA que ajusta series/reps/peso según el último registro |
| Nutrición desconectada del entrenamiento | Buscador de recetas filtrado por objetivo, calorías, macros e ingredientes |
| Sin visibilidad para el entrenador sobre múltiples alumnos | Dashboard centralizado con estado de cada alumno |
| Cambios de rutina sin contexto para el alumno | Notificaciones con explicación detallada de cada cambio |

### 1.2 Usuarios del Sistema

| Rol | Descripción | Acciones clave |
|---|---|---|
| Personal Trainer | Usuario pagador de la suscripción | Crear rutinas, gestionar alumnos, aprobar ajustes IA, ver dashboard |
| Alumno | Usuario vinculado al PT, no paga | Ver rutina del día, registrar entrenamiento, ver progreso, buscar recetas |
| Admin (interno) | Operador de la plataforma | Gestión de suscripciones, soporte, métricas globales |

---

## 2. Stack Tecnológico

| Capa | Tecnología y justificación |
|---|---|
| Frontend | React + Vite + TypeScript + React Router + TanStack Query + Zustand + shadcn/ui + Tailwind CSS. Tipado estático para robustez, Tailwind para velocidad de diseño, TanStack Query para cache y server state, Zustand para estado global ligero, shadcn/ui para componentes accesibles y customizables. |
| Base de datos | Supabase (PostgreSQL). Multi-tenant con Row Level Security (RLS) nativo. Auth, Storage y Realtime incluidos. |
| Autenticación | Supabase Auth con Google OAuth. Dominio propio por PT para restringir acceso de alumnos. |
| Motor IA / Automatización | Supabase Edge Functions (TypeScript/Deno). Se disparan vía Supabase Database Webhook al insertar un `training_log`. Rate limiting: máximo 1 análisis por `routine_day_id` por período de 24 horas. Sin infraestructura externa. |
| Pagos y suscripciones | Paddle (Merchant of Record). No requiere LLC ni entidad fiscal en EE.UU. Compatible con Argentina. Soporta suscripciones recurrentes, webhooks y portal de autogestión. Los cobros llegan vía Payoneer o transferencia bancaria. El trainer solo ingresa su tarjeta, no necesita cuenta en ningún servicio externo. |
| Hosting | Vercel con deploy continuo desde GitHub. Variables de entorno para producción. |
| LLM | Claude Sonnet 4.6 (análisis de progresión, primary) + Gemini Flash 2.0 (fallback por costo/velocidad). Configurable por tipo de operación. |
| Notificaciones | Resend (email transaccional) + Firebase Cloud Messaging (push notifications). |
| PWA | vite-plugin-pwa para experiencia mobile-like: instalable en home screen, service worker, soporte offline básico. |

---

## 3. Modelo de Base de Datos (Supabase)

Todas las tablas incluyen RLS (Row Level Security) para aislamiento multi-tenant. Cada personal trainer solo puede ver y modificar sus propios datos y los de sus alumnos vinculados.

### 3.1 Tablas Principales

#### `trainers`

| Campo | Tipo y descripción |
|---|---|
| id | UUID — PK, auth.uid() de Supabase |
| email | TEXT — email del trainer |
| full_name | TEXT |
| avatar_url | TEXT — foto de perfil |
| paddle_customer_id | TEXT — ID de cliente en Paddle |
| paddle_subscription_id | TEXT — ID de suscripción activa |
| plan_tier | TEXT — "starter" \| "pro" \| "elite" |
| max_students | INTEGER — límite según plan |
| ai_training_prompt | TEXT — instrucciones personalizadas del PT para el motor IA |
| fcm_token | TEXT — token de Firebase Cloud Messaging para push notifications |
| created_at | TIMESTAMPTZ |

#### `students`

| Campo | Tipo y descripción |
|---|---|
| id | UUID — PK |
| trainer_id | UUID — FK → trainers.id |
| auth_user_id | UUID — auth.uid() del alumno (nullable hasta que acepte invitación) |
| email | TEXT |
| full_name | TEXT |
| avatar_url | TEXT |
| birth_date | DATE |
| weight_kg | NUMERIC — peso actual |
| height_cm | NUMERIC |
| current_goal | TEXT — "muscle_gain" \| "fat_loss" \| "strength" \| "endurance" \| "maintenance" |
| is_active | BOOLEAN |
| invite_token | TEXT — token para primer acceso |
| fcm_token | TEXT — token de Firebase Cloud Messaging para push notifications |
| created_at | TIMESTAMPTZ |

#### `exercise_library` (catálogo global de ejercicios)

| Campo | Tipo y descripción |
|---|---|
| id | UUID — PK |
| name | TEXT — nombre estandarizado, ej: "Press Banca Plano" |
| muscle_group | TEXT — grupo muscular principal: "chest" \| "back" \| "shoulders" \| "legs" \| "arms" \| "core" \| "full_body" |
| exercise_type | TEXT — "compound" \| "isolation" \| "cardio" |
| default_video_url | TEXT — enlace a video demostrativo por defecto |
| aliases | TEXT[] — nombres alternativos para búsqueda (ej: ["bench press", "press plano", "press de banca"]) |
| created_at | TIMESTAMPTZ |

#### `routines`

| Campo | Tipo y descripción |
|---|---|
| id | UUID — PK |
| trainer_id | UUID — FK → trainers.id |
| student_id | UUID — FK → students.id (nullable si es plantilla) |
| name | TEXT — ej: "Rutina Volumen 4 días" |
| goal | TEXT — objetivo del bloque |
| weeks_duration | INTEGER — duración estimada en semanas |
| is_template | BOOLEAN — si es plantilla reutilizable del PT |
| is_active | BOOLEAN — rutina en curso del alumno |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |

#### `routine_days`

| Campo | Tipo y descripción |
|---|---|
| id | UUID — PK |
| routine_id | UUID — FK → routines.id |
| day_number | INTEGER — 1, 2, 3... |
| name | TEXT — ej: "Día 1 - Pecho y Tríceps" |
| muscle_groups | TEXT[] — array de grupos musculares |
| includes_cardio | BOOLEAN |
| order_index | INTEGER — orden de visualización |

#### `exercises` (ejercicios asignados a cada día de rutina)

| Campo | Tipo y descripción |
|---|---|
| id | UUID — PK |
| routine_day_id | UUID — FK → routine_days.id |
| exercise_library_id | UUID — FK → exercise_library.id |
| is_main_lift | BOOLEAN — ejercicio principal del día (afecta lógica IA) |
| sets | JSONB — array de sets planificados: [{set_number, reps, weight_kg, rpe}] |
| rest_seconds | INTEGER — descanso entre series |
| notes | TEXT — indicaciones técnicas del PT |
| order_index | INTEGER |
| video_url | TEXT — enlace a video demostrativo (override del default en exercise_library) |
| updated_at | TIMESTAMPTZ |

#### `training_logs` (registros de entrenamiento)

| Campo | Tipo y descripción |
|---|---|
| id | UUID — PK |
| student_id | UUID — FK → students.id |
| routine_day_id | UUID — FK → routine_days.id |
| logged_date | DATE — fecha del entrenamiento |
| duration_minutes | INTEGER |
| perceived_effort | INTEGER — RPE global 1-10 |
| notes | TEXT — comentario libre del alumno |
| ai_analysis_triggered | BOOLEAN — si este log disparó análisis IA |
| created_at | TIMESTAMPTZ |

> **Nota:** Los ejercicios realizados se registran en la tabla `exercise_logs` (ver abajo), no como JSONB dentro de este registro. Esto permite queries eficientes de progresión por ejercicio.

#### `exercise_logs` (detalle de ejercicios realizados por entrenamiento)

| Campo | Tipo y descripción |
|---|---|
| id | UUID — PK |
| training_log_id | UUID — FK → training_logs.id |
| exercise_library_id | UUID — FK → exercise_library.id |
| sets_performed | JSONB — [{set_number, reps_done, weight_kg, rpe, completed}] |
| order_index | INTEGER — orden en que se realizó |
| created_at | TIMESTAMPTZ |

#### `ai_progression_suggestions`

| Campo | Tipo y descripción |
|---|---|
| id | UUID — PK |
| student_id | UUID — FK |
| routine_day_id | UUID — FK |
| training_log_id | UUID — FK → log que disparó el análisis |
| exercise_id | UUID — FK → exercise afectado (exercises.id) |
| current_sets | JSONB — configuración actual |
| suggested_sets | JSONB — configuración sugerida por IA |
| ai_reasoning | TEXT — explicación detallada del ajuste |
| status | TEXT — "pending" \| "approved" \| "rejected" |
| trainer_comment | TEXT — comentario del PT al aprobar/rechazar |
| student_message | TEXT — mensaje que verá el alumno si se aprueba |
| reviewed_at | TIMESTAMPTZ |
| created_at | TIMESTAMPTZ |

#### `recipes`

| Campo | Tipo y descripción |
|---|---|
| id | UUID — PK |
| name | TEXT |
| description | TEXT |
| image_url | TEXT |
| prep_time_minutes | INTEGER |
| cook_time_minutes | INTEGER |
| servings | INTEGER |
| calories_per_serving | INTEGER |
| protein_g | NUMERIC |
| carbs_g | NUMERIC |
| fat_g | NUMERIC |
| protein_level | TEXT — "low" \| "medium" \| "high" (< 15g \| 15-30g \| > 30g) |
| meal_type | TEXT[] — ["breakfast","lunch","dinner","snack","pre_workout","post_workout"] |
| training_goals | TEXT[] — ["muscle_gain","fat_loss","strength","maintenance","endurance"] |
| diet_type | TEXT[] — ["standard","vegetarian","vegan","gluten_free","lactose_free","keto","paleo"] |
| ingredients | JSONB — [{name, quantity, unit}] |
| ingredient_tags | TEXT[] — nombres de ingredientes para búsqueda/filtro |
| steps | JSONB — [{step_number, instruction}] |
| difficulty | TEXT — "easy" \| "medium" \| "hard" |
| created_by | UUID — trainer_id o null si es global |
| is_public | BOOLEAN — visible para todos los PTs o solo el creador |

#### `favorite_recipes` (recetas guardadas por alumnos)

| Campo | Tipo y descripción |
|---|---|
| id | UUID — PK |
| student_id | UUID — FK → students.id |
| recipe_id | UUID — FK → recipes.id |
| created_at | TIMESTAMPTZ |

> **Constraint:** UNIQUE(student_id, recipe_id) para evitar duplicados.

#### `notifications`

| Campo | Tipo y descripción |
|---|---|
| id | UUID — PK |
| user_id | UUID — puede ser trainer o student |
| user_role | TEXT — "trainer" \| "student" |
| type | TEXT — "ai_suggestion_pending" \| "routine_updated" \| "new_student" \| "subscription_alert" \| "training_logged" |
| title | TEXT |
| body | TEXT |
| metadata | JSONB — datos adicionales según tipo (ej: suggestion_id, student_id) |
| is_read | BOOLEAN |
| created_at | TIMESTAMPTZ |

#### `subscription_plans` (tabla de referencia)

| Campo | Tipo y descripción |
|---|---|
| id | TEXT — PK: "starter" \| "pro" \| "elite" |
| name | TEXT — nombre visible |
| max_students | INTEGER — 5 \| 15 \| ilimitado |
| price_monthly_usd | NUMERIC |
| paddle_price_id | TEXT — Price ID del plan en Paddle |
| features | TEXT[] |

---

## 4. Arquitectura de Módulos Frontend

### 4.1 Portal del Personal Trainer

| Módulo | Pantallas | Funcionalidad clave |
|---|---|---|
| Dashboard | Vista principal | Resumen alumnos activos, notificaciones pendientes, estadísticas rápidas |
| Gestión de Alumnos | Lista + Perfil individual | Crear, invitar, editar alumnos. Ver historial de entrenamientos y progresión |
| Rutinas | Lista + Editor de rutina | Crear rutinas base, asignar a alumno, editar ejercicios con sets/reps/pesos. Selector de ejercicios desde `exercise_library` |
| Aprobaciones IA | Cola de pendientes + Modal detalle | Ver sugerencias de IA, aprobar/rechazar con comentario, vista diff actual vs sugerido |
| Configuración IA | Formulario extenso | Definir estilo de entrenamiento, casos edge, reglas de progresión personalizadas |
| Recetas | Buscador + Detalle | Buscar, filtrar, crear y gestionar recetas |
| Suscripción | Panel de billing | Ver plan actual, cambiar tier, historial de pagos (Paddle Customer Portal) |

### 4.2 Portal del Alumno

| Módulo | Pantallas | Funcionalidad clave |
|---|---|---|
| Home / Hoy | Dashboard personal | Rutina del día asignada, último entrenamiento registrado, estadística de racha |
| Rutina del Día | Vista de ejercicios | Ver sets/reps/pesos de cada ejercicio, notas del PT, video demo si existe |
| Registrar Entrenamiento | Formulario dinámico | Registrar cada ejercicio (reps, peso, RPE por serie). Al finalizar todos, toca "Finalizar entrenamiento" que guarda el `training_log` + `exercise_logs` |
| Mi Progreso | Dashboard de estadísticas | Gráficos de progresión por ejercicio (queries directas a `exercise_logs`), historial de entrenamientos, récords personales |
| Mi Rutina Completa | Vista semanal | Ver todos los días de la rutina actual con sus ejercicios |
| Notificaciones | Lista de notifs | Actualizaciones de rutina aprobadas con explicación detallada del cambio |
| Recetas | Buscador + Detalle | Buscar recetas con filtros alineados a su objetivo de entrenamiento actual. Guardar en favoritos |

---

## 5. Motor de IA de Progresión (Supabase Edge Functions)

### 5.1 Trigger del Motor

El motor es una Supabase Edge Function escrita en TypeScript/Deno. Se activa automáticamente desde un Supabase Database Webhook cada vez que se inserta un nuevo registro en `training_logs`. La Edge Function evalúa si corresponde ejecutar el análisis de progresión.

**Condiciones para activar el análisis IA:**
- El alumno completó al menos el 80% de los ejercicios del día (verificado contra `exercise_logs` del training_log)
- No existe una sugerencia "pending" activa para ese mismo `routine_day_id`
- No se ejecutó un análisis para ese `routine_day_id` en las últimas 24 horas (rate limiting)
- Hay al menos 1 ejercicio marcado como `is_main_lift = true` en ese día
- Existe al menos 1 registro previo del mismo `routine_day_id` (para comparar)

### 5.2 Flujo de la Edge Function

1. Supabase Database Webhook llama a la Edge Function con el `training_log_id`
2. Edge Function verifica rate limit: query `ai_progression_suggestions` para entradas recientes del mismo `routine_day_id` dentro de 24h
3. Edge Function consulta Supabase: obtiene el log completo + `exercise_logs` asociados
4. Obtiene todos los logs previos del mismo día de rutina con sus `exercise_logs`
5. Consulta el perfil del alumno (objetivo, peso, historial reciente)
6. Consulta la rutina actual del día (ejercicios vía JOIN con `exercise_library`, sets definidos, notas)
7. Obtiene el `ai_training_prompt` personalizado del trainer
8. Construye el contexto completo y lo envía a Claude Sonnet 4.6 (fallback: Gemini Flash 2.0)
9. LLM devuelve análisis estructurado en JSON con sugerencias por ejercicio
10. Edge Function inserta la sugerencia en `ai_progression_suggestions` con status = "pending"
11. Edge Function llama a Resend API para enviar email de notificación al trainer
12. Edge Function envía push notification vía FCM al trainer (si tiene `fcm_token` registrado)
13. Inserta registro en tabla `notifications` para el trainer

### 5.3 Estructura del Prompt al LLM

El prompt enviado al LLM se construye con los siguientes componentes:

```
SYSTEM:           Instrucciones generales del motor + filosofía de progresión
TRAINER CONTEXT:  ai_training_prompt personalizado del PT (su estilo, casos edge, reglas)
STUDENT PROFILE:  nombre, objetivo actual, peso, historial de progresión general
CURRENT ROUTINE:  nombre del día, ejercicios (desde exercise_library), sets/reps/pesos actuales, notas
TRAINING HISTORY: últimos 3-5 registros del mismo día de rutina (fechas + resultados desde exercise_logs)
LATEST LOG:       registro más reciente (lo que acaba de hacer el alumno, desde exercise_logs)
OUTPUT FORMAT:    JSON estricto con structure definida para parsing seguro
```

### 5.4 JSON de Respuesta del LLM

El LLM debe responder estrictamente con este formato para garantizar parsing determinista:

```json
{
  "should_update": true,
  "overall_assessment": "texto del análisis general del entrenamiento",
  "exercises": [
    {
      "exercise_id": "uuid",
      "exercise_name": "Press Banca Plano",
      "should_update": true,
      "reason": "El alumno superó las reps objetivo en ambas series...",
      "current_sets": [{"set_number": 1, "reps": 8, "weight_kg": 100}],
      "suggested_sets": [{"set_number": 1, "reps": 4, "weight_kg": 110}],
      "student_explanation": "texto amigable para mostrar al alumno"
    }
  ]
}
```

### 5.5 Lógica de Progresión por Objetivo

| Objetivo | Lógica principal | Ejemplo de ajuste |
|---|---|---|
| Incrementar Masa Muscular | Doble progresión: primero reps, luego peso. Ejercicios principales: bajas reps + alta carga cuando se supera el rango. | 2x8x100kg → alumno hace 2x10x100kg → 1x4-5x110kg + 1x6-8x100kg |
| Pérdida de Grasa | Mantener o aumentar levemente el peso, priorizar densidad de entrenamiento y volumen. | 3x12x70kg → alumno hace 3x14x70kg → 3x12x75kg o 4x12x70kg |
| Fuerza Máxima | Progresión lineal de carga en ejercicios compuestos, series de baja repetición. | 5x3x120kg → alumno completa todas → 5x3x125kg o 5x2x130kg |
| Resistencia | Aumentar reps o reducir descanso. Progresión en volumen, no en carga pesada. | 3x15x60kg → alumno hace 3x18x60kg → 4x15x60kg o 3x15x60kg (menos descanso) |
| Mantenimiento | Ajustes mínimos. Mantener el estímulo. Pequeñas variaciones para evitar estancamiento. | Cambios pequeños en orden de ejercicios o variantes del mismo patrón de movimiento |

---

## 6. Flujo de Aprobación del Entrenador

### 6.1 Notificación al Trainer

El trainer recibe una notificación en su portal (in-app + email vía Resend + push vía FCM) con el siguiente contenido:

```
Actualización de Rutina Pendiente

Alumno: Martín Palermo
Día: Día 3 — Pecho y Tríceps + Cardio
Ejercicios con sugerencia: 2 (Press Banca Plano, Fondos en Paralelas)
Fecha del entrenamiento: 09/03/2025

→ [Ver y revisar actualización]
```

### 6.2 Modal de Aprobación

Al abrir la notificación, el trainer ve un modal con toda la información necesaria:

```
Alumno: Martín Palermo
Objetivo actual: Incrementar Masa Muscular
Día: Día 3 — Pecho y Tríceps + Cardio
Fecha último registro: 09/03/2025

────────────────────────────────────────
EJERCICIO: Press Banca Plano  [Principal]

RUTINA ACTUAL:    Serie 1: 8 reps × 100 kg
                  Serie 2: 8 reps × 100 kg

SUGERENCIA IA:    Serie 1: 4-5 reps × 110 kg
                  Serie 2: 6-8 reps × 100 kg

MOTIVO IA: El alumno completó ambas series superando el rango objetivo (8 reps)
con buena ejecución (RPE 7/10). Según objetivo de masa muscular y aplicando
doble progresión, se recomienda incrementar la carga en la primera serie...

────────────────────────────────────────
¿Aprobar esta actualización?   [SÍ]  [NO]

Motivo / Comentario del entrenador (obligatorio si rechaza):
[___________________________________]

Comentario para el alumno (opcional):
[___________________________________]

[GUARDAR Y ENVIAR]
```

### 6.3 Notificación al Alumno (si se aprueba)

El alumno recibe notificación in-app + email vía Resend + push vía FCM:

```
Tu rutina fue actualizada

Día 3 — Pecho y Tríceps + Cardio

Press Banca Plano:
  Antes:  2 series × 8 reps × 100 kg
  Ahora:  Serie 1: 4-5 reps × 110 kg  |  Serie 2: 6-8 reps × 100 kg

Por qué: En tu último entrenamiento lograste completar ambas series con las
repeticiones objetivo. Esto indica que estás listo para el siguiente escalón.
Aumentamos la carga en la primera serie para desafiar a tus músculos con un
estímulo nuevo.

Comentario de tu entrenador: "Muy buen trabajo la semana pasada Martín,
se nota la mejora. Dale con todo esta semana."
```

---

## 7. Sistema de Recetas

### 7.1 Filtros Disponibles

El buscador de recetas incluye un sistema de filtros avanzado combinable:

| Categoría de filtro | Opciones | Tipo de UI |
|---|---|---|
| Búsqueda textual | Nombre de receta o ingrediente principal | Input de texto con debounce |
| Objetivo de entrenamiento | Masa muscular, Pérdida de grasa, Fuerza, Resistencia, Mantenimiento | Multi-select chips (pre-filtra por objetivo del alumno) |
| Tipo de comida | Desayuno, Almuerzo, Cena, Snack, Pre-entreno, Post-entreno | Multi-select chips |
| Rango de calorías | Slider: 100 — 1200 kcal | Range slider doble |
| Contenido de proteína | Bajo (<15g), Medio (15-30g), Alto (>30g) | Toggle de 3 opciones |
| Tipo de dieta | Estándar, Vegetariana, Vegana, Sin gluten, Sin lactosa, Keto, Paleo | Multi-select checkboxes |
| Ingredientes incluidos | Lista de ingredientes comunes como checkboxes | Checkbox list con buscador interno |
| Ingredientes excluidos | Ingredientes a evitar (alergias) | Input con tags |
| Dificultad | Fácil, Media, Difícil | Radio buttons |
| Tiempo total | Slider: hasta 15min \| 30min \| 60min \| sin límite | Slider |

### 7.2 Detalle de Receta

- Imagen principal + galería opcional
- Macros por porción: calorías, proteínas, carbohidratos, grasas
- Badges de tipo de dieta y objetivo de entrenamiento
- Lista de ingredientes con cantidades y unidades
- Pasos de preparación numerados
- Tiempo de preparación + cocción + total
- Botón "Guardar en favoritos" para el alumno (guarda en tabla `favorite_recipes`)

---

## 8. Sistema de Suscripciones (Paddle)

### 8.1 Planes Disponibles

| Feature | Starter | Pro | Elite |
|---|---|---|---|
| Precio mensual (USD) | $29/mes | $59/mes | $99/mes |
| Alumnos activos máx. | 5 | 15 | Ilimitado |
| Motor IA de progresión | Incluido | Incluido | Incluido |
| Recetas personalizadas | Solo recetas globales | Crear recetas | + banco privado |
| Plantillas de rutina | Hasta 10 | Ilimitadas | Ilimitadas |
| Soporte | Email | Email prioritario | Chat directo |

**Trial gratuito:** 14 días, hasta 2 alumnos para nuevos trainers.

### 8.2 Flujo de Suscripción

1. PT se registra → plan gratuito de prueba 14 días con hasta 2 alumnos
2. Al vencer trial o querer agregar más alumnos → Paddle Checkout (overlay embebido en la app)
3. Paddle procesa el pago → webhook a Supabase Edge Function → Edge Function actualiza `plan_tier` y `max_students` en tabla `trainers` de Supabase
4. Si el pago falla → Supabase bloquea la invitación de nuevos alumnos (los existentes siguen activos 7 días de gracia). Edge Function envía notificación al trainer vía Resend + FCM
5. PT puede gestionar su suscripción desde el Paddle Customer Portal embebido en la app

### 8.3 Eventos de Webhook (Paddle)

La Edge Function `paddle-webhook` procesa los siguientes eventos:
- `subscription.created` → asignar plan_tier y max_students
- `subscription.updated` → actualizar plan_tier y max_students (upgrade/downgrade)
- `subscription.canceled` → marcar plan como cancelado, mantener acceso hasta fin de período
- `transaction.payment_failed` → notificar al trainer, activar período de gracia

---

## 9. Roadmap de Construcción

### Fase 1 — MVP Core (Semanas 1-3)

- Auth con Supabase (Google OAuth)
- Onboarding de trainer: crear perfil + configurar primer alumno
- Catálogo de ejercicios (`exercise_library`) con datos iniciales
- Creación de rutinas: días + ejercicios (desde `exercise_library`) + sets/reps/pesos
- Portal del alumno: ver rutina del día asignada
- Registro de entrenamiento: formulario dinámico por sesión → guarda en `training_logs` + `exercise_logs`
- Base de datos completa en Supabase con RLS
- Configuración PWA (manifest, service worker, instalabilidad)

**→ Objetivo:** Trainer puede crear rutina y alumno puede registrar entrenamiento

### Fase 2 — Motor IA + Aprobaciones (Semanas 4-5)

- Supabase Edge Function para el motor de progresión IA
- Database Webhook que dispara la Edge Function al insertar `training_log`
- Modal de aprobación en portal del trainer
- Integración Resend (email) + FCM (push) para notificaciones
- Notificaciones al alumno cuando la rutina es actualizada
- Sección "Configuración IA" del trainer (`ai_training_prompt`)

**→ Objetivo:** El ciclo completo de progresión adaptativa funciona end-to-end

### Fase 3 — Estadísticas + Recetas (Semana 6)

- Dashboard de progreso del alumno con gráficos por ejercicio (queries a `exercise_logs`)
- Récords personales automáticos
- Historial de entrenamientos navegable
- Sistema de recetas con buscador y filtros completos
- Favoritos de recetas por alumno (tabla `favorite_recipes`)

**→ Objetivo:** App completa y usable como producto final

### Fase 4 — Suscripciones + Deploy (Semana 7)

- Integración Paddle: planes, checkout overlay, webhooks
- Edge Function para procesar webhooks de Paddle
- Lógica de límite de alumnos por tier
- Paddle Customer Portal para autogestión del trainer
- Deploy en Vercel con CI/CD desde GitHub
- Variables de entorno de producción

**→ Objetivo:** Producto listo para vender

---

## 10. Prompts de Arranque para Claude Code

> **Nota:** Estos prompts están diseñados para ser ejecutados secuencialmente con Claude Code en el repositorio del proyecto.

---

### PROMPT 1 — Inicializar entorno

```
Inicializa el espacio de trabajo para un proyecto llamado "FitFlow".
Es un SaaS multi-tenant para personal trainers construido con:
- Frontend: React + Vite + TypeScript + React Router + TanStack Query + Zustand + shadcn/ui + Tailwind CSS
- Backend: Supabase (Auth + PostgreSQL con RLS + Realtime)
- Motor IA: Supabase Edge Functions (TypeScript/Deno)
- Pagos: Paddle
- Hosting: Vercel
- Notificaciones: Resend (email) + FCM (push)
- PWA: vite-plugin-pwa

Crea la estructura de directorios, instala dependencias y configura
las variables de entorno necesarias para este stack.
Incluye configuración de PWA con manifest.json y service worker básico.
```

---

### PROMPT 2 — Fase 1: Auth + Estructura DB

```
Implementa la base de datos en Supabase y la autenticación.
Crea todas las tablas según el esquema de la Sección 3 de este documento,
incluyendo las tablas nuevas: exercise_library, exercise_logs, favorite_recipes.

Notas importantes:
- exercises.exercise_library_id referencia exercise_library.id (no hay exercise_name directo)
- training_logs NO tiene exercises_performed JSONB (los ejercicios van en exercise_logs)
- favorite_recipes tiene constraint UNIQUE(student_id, recipe_id)
- trainers y students tienen campo fcm_token para push notifications

Configura Row Level Security para aislamiento multi-tenant.
Implementa auth con Google OAuth para trainers y alumnos por separado.
El primer acceso del alumno debe ser via invite_token.

Incluye seed data para exercise_library con al menos 50 ejercicios comunes
organizados por grupo muscular.
```

---

### PROMPT 3 — Fase 1: Rutinas y Registro

```
Construye los módulos de gestión de rutinas y registro de entrenamiento.

Módulo trainer: formulario para crear rutinas con días y ejercicios.
Cada ejercicio se selecciona desde exercise_library (buscador con autocomplete
que busca por name y aliases). Al seleccionar, se guarda exercise_library_id.
Cada ejercicio tiene: is_main_lift, sets como array JSONB con reps/weight_kg/rpe,
descanso y notas.

Módulo alumno: vista de rutina del día + formulario de registro.
El formulario debe mostrar los sets planificados y permitir ingresar
reps_done, weight_used y rpe por cada serie de cada ejercicio.
Al tocar "Finalizar entrenamiento", se crea UN training_log y múltiples
exercise_logs (uno por ejercicio realizado).

Usar TanStack Query para todas las llamadas a Supabase.
Usar Zustand para el estado del formulario de registro.
```

---

### PROMPT 4 — Fase 2: Motor IA de Progresión

```
Crea una Supabase Edge Function llamada "progression-engine" que funcione
como motor de progresión adaptativa con IA para FitFlow.

Se dispara vía Supabase Database Webhook al insertar en training_logs.
Recibe via POST: { "type": "INSERT", "record": { "id": "uuid", ... } }

Flujo interno:
1. Verificar rate limit: query ai_progression_suggestions para entradas
   del mismo routine_day_id en las últimas 24h. Si existe, salir.
2. Consultar Supabase: obtener el training_log + exercise_logs asociados
3. Obtener todos los logs previos del mismo routine_day_id con sus exercise_logs
4. Obtener perfil del alumno (goal, weight, historial)
5. Obtener la rutina actual del día (ejercicios con JOIN a exercise_library)
6. Obtener ai_training_prompt del trainer
7. Construir prompt completo y llamar a Claude Sonnet 4.6 vía Anthropic API
   (fallback: Gemini Flash 2.0 si Claude falla)
8. Parsear respuesta JSON con validación estricta
9. Si should_update=true: insertar en ai_progression_suggestions con status=pending
10. Enviar email al trainer vía Resend API
11. Enviar push notification al trainer vía FCM (si tiene fcm_token)
12. Insertar notificación en tabla notifications

La respuesta del LLM debe seguir el JSON schema de la Sección 5.4.
Usar Deno.env.get() para todas las credenciales.
```

---

### PROMPT 5 — Fase 2: Modal de Aprobación

```
Construye el módulo de aprobaciones de sugerencias IA para el trainer.

Pantalla "Aprobaciones pendientes": lista de ai_progression_suggestions
con status=pending, agrupadas por alumno, con badge de cantidad.

Modal de detalle al hacer clic en una sugerencia:
- Header: nombre alumno, objetivo, nombre del día de rutina, fecha del log
- Por cada ejercicio con should_update=true:
    · Mostrar diff visual: sets actuales vs sets sugeridos
    · Mostrar ai_reasoning del LLM
- Botones: Aprobar / Rechazar
- Campo de texto: comentario del trainer (obligatorio si rechaza)
- Campo de texto: mensaje para el alumno (opcional)
- Botón: Guardar y Enviar

Al aprobar: actualizar exercises.sets en Supabase + crear notificación al alumno
(in-app + email vía Resend + push vía FCM).
Al rechazar: marcar suggestion como rejected + guardar trainer_comment.
Ambas acciones actualizan suggestion.status y reviewed_at.
```

---

### PROMPT 6 — Fase 2: Configuración IA del Trainer

```
Construye la pantalla "Configuración IA" en el portal del trainer.

Es un formulario extenso que construye el ai_training_prompt del trainer.
Debe incluir los siguientes campos:

- Filosofía de entrenamiento (textarea libre)
- Metodología de progresión preferida (doble progresión / lineal / RPE / ondulante)
- Criterio para aumentar peso en ejercicios principales
- Criterio para aumentar peso en ejercicios accesorios
- Cómo manejar entrenamientos con RPE percibido muy alto (>8)
- Cómo manejar entrenamientos con RPE percibido muy bajo (<5)
- Reglas específicas por objetivo (masa muscular / pérdida de grasa / fuerza)
- Casos edge conocidos (lesiones comunes, ejercicios a no tocar, etc.)
- Instrucciones adicionales libres

Al guardar, concatenar todos los campos en un prompt estructurado
y guardarlo en trainers.ai_training_prompt en Supabase.
```

---

### PROMPT 7 — Fase 3: Dashboard de Progreso

```
Construye el módulo "Mi Progreso" en el portal del alumno.

Sección 1 — Resumen general:
- Racha actual de entrenamientos (días consecutivos)
- Total de entrenamientos registrados
- Semanas activo en la plataforma

Sección 2 — Progresión por ejercicio:
- Selector de ejercicio (dropdown con los ejercicios de su rutina activa,
  nombres desde exercise_library)
- Gráfico de línea: evolución del peso máximo usado por fecha
  (query directa a exercise_logs filtrado por exercise_library_id)
- Gráfico de barras: volumen total por sesión (series × reps × peso)

Sección 3 — Récords personales:
- Lista de PRs por ejercicio (peso máximo registrado + fecha)
- Badge visual cuando un récord fue superado en el último entrenamiento

Sección 4 — Historial de entrenamientos:
- Lista cronológica de logs con: fecha, día de rutina, duración, RPE global
- Al hacer clic: ver detalle completo de ese entrenamiento (exercise_logs)

Usar Recharts para todos los gráficos.
Usar TanStack Query para cache de datos de progresión.
```

---

### PROMPT 8 — Fase 3: Sistema de Recetas

```
Construye el módulo de recetas para FitFlow.

Pantalla principal — Buscador:
- Input de búsqueda textual con debounce (nombre o ingrediente)
- Panel de filtros colapsable con:
    · Objetivo de entrenamiento (multi-select chips)
    · Tipo de comida (multi-select chips)
    · Rango de calorías (range slider 100-1200 kcal)
    · Nivel de proteína: Bajo <15g | Medio 15-30g | Alto >30g
    · Tipo de dieta (checkboxes: estándar, vegetariana, vegana, sin gluten, keto...)
    · Ingredientes incluidos (checkbox list con buscador)
    · Ingredientes excluidos (input con tags)
    · Dificultad (radio: fácil, media, difícil)
    · Tiempo total (slider: 15, 30, 60 min, sin límite)
- Grid de cards de recetas con: imagen, nombre, calorías, proteínas, tiempo
- Botón guardar en favoritos en cada card (guarda en tabla favorite_recipes)

Pantalla detalle de receta: todos los campos de la tabla recipes.
Pre-filtrar por el objetivo actual del alumno al abrir la sección.

Para el trainer: botón "Crear receta" con formulario completo.

Pantalla "Mis Favoritos" del alumno: grid de recetas guardadas
con opción de quitar de favoritos.
```

---

### PROMPT 9 — Fase 4: Suscripciones con Paddle

```
Construye el sistema de suscripciones con Paddle.

Supabase Edge Function "paddle-webhook" para webhooks de Paddle:
- Verificar firma del webhook con PADDLE_WEBHOOK_SECRET
- Recibir eventos: subscription.created, subscription.updated,
  subscription.canceled, transaction.payment_failed
- Actualizar plan_tier y max_students en tabla trainers de Supabase
- En payment_failed: enviar notificación al trainer vía Resend + FCM

Frontend — Pantalla de suscripción del trainer:
- Mostrar plan actual con features y límite de alumnos
- Cards comparativas de los 3 planes (Starter / Pro / Elite)
- Botón "Cambiar plan" → Paddle Checkout overlay (Paddle.js)
- Botón "Gestionar suscripción" → Paddle Customer Portal
- Historial de pagos (últimas 6 facturas)

Lógica de límite de alumnos:
- Al intentar invitar un alumno: verificar students count vs max_students
- Si está en el límite: mostrar modal de upgrade con los planes disponibles

Trial gratuito de 14 días con hasta 2 alumnos para nuevos trainers.
```

---

### PROMPT 10 — Fase 4: Deploy en Vercel

```
Prepara FitFlow para deploy en producción.

1. Conectar repositorio GitHub a Vercel
2. Configurar variables de entorno en Vercel:
   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY,
   VITE_PADDLE_CLIENT_TOKEN, VITE_APP_URL
3. Configurar secrets en Supabase Edge Functions:
   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
   ANTHROPIC_API_KEY, GEMINI_API_KEY,
   PADDLE_WEBHOOK_SECRET, PADDLE_API_KEY,
   RESEND_API_KEY, FCM_SERVER_KEY
4. Actualizar Supabase Auth con la URL de producción de Vercel
5. Configurar Database Webhook en Supabase apuntando a la Edge Function
   de progresión (URL de producción)
6. Configurar webhook de Paddle apuntando a la Edge Function paddle-webhook
7. Test end-to-end: registrar entrenamiento → motor IA → aprobación → notificación (email + push)
```

---

## 11. PWA y Estrategia Mobile

### 11.1 PWA (Fase Web)

FitFlow se distribuye como Progressive Web App para ofrecer experiencia mobile-like sin necesidad de App Store/Play Store durante la fase web:

- **Instalabilidad:** manifest.json configurado con nombre, iconos, colores del tema y `display: standalone`
- **Service Worker:** vite-plugin-pwa con estrategia network-first para API calls y cache-first para assets estáticos
- **Offline básico:** La rutina del día se cachea localmente para consulta sin conexión. El registro de entrenamiento se guarda en local storage si no hay red y se sincroniza al reconectar
- **Push notifications:** Integración con FCM vía service worker para recibir notificaciones push

### 11.2 Estrategia Mobile (Fase Futura)

Cuando se implemente la versión mobile nativa:

- **Framework:** React Native (compatible con el conocimiento de React del equipo)
- **Código compartido:** Types de TypeScript, lógica de negocio, Zustand stores, y capa de API (Supabase client) se reutilizan desde la app web
- **Apple Store:** Se cumplirán todas las Human Interface Guidelines de Apple. React Native es plenamente aceptado por Apple (Instagram, Facebook, Shopify lo usan)
- **Google Play:** Sin restricciones adicionales relevantes

> **Nota:** Las decisiones de arquitectura de la fase web están diseñadas para facilitar esta migración futura.

---

## 12. Notificaciones (Resend + FCM)

### 12.1 Canales de Notificación

| Canal | Tecnología | Casos de uso |
|---|---|---|
| In-app | Tabla `notifications` + Supabase Realtime | Todos los eventos. Visible en el portal del usuario |
| Email | Resend API | Sugerencias IA pendientes, rutina actualizada, alertas de suscripción |
| Push | Firebase Cloud Messaging (FCM) | Mismos eventos que email, para notificación inmediata en dispositivo |

### 12.2 Tipos de Notificación

| Tipo | Destinatario | In-app | Email | Push |
|---|---|---|---|---|
| `ai_suggestion_pending` | Trainer | Sí | Sí | Sí |
| `routine_updated` | Alumno | Sí | Sí | Sí |
| `new_student` | Trainer | Sí | No | No |
| `subscription_alert` | Trainer | Sí | Sí | Sí |
| `training_logged` | Trainer | Sí | No | No |

### 12.3 Integración

- **Resend:** Se llama desde las Edge Functions después de insertar en tabla `notifications`. Requiere `RESEND_API_KEY` en secrets de Edge Functions. Templates de email diseñados con branding de FitFlow.
- **FCM:** Se llama desde las Edge Functions usando `FCM_SERVER_KEY`. El `fcm_token` del usuario se almacena en las tablas `trainers` y `students`. El token se registra desde el frontend al aceptar permisos de notificación push.

---

*FitFlow — Arquitectura v2.0 | Violet Wave AI — Documento de uso interno*
