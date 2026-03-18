import { createClient } from 'jsr:@supabase/supabase-js@2'
import Anthropic from 'npm:@anthropic-ai/sdk'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY')!,
})

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlannedSet {
  set_number: number
  reps: number
  weight_kg: number
  rpe?: number
}

interface PerformedSet {
  set_number: number
  reps_done: number
  weight_kg: number
  rpe?: number
  completed: boolean
}

interface WebhookPayload {
  type: 'INSERT'
  table: string
  record: {
    id: string
    student_id: string
    routine_day_id: string
    logged_date: string
    duration_minutes: number | null
    perceived_effort: number | null
    notes: string | null
  }
}

interface AiSuggestion {
  exercise_id: string
  current_sets: PlannedSet[]
  suggested_sets: PlannedSet[]
  reasoning: string
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    // Validate webhook secret
    const authHeader = req.headers.get('Authorization')
    const webhookSecret = Deno.env.get('WEBHOOK_SECRET')
    if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
      return new Response('Unauthorized', { status: 401 })
    }

    const payload: WebhookPayload = await req.json()
    if (payload.type !== 'INSERT' || payload.table !== 'training_logs') {
      return new Response('Ignored', { status: 200 })
    }

    const log = payload.record
    console.log(`Processing training log ${log.id} for student ${log.student_id}`)

    // ── 1. Fetch exercise logs for this training session ──────────────────────
    const { data: exerciseLogs, error: elError } = await supabase
      .from('exercise_logs')
      .select('*, exercise_library(*)')
      .eq('training_log_id', log.id)

    if (elError) throw elError
    if (!exerciseLogs || exerciseLogs.length === 0) {
      return new Response('No exercise logs', { status: 200 })
    }

    // ── 2. Fetch planned exercises for this routine day ───────────────────────
    const { data: plannedExercises, error: peError } = await supabase
      .from('exercises')
      .select('*, exercise_library(*)')
      .eq('routine_day_id', log.routine_day_id)

    if (peError) throw peError

    // ── 3. Fetch recent training history (last 5 sessions for this day) ───────
    const { data: recentLogs, error: rlError } = await supabase
      .from('training_logs')
      .select('*, exercise_logs(*, exercise_library(*))')
      .eq('student_id', log.student_id)
      .eq('routine_day_id', log.routine_day_id)
      .neq('id', log.id)
      .order('logged_date', { ascending: false })
      .limit(5)

    if (rlError) throw rlError

    // ── 4. Fetch student info and trainer AI prompt ───────────────────────────
    const { data: student, error: sError } = await supabase
      .from('students')
      .select('full_name, current_goal, weight_kg, height_cm, trainer_id')
      .eq('id', log.student_id)
      .single()

    if (sError) throw sError

    const { data: trainer } = await supabase
      .from('trainers')
      .select('ai_training_prompt')
      .eq('id', student.trainer_id)
      .single()

    // ── 5. Build context for LLM ──────────────────────────────────────────────
    const historyText = recentLogs && recentLogs.length > 0
      ? recentLogs.map((r, i) => {
          const sets = r.exercise_logs
            ?.map((el: { exercise_library: { name: string } | null; sets_performed: PerformedSet[] }) =>
              `  - ${el.exercise_library?.name}: ${JSON.stringify(el.sets_performed)}`
            ).join('\n') ?? ''
          return `Sesión ${i + 1} (${r.logged_date}, RPE ${r.perceived_effort ?? '?'}/10):\n${sets}`
        }).join('\n\n')
      : 'Sin sesiones previas para este día.'

    const currentSessionText = exerciseLogs.map((el) =>
      `- ${el.exercise_library?.name}: realizó ${JSON.stringify(el.sets_performed)}`
    ).join('\n')

    const plannedText = plannedExercises?.map((ex) =>
      `- ${ex.exercise_library?.name} (id: ${ex.id}): planificado ${JSON.stringify(ex.sets)}`
    ).join('\n') ?? ''

    const trainerPrompt = trainer?.ai_training_prompt
      ? `\nEstilo de entrenamiento del trainer: ${trainer.ai_training_prompt}`
      : ''

    const systemPrompt = `Sos un coach experto en fuerza y acondicionamiento físico. Analizás los datos de entrenamiento de un atleta para sugerir ajustes de carga progresiva para la próxima sesión.

Reglas estrictas:
- Solo sugerí cambios cuando esté claramente justificado (completó todas las series en el tope del rango de repeticiones con RPE bajo, o no pudo completar las series)
- Sé conservador: aumentá 2.5-5kg o 1-2 repeticiones a la vez
- Si el RPE fue alto (8+) o no completó series, mantené o reducí la carga
- Respondé ÚNICAMENTE con JSON válido, sin markdown, sin texto fuera del JSON${trainerPrompt}`

    const userMessage = `Perfil del alumno: ${student.full_name}, objetivo: ${student.current_goal}, peso: ${student.weight_kg ?? '?'}kg

Ejercicios planificados para este día de rutina:
${plannedText}

Sesión actual realizada (${log.logged_date}, RPE general ${log.perceived_effort ?? '?'}/10):
${currentSessionText}

Historial reciente para este mismo día de rutina:
${historyText}

Respondé con un array JSON de sugerencias. Cada sugerencia debe tener exactamente esta estructura:
{
  "exercise_id": "<uuid exacto del campo id de la tabla exercises>",
  "current_sets": [{"set_number": 1, "reps": 8, "weight_kg": 80}],
  "suggested_sets": [{"set_number": 1, "reps": 10, "weight_kg": 80}],
  "reasoning": "explicación breve en español"
}

Si no se necesitan cambios, respondé con un array vacío: []`

    // ── 6. Call Claude ────────────────────────────────────────────────────────
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: userMessage }],
      system: systemPrompt,
    })

    const rawContent = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
    console.log('AI response:', rawContent)

    let suggestions: AiSuggestion[]
    try {
      suggestions = JSON.parse(rawContent)
      if (!Array.isArray(suggestions)) throw new Error('Not an array')
    } catch {
      console.error('Failed to parse AI response:', rawContent)
      return new Response('AI response parse error', { status: 200 })
    }

    if (suggestions.length === 0) {
      console.log('No suggestions needed for this session')
      return new Response(JSON.stringify({ suggestions_created: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // ── 7. Save suggestions to DB ─────────────────────────────────────────────
    const rows = suggestions.map((s) => ({
      student_id: log.student_id,
      routine_day_id: log.routine_day_id,
      training_log_id: log.id,
      exercise_id: s.exercise_id,
      current_sets: s.current_sets,
      suggested_sets: s.suggested_sets,
      ai_reasoning: s.reasoning,
      status: 'pending',
    }))

    const { error: insertError } = await supabase
      .from('ai_progression_suggestions')
      .insert(rows)

    if (insertError) throw insertError

    // ── 8. Mark training log as AI-analyzed ───────────────────────────────────
    await supabase
      .from('training_logs')
      .update({ ai_analysis_triggered: true })
      .eq('id', log.id)

    console.log(`Inserted ${rows.length} suggestion(s) for training log ${log.id}`)
    return new Response(JSON.stringify({ suggestions_created: rows.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('progression-engine error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
