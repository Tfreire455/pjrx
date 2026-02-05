import { z } from "zod";

// --- SCHEMAS AUXILIARES HÍBRIDOS (Aceitam String ou Objeto) ---

// A IA às vezes manda só uma string: "Risco de atraso no banco"
// Às vezes manda objeto: { title: "Risco...", severity: "high" }
const LooseRiskSchema = z.union([
  z.string(),
  z.object({
    title: z.string().optional(),
    severity: z.string().optional(), // Aceita qualquer string, não só enum estrito
    reason: z.string().optional(),
    mitigation: z.string().optional(),
    risk: z.string().optional(), // IA às vezes chama de 'risk' em vez de title
    description: z.string().optional()
  })
]);

const LooseNextActionSchema = z.union([
  z.string(),
  z.object({
    title: z.string().optional(),
    ownerHint: z.string().optional(),
    dueHint: z.string().optional(),
    why: z.string().optional(),
    description: z.string().optional()
  })
]);

// --- SCHEMA DO PLANO DE PROJETO (Ajustado para o JSON real da IA) ---

export const ProjectPlanSchema = z.object({
  // IA pode mandar 'projectName', 'title' ou nada
  projectName: z.string().optional(),
  
  // IA pode mandar 'description', 'summary' ou ambos
  summary: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  
  // Campo novo útil que a IA mandou
  stack: z.array(z.string()).default([]),
  
  assumptions: z.array(z.string()).default([]),

  milestones: z.array(z.object({
    // Compatibilidade dupla: name/outcome (seu) vs milestoneName/criteria (IA)
    name: z.string().optional(),
    milestoneName: z.string().optional(),
    
    outcome: z.string().optional(),
    criteria: z.string().optional(),
    
    dueHint: z.string().optional(),
    sprint: z.union([z.string(), z.number()]).optional()
  })).default([]), // Default [] impede erro se vier null

  sprints: z.array(z.object({
    sprintNumber: z.number().optional(),
    durationWeeks: z.number().optional(),
    
    name: z.string().optional(),
    goal: z.string().optional(),
    
    // IA mandou 'goals' (array) em vez de 'goal' (string)
    goals: z.array(z.string()).default([]),
    
    // IA mandou 'deliverables'
    deliverables: z.array(z.string()).default([]),
    
    // IA mandou tasks? Se não, array vazio.
    tasks: z.array(z.union([
        z.string(), // Caso mande tasks como lista de strings
        z.object({
            title: z.string().optional(),
            description: z.string().optional(),
            priority: z.string().optional(),
            status: z.string().optional(),
            estimateHint: z.string().optional(),
            dependencies: z.array(z.string()).default([])
        })
    ])).default([])
  })).default([]),

  risks: z.array(LooseRiskSchema).default([]),
  nextActions: z.array(LooseNextActionSchema).default([])
});

// --- OUTROS SCHEMAS (Mantendo estrutura, mas relaxando validação) ---

export const WeeklyReportSchema = z.object({
  period: z.object({
    from: z.string().optional(),
    to: z.string().optional()
  }).optional(),
  
  highlights: z.array(z.string()).default([]),
  
  metrics: z.object({
    tasksCreated: z.number().optional().default(0),
    tasksCompleted: z.number().optional().default(0),
    tasksBlocked: z.number().optional().default(0),
    overdue: z.number().optional().default(0)
  }).optional(),
  
  risks: z.array(LooseRiskSchema).default([]),
  nextActions: z.array(LooseNextActionSchema).default([])
});

export const InnovationsSchema = z.object({
  theme: z.string().optional(),
  suggestions: z.array(z.object({
    title: z.string().optional(),
    impact: z.string().optional(),
    effort: z.string().optional(),
    rationale: z.string().optional(),
    firstSteps: z.array(z.string()).default([])
  })).default([]),
  
  risks: z.array(LooseRiskSchema).default([]),
  nextActions: z.array(LooseNextActionSchema).default([])
});

export const ImplementationPlanSchema = z.object({
  feature: z.string().optional(),
  scope: z.array(z.string()).default([]),
  outOfScope: z.array(z.string()).default([]),
  
  backendPlan: z.array(z.object({
    step: z.string().optional(),
    files: z.array(z.string()).default([]),
    notes: z.string().optional()
  })).default([]),
  
  frontendPlan: z.array(z.object({
    step: z.string().optional(),
    files: z.array(z.string()).default([]),
    notes: z.string().optional()
  })).default([]),
  
  dataModelChanges: z.array(z.string()).default([]),
  tests: z.array(z.string()).default([]),
  
  risks: z.array(LooseRiskSchema).default([]),
  nextActions: z.array(LooseNextActionSchema).default([])
});