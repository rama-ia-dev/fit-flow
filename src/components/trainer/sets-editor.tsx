import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { PlannedSet } from '@/types/database'

interface SetsEditorProps {
  sets: PlannedSet[]
  onChange: (sets: PlannedSet[]) => void
}

export function SetsEditor({ sets: rawSets, onChange }: SetsEditorProps) {
  const sets: PlannedSet[] = Array.isArray(rawSets)
    ? rawSets
    : typeof rawSets === 'string'
      ? JSON.parse(rawSets)
      : [{ set_number: 1, reps: 8, weight_kg: 0 }]
  const addSet = () => {
    const lastSet = sets[sets.length - 1]
    onChange([
      ...sets,
      {
        set_number: sets.length + 1,
        reps: lastSet?.reps ?? 8,
        weight_kg: lastSet?.weight_kg ?? 0,
        rpe: lastSet?.rpe,
      },
    ])
  }

  const removeSet = (index: number) => {
    const newSets = sets.filter((_, i) => i !== index).map((s, i) => ({ ...s, set_number: i + 1 }))
    onChange(newSets)
  }

  const updateSet = (index: number, field: keyof PlannedSet, value: number) => {
    const newSets = sets.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    onChange(newSets)
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[40px_1fr_1fr_80px_40px] items-center gap-2 text-xs font-medium text-muted-foreground">
        <span>#</span>
        <span>Reps</span>
        <span>Peso (kg)</span>
        <span>RPE</span>
        <span />
      </div>
      {sets.map((set, index) => (
        <div key={set.set_number} className="grid grid-cols-[40px_1fr_1fr_80px_40px] items-center gap-2">
          <span className="text-center text-sm font-medium text-muted-foreground">{set.set_number}</span>
          <Input
            type="number"
            min={1}
            value={set.reps}
            onChange={(e) => updateSet(index, 'reps', Number(e.target.value))}
            className="h-9"
          />
          <Input
            type="number"
            min={0}
            step={2.5}
            value={set.weight_kg}
            onChange={(e) => updateSet(index, 'weight_kg', Number(e.target.value))}
            className="h-9"
          />
          <Input
            type="number"
            min={1}
            max={10}
            value={set.rpe ?? ''}
            onChange={(e) => updateSet(index, 'rpe', e.target.value ? Number(e.target.value) : 0)}
            placeholder="—"
            className="h-9"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-destructive"
            onClick={() => removeSet(index)}
            disabled={sets.length <= 1}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full gap-2" onClick={addSet}>
        <Plus className="h-3 w-3" />
        Agregar serie
      </Button>
    </div>
  )
}
