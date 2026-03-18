import { useState } from 'react'
import { BrainCircuit, Check, X, ChevronDown, ChevronUp, User } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { usePendingSuggestions, useReviewSuggestion, type SuggestionWithContext } from '@/services/ai-suggestions'
import type { PlannedSet } from '@/types/database'

function SetsComparison({ current, suggested }: { current: PlannedSet[]; suggested: PlannedSet[] }) {
  const maxSets = Math.max(current.length, suggested.length)
  return (
    <div className="overflow-hidden rounded-lg border text-sm">
      <div className="grid grid-cols-3 border-b bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
        <span>Serie</span>
        <span>Actual</span>
        <span className="text-primary">Sugerido</span>
      </div>
      {Array.from({ length: maxSets }, (_, i) => {
        const cur = current[i]
        const sug = suggested[i]
        const changed =
          cur && sug && (cur.reps !== sug.reps || cur.weight_kg !== sug.weight_kg)
        return (
          <div
            key={i}
            className={`grid grid-cols-3 px-3 py-2 ${changed ? 'bg-primary/5' : ''} ${i < maxSets - 1 ? 'border-b' : ''}`}
          >
            <span className="text-muted-foreground">{i + 1}</span>
            <span>{cur ? `${cur.reps} × ${cur.weight_kg}kg` : '—'}</span>
            <span className={`font-medium ${changed ? 'text-primary' : ''}`}>
              {sug ? `${sug.reps} × ${sug.weight_kg}kg` : '—'}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function SuggestionCard({ suggestion }: { suggestion: SuggestionWithContext }) {
  const [showReasoning, setShowReasoning] = useState(false)
  const [message, setMessage] = useState('')
  const [confirming, setConfirming] = useState<'approve' | 'reject' | null>(null)
  const review = useReviewSuggestion()

  const exerciseName =
    suggestion.exercises?.exercise_library?.name ?? 'Ejercicio'
  const studentName = suggestion.students?.full_name ?? 'Alumno'
  const dayName = suggestion.routine_days?.name ?? 'Día'
  const date = new Date(suggestion.created_at).toLocaleDateString('es-AR')

  const handleReview = async (status: 'approved' | 'rejected') => {
    try {
      await review.mutateAsync({ id: suggestion.id, status, message: message.trim() || undefined })
      toast.success(status === 'approved' ? 'Sugerencia aprobada' : 'Sugerencia rechazada')
    } catch {
      toast.error('Error al procesar la sugerencia')
    }
  }

  if (confirming) {
    return (
      <Card className={confirming === 'approve' ? 'border-green-200' : 'border-destructive/30'}>
        <CardContent className="space-y-4 pt-5">
          <div>
            <p className="font-medium">
              {confirming === 'approve'
                ? `¿Aprobar sugerencia para ${studentName}?`
                : `¿Rechazar sugerencia para ${studentName}?`}
            </p>
            <p className="text-sm text-muted-foreground">{exerciseName} · {dayName}</p>
          </div>
          <Textarea
            placeholder={
              confirming === 'approve'
                ? 'Mensaje opcional para el alumno...'
                : 'Nota interna opcional...'
            }
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            className="text-sm"
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setConfirming(null)}
              disabled={review.isPending}
            >
              Cancelar
            </Button>
            <Button
              className={`flex-1 ${confirming === 'reject' ? 'bg-destructive hover:bg-destructive/90' : ''}`}
              onClick={() => handleReview(confirming)}
              disabled={review.isPending}
            >
              {review.isPending
                ? 'Procesando...'
                : confirming === 'approve'
                ? 'Confirmar aprobación'
                : 'Confirmar rechazo'}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{exerciseName}</span>
              <Badge variant="secondary" className="text-xs">{dayName}</Badge>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              <span>{studentName}</span>
              <span>·</span>
              <span>{date}</span>
            </div>
          </div>
          <Badge className="shrink-0 bg-amber-100 text-amber-800 hover:bg-amber-100">
            Pendiente
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <SetsComparison
          current={suggestion.current_sets}
          suggested={suggestion.suggested_sets}
        />

        {suggestion.ai_reasoning && (
          <div>
            <button
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
              onClick={() => setShowReasoning(!showReasoning)}
            >
              <BrainCircuit className="h-3.5 w-3.5" />
              Razonamiento de la IA
              {showReasoning ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            {showReasoning && (
              <p className="mt-2 rounded-lg bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
                {suggestion.ai_reasoning}
              </p>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 gap-2 border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive"
            onClick={() => setConfirming('reject')}
          >
            <X className="h-4 w-4" />
            Rechazar
          </Button>
          <Button
            className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
            onClick={() => setConfirming('approve')}
          >
            <Check className="h-4 w-4" />
            Aprobar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function TrainerApprovalsPage() {
  const { data: suggestions = [], isLoading } = usePendingSuggestions()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BrainCircuit className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Aprobaciones IA</h1>
          <p className="text-sm text-muted-foreground">
            {suggestions.length > 0
              ? `${suggestions.length} sugerencia(s) pendiente(s) de revisión`
              : 'Sin sugerencias pendientes'}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : suggestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20">
          <BrainCircuit className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-medium">Todo al día</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            No hay sugerencias de la IA pendientes de revisión.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {suggestions.map((s) => (
            <SuggestionCard key={s.id} suggestion={s} />
          ))}
        </div>
      )}
    </div>
  )
}
