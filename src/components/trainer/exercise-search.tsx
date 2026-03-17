import { useState } from 'react'
import { Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { useSearchExercises } from '@/services/exercise-library'
import type { ExerciseLibrary } from '@/types/database'

const MUSCLE_GROUP_LABELS: Record<string, string> = {
  chest: 'Pecho',
  back: 'Espalda',
  shoulders: 'Hombros',
  legs: 'Piernas',
  arms: 'Brazos',
  core: 'Core',
  full_body: 'Full Body',
  cardio: 'Cardio',
}

interface ExerciseSearchProps {
  onSelect: (exercise: ExerciseLibrary) => void
}

export function ExerciseSearch({ onSelect }: ExerciseSearchProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const { data: exercises = [] } = useSearchExercises(query)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-2">
          <Search className="h-4 w-4" />
          Buscar ejercicio...
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar por nombre..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>No se encontraron ejercicios.</CommandEmpty>
            <CommandGroup>
              {exercises.map((exercise) => (
                <CommandItem
                  key={exercise.id}
                  value={exercise.id}
                  onSelect={() => {
                    onSelect(exercise)
                    setOpen(false)
                    setQuery('')
                  }}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{exercise.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {exercise.exercise_type === 'compound' ? 'Compuesto' :
                       exercise.exercise_type === 'isolation' ? 'Aislamiento' : 'Cardio'}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {MUSCLE_GROUP_LABELS[exercise.muscle_group] ?? exercise.muscle_group}
                  </Badge>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
