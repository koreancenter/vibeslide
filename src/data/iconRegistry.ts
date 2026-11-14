import {
  AlertTriangle,
  ArrowRightCircle,
  Award,
  Banknote,
  BarChart3,
  Bell,
  Bookmark,
  Bot,
  Briefcase,
  Building2,
  Calculator,
  Calendar,
  CheckCircle2,
  Clock,
  Cloud,
  Code2,
  Coins,
  Compass,
  Cpu,
  CreditCard,
  Database,
  DollarSign,
  Download,
  Eye,
  Filter,
  Flag,
  GitBranch,
  GitMerge,
  Globe,
  Handshake,
  Heart,
  Info,
  Landmark,
  Laptop,
  Layers,
  LineChart,
  ListChecks,
  Lock,
  Mail,
  Megaphone,
  MessageSquare,
  Milestone,
  PieChart,
  PlusCircle,
  Presentation,
  Receipt,
  RefreshCw,
  Repeat,
  Rocket,
  Search,
  Server,
  Settings,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Target,
  Terminal,
  Timer,
  TrendingDown,
  TrendingUp,
  Trophy,
  Upload,
  UserCheck,
  Users,
  Wallet,
  Wifi,
  Workflow,
  Zap,
  type LucideIcon,
} from "lucide-react";

export type IconCategory = "Business" | "Technology" | "Finance" | "Process" | "UI";

export const ICON_CATEGORIES: IconCategory[] = [
  "Business",
  "Technology",
  "Finance",
  "Process",
  "UI",
];

export interface IconRegistryEntry {
  id: string;
  label: string;
  category: IconCategory;
  keywords: string[];
  component: LucideIcon;
}

