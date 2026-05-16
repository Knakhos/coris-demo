import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { UserProfile, Task, Goal, CalendarEvent, CheckIn, AIDailyBriefing } from "@/types"

interface AppState {
  profile: UserProfile | null
  tasks: Task[]
  goals: Goal[]
  events: CalendarEvent[]
  todayCheckIn: CheckIn | null
  recentCheckIns: CheckIn[]
  todayBriefing: AIDailyBriefing | null
  activeTab: "today" | "calendar" | "todos" | "goals" | "stats"
  isChatOpen: boolean
  isCrisisMode: boolean

  setProfile: (profile: UserProfile) => void
  setTasks: (tasks: Task[]) => void
  addTask: (task: Task) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  removeTask: (id: string) => void
  setGoals: (goals: Goal[]) => void
  addGoal: (goal: Goal) => void
  updateGoal: (id: string, updates: Partial<Goal>) => void
  setEvents: (events: CalendarEvent[]) => void
  addEvent: (event: CalendarEvent) => void
  setTodayCheckIn: (checkIn: CheckIn) => void
  setRecentCheckIns: (checkIns: CheckIn[]) => void
  setTodayBriefing: (briefing: AIDailyBriefing) => void
  setActiveTab: (tab: AppState["activeTab"]) => void
  setIsChatOpen: (open: boolean) => void
  setIsCrisisMode: (crisis: boolean) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      profile: null,
      tasks: [],
      goals: [],
      events: [],
      todayCheckIn: null,
      recentCheckIns: [],
      todayBriefing: null,
      activeTab: "today",
      isChatOpen: false,
      isCrisisMode: false,

      setProfile: (profile) => set({ profile }),
      setTasks: (tasks) => set({ tasks }),
      addTask: (task) => set((s) => ({ tasks: [...s.tasks, task] })),
      updateTask: (id, updates) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),
      removeTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
      setGoals: (goals) => set({ goals }),
      addGoal: (goal) => set((s) => ({ goals: [...s.goals, goal] })),
      updateGoal: (id, updates) =>
        set((s) => ({
          goals: s.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
        })),
      setEvents: (events) => set({ events }),
      addEvent: (event) => set((s) => ({ events: [...s.events, event] })),
      setTodayCheckIn: (checkIn) => set({ todayCheckIn: checkIn }),
      setRecentCheckIns: (checkIns) => set({ recentCheckIns: checkIns }),
      setTodayBriefing: (briefing) => set({ todayBriefing: briefing }),
      setActiveTab: (activeTab) => set({ activeTab }),
      setIsChatOpen: (isChatOpen) => set({ isChatOpen }),
      setIsCrisisMode: (isCrisisMode) => set({ isCrisisMode }),
    }),
    {
      name: "coris-store",
      partialize: (state) => ({ activeTab: state.activeTab }),
    }
  )
)
