import { DEMO_PROFILE } from "@/lib/demo/mockData"
import DemoShell from "@/components/demo/DemoShell"

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <DemoShell profile={DEMO_PROFILE}>{children}</DemoShell>
}
