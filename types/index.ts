export interface UserProfile {
  id: string
  email: string
  created_at: string
  onboarding_completed: boolean
  shadow_mode_ends_at: string | null
  ai_profile: AIProfile
  preferences: UserPreferences
}

export interface AIProfile {
  identity_contexts: IdentityContext[]
  energy_windows: EnergyWindow[]
  life_goals: LifeGoal[]
  current_blockers: string[]
  tried_and_failed: string[]
  productivity_patterns: ProductivityPattern[]
  collapse_risk_score: number
  last_updated: string
}

export interface IdentityContext {
  label: string
  description: string
  goals: string[]
  energy_weight: number
}

export interface EnergyWindow {
  time_start: string
  time_end: string
  type: "creative" | "mechanical" | "social" | "recovery"
  intensity: number
}

export interface LifeGoal {
  id: string
  title: string
  horizon: "short" | "medium" | "long"
  identity_link: string
  progress: number
}

export interface ProductivityPattern {
  pattern: string
  confidence: number
  observed_at: string
}

export interface UserPreferences {
  theme: "light" | "dark" | "system"
  notification_time: string
  weekly_replay_day: number
  language: string
}

export interface Task {
  id: string
  user_id: string
  title: string
  description?: string
  status: "pending" | "in_progress" | "done" | "cancelled"
  priority_score: number
  urgency: number
  impact: number
  energy_cost: number
  context_tag: ContextTag
  goal_id?: string
  due_date?: string
  scheduled_at?: string
  completed_at?: string
  created_at: string
  updated_at: string
  ai_notes?: string
}

export interface Goal {
  id: string
  user_id: string
  title: string
  description?: string
  horizon: "short" | "medium" | "long"
  identity_link?: string
  progress: number
  status: "active" | "paused" | "completed" | "cancelled"
  target_date?: string
  weekly_micro_actions: MicroAction[]
  created_at: string
  updated_at: string
  ai_notes?: string
  days_stalled: number
}

export interface MicroAction {
  id: string
  title: string
  completed: boolean
  week: string
}

export interface CalendarEvent {
  id: string
  user_id: string
  title: string
  description?: string
  start_at: string
  end_at: string
  context_tag: ContextTag
  is_protected: boolean
  is_ai_scheduled: boolean
  task_id?: string
  goal_id?: string
  created_at: string
  updated_at: string
}

export interface CheckIn {
  id: string
  user_id: string
  mood: number
  energy: number
  focus: number
  notes?: string
  created_at: string
  date: string
}

export interface AIDailyBriefing {
  id: string
  user_id: string
  content: string
  generated_at: string
  date: string
  trigger: "morning" | "checkin" | "crisis" | "goal_completed"
}

export interface WeeklyReplay {
  id: string
  user_id: string
  week_start: string
  week_end: string
  content: WeeklyReplayContent
  generated_at: string
}

export interface WeeklyReplayContent {
  narrative: string
  planned_vs_executed: { planned: number; executed: number }
  win_moments: string[]
  derail_moment: string
  ai_learnings: string[]
  next_week_adjustments: string[]
}

export interface OnboardingMessage {
  role: "user" | "assistant"
  content: string
}

export type ContextTag =
  | "work"
  | "health"
  | "creativity"
  | "social"
  | "learning"
  | "finance"
  | "personal"

export interface DailyPlan {
  date: string
  time_blocks: TimeBlock[]
  priority_tasks: Task[]
  briefing: AIDailyBriefing | null
  check_in: CheckIn | null
}

export interface TimeBlock {
  start: string
  end: string
  type: "focus" | "meeting" | "break" | "buffer" | "protected"
  task_id?: string
  event_id?: string
  label: string
}

export interface CollapseSignal {
  type: "task_avoidance" | "low_energy_streak" | "goal_stall" | "check_in_skip"
  severity: "low" | "medium" | "high"
  details: string
  detected_at: string
}

export interface NegotiationPlan {
  id: string
  title: string
  description: string
  cost: string
  affected_areas: string[]
  recovery_days: number
}
