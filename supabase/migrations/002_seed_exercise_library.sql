-- ============================================================
-- FitFlow: Exercise Library Seed Data
-- 54 exercises across 8 muscle groups
-- ============================================================

INSERT INTO exercise_library (name, muscle_group, exercise_type, aliases) VALUES
-- CHEST (8)
('Press Banca Plano', 'chest', 'compound', ARRAY['bench press', 'press plano', 'press de banca']),
('Press Banca Inclinado', 'chest', 'compound', ARRAY['incline bench press', 'press inclinado']),
('Press Mancuernas Plano', 'chest', 'compound', ARRAY['dumbbell bench press', 'press con mancuernas']),
('Press Mancuernas Inclinado', 'chest', 'compound', ARRAY['incline dumbbell press']),
('Aperturas con Mancuernas', 'chest', 'isolation', ARRAY['dumbbell flyes', 'aperturas', 'flyes']),
('Cruces en Polea', 'chest', 'isolation', ARRAY['cable crossover', 'cruces de polea', 'cable flyes']),
('Fondos en Paralelas', 'chest', 'compound', ARRAY['dips', 'fondos', 'parallel bar dips']),
('Press en Máquina', 'chest', 'compound', ARRAY['machine chest press', 'press máquina pecho']),

-- BACK (8)
('Dominadas', 'back', 'compound', ARRAY['pull-ups', 'chin-ups', 'dominadas pronas']),
('Remo con Barra', 'back', 'compound', ARRAY['barbell row', 'remo barra', 'bent over row']),
('Remo con Mancuerna', 'back', 'compound', ARRAY['dumbbell row', 'remo mancuerna', 'one arm row']),
('Jalón al Pecho', 'back', 'compound', ARRAY['lat pulldown', 'jalón polea', 'pulldown']),
('Remo en Polea Baja', 'back', 'compound', ARRAY['cable row', 'remo polea', 'seated row']),
('Peso Muerto', 'back', 'compound', ARRAY['deadlift', 'peso muerto convencional']),
('Pullover con Mancuerna', 'back', 'isolation', ARRAY['dumbbell pullover', 'pullover']),
('Remo T-Bar', 'back', 'compound', ARRAY['t-bar row', 'remo en T']),

-- SHOULDERS (7)
('Press Militar', 'shoulders', 'compound', ARRAY['overhead press', 'press hombros', 'military press', 'OHP']),
('Press Arnold', 'shoulders', 'compound', ARRAY['arnold press', 'press arnold con mancuernas']),
('Elevaciones Laterales', 'shoulders', 'isolation', ARRAY['lateral raises', 'elevaciones laterales con mancuernas']),
('Elevaciones Frontales', 'shoulders', 'isolation', ARRAY['front raises', 'elevaciones frontales con mancuernas']),
('Pájaro', 'shoulders', 'isolation', ARRAY['rear delt fly', 'reverse fly', 'elevaciones posteriores']),
('Face Pull', 'shoulders', 'isolation', ARRAY['face pulls', 'tirón a la cara']),
('Press Mancuernas Sentado', 'shoulders', 'compound', ARRAY['seated dumbbell press', 'press sentado']),

-- LEGS (10)
('Sentadilla con Barra', 'legs', 'compound', ARRAY['barbell squat', 'sentadilla', 'squat', 'sentadilla trasera']),
('Prensa de Piernas', 'legs', 'compound', ARRAY['leg press', 'prensa', 'prensa inclinada']),
('Sentadilla Búlgara', 'legs', 'compound', ARRAY['bulgarian split squat', 'split squat', 'zancada búlgara']),
('Extensión de Cuádriceps', 'legs', 'isolation', ARRAY['leg extension', 'extensión de piernas']),
('Curl Femoral', 'legs', 'isolation', ARRAY['leg curl', 'curl de piernas', 'femoral acostado']),
('Peso Muerto Rumano', 'legs', 'compound', ARRAY['romanian deadlift', 'RDL', 'peso muerto rumano']),
('Hip Thrust', 'legs', 'compound', ARRAY['hip thrust con barra', 'empuje de cadera']),
('Sentadilla Goblet', 'legs', 'compound', ARRAY['goblet squat', 'sentadilla copa']),
('Zancadas', 'legs', 'compound', ARRAY['lunges', 'estocadas', 'zancadas caminando']),
('Gemelos en Máquina', 'legs', 'isolation', ARRAY['calf raises', 'elevación de gemelos', 'pantorrillas']),

-- ARMS (8)
('Curl con Barra', 'arms', 'isolation', ARRAY['barbell curl', 'curl bíceps barra']),
('Curl con Mancuernas', 'arms', 'isolation', ARRAY['dumbbell curl', 'curl bíceps mancuernas']),
('Curl Martillo', 'arms', 'isolation', ARRAY['hammer curl', 'curl martillo con mancuernas']),
('Curl en Polea', 'arms', 'isolation', ARRAY['cable curl', 'curl bíceps polea']),
('Press Francés', 'arms', 'isolation', ARRAY['skull crusher', 'press francés con barra', 'rompecráneos']),
('Extensión de Tríceps en Polea', 'arms', 'isolation', ARRAY['tricep pushdown', 'extensión tríceps', 'polea tríceps']),
('Fondos en Banco', 'arms', 'compound', ARRAY['bench dips', 'fondos en banco para tríceps']),
('Curl Concentrado', 'arms', 'isolation', ARRAY['concentration curl', 'curl concentrado con mancuerna']),

-- CORE (5)
('Plancha Abdominal', 'core', 'isolation', ARRAY['plank', 'plancha', 'tabla']),
('Crunch en Polea Alta', 'core', 'isolation', ARRAY['cable crunch', 'crunch polea', 'abdominales en polea']),
('Elevación de Piernas', 'core', 'isolation', ARRAY['leg raises', 'elevación de piernas colgado', 'hanging leg raise']),
('Russian Twist', 'core', 'isolation', ARRAY['giro ruso', 'russian twists']),
('Ab Wheel Rollout', 'core', 'isolation', ARRAY['rueda abdominal', 'ab roller', 'rollout']),

-- FULL BODY (4)
('Burpees', 'full_body', 'compound', ARRAY['burpee']),
('Clean and Press', 'full_body', 'compound', ARRAY['cargada y press', 'clean & press']),
('Turkish Get Up', 'full_body', 'compound', ARRAY['TGU', 'levantamiento turco']),
('Thrusters', 'full_body', 'compound', ARRAY['thruster', 'sentadilla con press']),

-- CARDIO (4)
('Cinta de Correr', 'cardio', 'cardio', ARRAY['treadmill', 'caminadora', 'correr en cinta']),
('Bicicleta Estática', 'cardio', 'cardio', ARRAY['stationary bike', 'bici fija', 'ciclo indoor']),
('Remo Ergómetro', 'cardio', 'cardio', ARRAY['rowing machine', 'remo indoor', 'ergómetro']),
('Elíptica', 'cardio', 'cardio', ARRAY['elliptical', 'máquina elíptica']);