export const ICON_REGISTRY: IconRegistryEntry[] = [
  // Business
  { id: "briefcase", label: "Briefcase", category: "Business", keywords: ["work", "corporate", "job", "office"], component: Briefcase },
  { id: "building-2", label: "Enterprise", category: "Business", keywords: ["company", "hq", "organization", "building"], component: Building2 },
  { id: "users", label: "Team", category: "Business", keywords: ["people", "group", "collaboration", "members"], component: Users },
  { id: "user-check", label: "Verified User", category: "Business", keywords: ["stakeholder", "member", "approve", "partner"], component: UserCheck },
  { id: "target", label: "Target Goal", category: "Business", keywords: ["okr", "kpi", "aim", "strategy", "focus"], component: Target },
  { id: "award", label: "Award", category: "Business", keywords: ["badge", "achievement", "quality", "medal"], component: Award },
  { id: "trophy", label: "Trophy", category: "Business", keywords: ["winner", "success", "milestone", "leader"], component: Trophy },
  { id: "handshake", label: "Partnership", category: "Business", keywords: ["deal", "agreement", "alliance", "mou"], component: Handshake },
  { id: "presentation", label: "Presentation", category: "Business", keywords: ["deck", "pitch", "meeting", "board"], component: Presentation },
  { id: "globe", label: "Global", category: "Business", keywords: ["world", "international", "market", "region"], component: Globe },
  { id: "compass", label: "Strategy", category: "Business", keywords: ["direction", "vision", "roadmap", "explore"], component: Compass },
  { id: "megaphone", label: "Launch", category: "Business", keywords: ["marketing", "announce", "campaign", "growth"], component: Megaphone },
  { id: "rocket", label: "Growth", category: "Business", keywords: ["startup", "scale", "accelerate", "boost"], component: Rocket },

  // Technology
  { id: "cpu", label: "Processor", category: "Technology", keywords: ["hardware", "compute", "chip", "ai"], component: Cpu },
  { id: "database", label: "Database", category: "Technology", keywords: ["storage", "sql", "data", "records"], component: Database },
  { id: "server", label: "Server", category: "Technology", keywords: ["infrastructure", "backend", "host", "node"], component: Server },
  { id: "cloud", label: "Cloud", category: "Technology", keywords: ["saas", "sync", "hosting", "platform"], component: Cloud },
  { id: "code-2", label: "Code", category: "Technology", keywords: ["dev", "software", "engineering", "api"], component: Code2 },
  { id: "terminal", label: "CLI", category: "Technology", keywords: ["shell", "script", "system", "command"], component: Terminal },
  { id: "wifi", label: "Connectivity", category: "Technology", keywords: ["network", "wireless", "signal", "iot"], component: Wifi },
  { id: "shield-check", label: "Security", category: "Technology", keywords: ["compliance", "trust", "protect", "audit"], component: ShieldCheck },
  { id: "lock", label: "Privacy", category: "Technology", keywords: ["encrypt", "auth", "access", "safe"], component: Lock },
  { id: "smartphone", label: "Mobile", category: "Technology", keywords: ["app", "ios", "android", "device"], component: Smartphone },
  { id: "laptop", label: "Workstation", category: "Technology", keywords: ["desktop", "web", "client", "computer"], component: Laptop },
  { id: "bot", label: "AI Agent", category: "Technology", keywords: ["automation", "llm", "assistant", "smart"], component: Bot },
  { id: "sparkles", label: "AI Magic", category: "Technology", keywords: ["intelligence", "generative", "new", "highlight"], component: Sparkles },
  { id: "zap", label: "Fast Sync", category: "Technology", keywords: ["speed", "instant", "energy", "performance"], component: Zap },

  // Finance
  { id: "dollar-sign", label: "Revenue", category: "Finance", keywords: ["money", "usd", "price", "budget"], component: DollarSign },
  { id: "trending-up", label: "Growth Up", category: "Finance", keywords: ["increase", "roi", "profit", "chart"], component: TrendingUp },
  { id: "trending-down", label: "Cost Down", category: "Finance", keywords: ["reduction", "savings", "decline", "metric"], component: TrendingDown },
  { id: "bar-chart-3", label: "Bar Analytics", category: "Finance", keywords: ["metrics", "kpi", "report", "stats"], component: BarChart3 },
  { id: "pie-chart", label: "Allocation", category: "Finance", keywords: ["share", "split", "distribution", "donut"], component: PieChart },
  { id: "line-chart", label: "Forecast", category: "Finance", keywords: ["trend", "projection", "timeline", "analytics"], component: LineChart },
  { id: "wallet", label: "Treasury", category: "Finance", keywords: ["funds", "account", "payment", "capital"], component: Wallet },
  { id: "credit-card", label: "Billing", category: "Finance", keywords: ["checkout", "subscription", "spend", "card"], component: CreditCard },
  { id: "coins", label: "Capital", category: "Finance", keywords: ["assets", "investment", "margin", "tokens"], component: Coins },
  { id: "banknote", label: "Cash Flow", category: "Finance", keywords: ["income", "payout", "currency", "finance"], component: Banknote },
  { id: "landmark", label: "Banking", category: "Finance", keywords: ["institution", "government", "policy", "reserve"], component: Landmark },
  { id: "receipt", label: "Invoice", category: "Finance", keywords: ["expense", "audit", "ledger", "statement"], component: Receipt },
  { id: "calculator", label: "Valuation", category: "Finance", keywords: ["estimate", "model", "accounting", "tax"], component: Calculator },

  // Process
  { id: "git-branch", label: "Branching", category: "Process", keywords: ["workflow", "split", "decision", "path"], component: GitBranch },
  { id: "git-merge", label: "Integration", category: "Process", keywords: ["combine", "unify", "synergy", "flow"], component: GitMerge },
  { id: "workflow", label: "Pipeline", category: "Process", keywords: ["automation", "diagram", "steps", "ops"], component: Workflow },
  { id: "repeat", label: "Iteration", category: "Process", keywords: ["loop", "cycle", "agile", "sprint"], component: Repeat },
  { id: "refresh-cw", label: "Continuous Sync", category: "Process", keywords: ["update", "reload", "lifecycle", "loop"], component: RefreshCw },
  { id: "arrow-right-circle", label: "Next Step", category: "Process", keywords: ["proceed", "action", "transition", "move"], component: ArrowRightCircle },
  { id: "check-circle-2", label: "Completed", category: "Process", keywords: ["done", "verified", "approved", "pass"], component: CheckCircle2 },
  { id: "clock", label: "Timeline", category: "Process", keywords: ["time", "duration", "schedule", "sla"], component: Clock },
  { id: "calendar", label: "Schedule", category: "Process", keywords: ["date", "quarter", "roadmap", "event"], component: Calendar },
  { id: "timer", label: "Sprint", category: "Process", keywords: ["deadline", "countdown", "speed", "efficiency"], component: Timer },
  { id: "milestone", label: "Milestone", category: "Process", keywords: ["phase", "checkpoint", "roadmap", "signpost"], component: Milestone },
  { id: "layers", label: "Architecture", category: "Process", keywords: ["stack", "tiers", "modules", "system"], component: Layers },
  { id: "flag", label: "Goal Flag", category: "Process", keywords: ["priority", "launch", "finish", "target"], component: Flag },
  { id: "list-checks", label: "Checklist", category: "Process", keywords: ["tasks", "deliverables", "audit", "plan"], component: ListChecks },

  // UI
  { id: "search", label: "Search", category: "UI", keywords: ["find", "inspect", "discovery", "zoom"], component: Search },
  { id: "settings", label: "Settings", category: "UI", keywords: ["config", "gear", "options", "controls"], component: Settings },
  { id: "bell", label: "Alert", category: "UI", keywords: ["notification", "reminder", "update", "ping"], component: Bell },
  { id: "mail", label: "Email", category: "UI", keywords: ["contact", "message", "inbox", "newsletter"], component: Mail },
  { id: "message-square", label: "Feedback", category: "UI", keywords: ["chat", "comment", "review", "note"], component: MessageSquare },
  { id: "star", label: "Featured", category: "UI", keywords: ["favorite", "rating", "top", "priority"], component: Star },
  { id: "heart", label: "Engagement", category: "UI", keywords: ["like", "love", "health", "retention"], component: Heart },
  { id: "bookmark", label: "Bookmark", category: "UI", keywords: ["save", "tag", "reference", "mark"], component: Bookmark },
  { id: "filter", label: "Filter", category: "UI", keywords: ["funnel", "segment", "narrow", "sort"], component: Filter },
  { id: "download", label: "Download", category: "UI", keywords: ["export", "save", "file", "import"], component: Download },
  { id: "upload", label: "Upload", category: "UI", keywords: ["publish", "send", "share", "cloud"], component: Upload },
  { id: "eye", label: "Visibility", category: "UI", keywords: ["view", "preview", "insight", "observe"], component: Eye },
  { id: "plus-circle", label: "Add New", category: "UI", keywords: ["create", "expand", "insert", "more"], component: PlusCircle },
  { id: "alert-triangle", label: "Warning", category: "UI", keywords: ["risk", "caution", "issue", "blocker"], component: AlertTriangle },
  { id: "info", label: "Info", category: "UI", keywords: ["help", "details", "note", "tooltip"], component: Info },
];

const ICON_MAP = new Map<string, IconRegistryEntry>(
  ICON_REGISTRY.map((entry) => [entry.id, entry])
);

export function getIconEntry(iconName?: string): IconRegistryEntry | undefined {
  if (!iconName) return undefined;
  return ICON_MAP.get(iconName);
}

export function getLucideIconComponent(iconName?: string): LucideIcon {
  return ICON_MAP.get(iconName || "")?.component || Sparkles;
}
