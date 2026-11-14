export type Language = "en" | "ko" | "ja" | "id" | "dual" | "both";

export type SlideLayout =
  | "cover"
  | "overview"
  | "cards-3"
  | "cards-2"
  | "delegation-table"
  | "schedule-table"
  | "action-items"
  | "process-3"
  | "split-info"
  | "key-stats"
  | "full-image"
  | "chart-bar"
  | "chart-line"
  | "chart-donut"
  | "chart-waterfall"
  | "comparison-table"
  | "feature-matrix"
  | "general";

export type SlideTransition = "fade" | "slide-in" | "wipe" | "zoom" | "flip" | "none";

export interface AutoLayoutAnalysis {
  recommendedLayout: SlideLayout;
  currentLayout: SlideLayout;
  isOptimal: boolean;
  textDensity: "minimal" | "compact" | "moderate" | "dense" | "heavy";
  totalLengthKo: number;
  totalLengthId: number;
  bulletCount: number;
  hasImage: boolean;
  hasStats: boolean;
  hasTable: boolean;
  balanceScore: number; // 0 to 100
  reasonKo: string;
  reasonId: string;
  alternatives: {
    layout: SlideLayout;
    labelKo: string;
    labelId: string;
    fitScore: number;
  }[];
}

export interface BulletItem {
  id: string;
  titleKo: string;
  titleId: string;
  titleJa?: string;
  descKo: string;
  descId: string;
  descJa?: string;
  icon?: string;
  tagKo?: string;
  tagId?: string;
  tagJa?: string;
}

export interface DelegateItem {
  no: number;
  universityKo: string;
  universityId: string;
  countKo: string;
  countId: string;
  namesKo: string;
  namesId: string;
  rolesKo: string;
  rolesId: string;
}

export interface ScheduleEvent {
  date: string;
  time: string;
  titleKo: string;
  titleId: string;
  detailKo: string;
  detailId: string;
  locationKo: string;
  locationId: string;
  type?: "flight" | "ceremony" | "meeting" | "gov" | "tour";
}

export interface ProcessStage {
  stage: number;
  badgeKo: string;
  badgeId: string;
  titleKo: string;
  titleId: string;
  descKo: string;
  descId: string;
  bulletsKo: string[];
  bulletsId: string[];
}

export interface StatItem {
  labelKo: string;
  labelId: string;
  labelJa?: string;
  value: string;
  unitKo?: string;
  unitId?: string;
  unitJa?: string;
  subKo?: string;
  subId?: string;
  subJa?: string;
}

export interface SlideImage {
  url: string;
  captionKo?: string;
  captionId?: string;
  captionJa?: string;
  position?: "right" | "left" | "top" | "bottom" | "background" | "inline";
  aspect?: "16:9" | "4:3" | "1:1" | "cover";
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "full";
  shadow?: boolean;
}

export type CanvasElementType = "text" | "image" | "shape" | "icon" | "connector";

export type CanvasShapeVariant =
  | "rectangle"
  | "rounded"
  | "circle"
  | "pill"
  | "line"
  | "triangle"
  | "diamond"
  | "callout"
  | "arrow-right"
  | "arrow-left"
  | "arrow-up"
  | "arrow-down"
  | "arrow-bidirectional";

export type CanvasShapeStylePreset = "solid" | "outline" | "glass" | "shadow";

export type CanvasConnectorType = "straight" | "elbow";

export type CanvasAnchorSide = "auto" | "top" | "right" | "bottom" | "left";

export interface CanvasConnectorData {
  sourceId: string;
  targetId: string;
  connectorType: CanvasConnectorType;
  arrowStart?: boolean;
  arrowEnd?: boolean;
  sourceAnchor?: CanvasAnchorSide;
  targetAnchor?: CanvasAnchorSide;
}

export interface CanvasElementStyle {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  color?: string;
  fontSize?: number;
  fontWeight?: "normal" | "medium" | "semibold" | "bold" | "extrabold";
  textAlign?: "left" | "center" | "right";
  opacity?: number;
  shapeVariant?: CanvasShapeVariant;
  shapePreset?: CanvasShapeStylePreset;
  objectFit?: "cover" | "contain";
  boxShadow?: string;
  backdropFilter?: string;
  strokeWidth?: number;
  iconName?: string;
}

export interface CanvasElement {
  id: string;
  type: CanvasElementType;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 0-100
  height: number; // percentage 0-100
  rotation: number; // degrees
  zIndex: number;
  content: string;
  style: CanvasElementStyle;
  connector?: CanvasConnectorData;
}

export interface SlideData {
  id: string;
  slideNumber: number;
  layout: SlideLayout;
  categoryKo: string;
  categoryId: string;
  categoryJa?: string;
  tagKo?: string;
  tagId?: string;
  tagJa?: string;
  docCode?: string;
  
  // Headers
  titleKo: string;
  titleId: string;
  titleJa?: string;
  subtitleKo: string;
  subtitleId: string;
  subtitleJa?: string;
  
  // Content structures
  bullets?: BulletItem[];
  delegates?: DelegateItem[];
  schedule?: ScheduleEvent[];
  processStages?: ProcessStage[];
  stats?: StatItem[];
  customTable?: { headers: string[]; rows: string[][] };
  
  // Footnote / Callout
  calloutKo?: string;
  calloutId?: string;
  calloutJa?: string;
  
  // Media
  image?: SlideImage;

  // Free-form interactive overlay elements layered over preset layouts
  overlayElements?: CanvasElement[];
  
  // Presenter notes
  notesKo?: string;
  notesId?: string;
  notesJa?: string;
  
  // Slide transition effect
  transition?: SlideTransition;

  // Granular Component Build-In Sequence Animation
  buildInConfig?: ComponentBuildInConfig;

  // Theme override (optional)
  themeOverride?: string;
  customBg?: string;
  customAccentColor?: string;
  customAccentSecondary?: string;
  customBadgeBg?: string;
  customBadgeText?: string;
}

export type Slide = SlideData;

export interface HistorySnapshot {
  slides: SlideData[];
  activeSlideIndex: number;
  actionDescription?: string;
  timestamp: number;
}

export interface PresentationTheme {
  id: string;
  name: string;
  description: string;
  bgColor: string;
  canvasBg: string;
  cardBg: string;
  textColor: string;
  textMuted: string;
  accentColor: string;
  accentSecondary: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  fontFamily?: string;
  backgroundImage?: string;
}

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: string;
  iconLink?: string;
  webViewLink?: string;
  version?: string;
}

export interface DriveSyncConfig {
  isConnected: boolean;
  fileId: string | null;
  fileName: string | null;
  fileMimeType: string | null;
  lastModifiedTime: string | null;
  lastSyncedAt: number | null;
  autoSync: boolean;
  intervalSeconds: number; // e.g., 5, 10, 30, 60
  syncMode: "auto-apply" | "prompt";
  accessToken: string | null;
  tokenExpiresAt: number | null;
  userEmail?: string;
}

export interface DriveSyncLog {
  id: string;
  timestamp: number;
  fileName: string;
  changeDetected: boolean;
  message: string;
  status: "success" | "pending" | "error";
  slidesCount?: number;
}

export interface SlideBlock {
  id: string;
  type: "text" | "bullet" | "stat" | "image" | "table";
  contentKo: string;
  contentId: string;
}

export interface SlideDocument {
  title: string;
  slides: SlideData[];
}

export type AiTonePreset = "quiet-luxury" | "consulting" | "startup-pitch" | "academic";

export type AiProviderType = "gemini-cloud" | "local-ollama" | "offline-rule";

export interface AiModelConfig {
  provider: AiProviderType;
  modelName: string;
  localEndpoint?: string;
  tone: AiTonePreset;
  apiKey?: string;
}

export interface RagPatchSuggestion {
  id?: string;
  slideIndex: number;
  targetField: string; // e.g. "stats[0].value", "subtitleKo", "bullets[1].descKo", "calloutKo"
  oldValue: string;
  newValue: string;
  rationale: string;
  applied?: boolean;
}

export interface RagDiffAnalysisResponse {
  suggestions: RagPatchSuggestion[];
  sourceDocumentTitle?: string;
  metricsExtractedCount?: number;
  analyzedAt?: number;
  note?: string;
}

export interface DesignConstitution {
  enabled: boolean;
  rulesText: string; // Consolidated natural language tone & style guidelines
  attachedFileName?: string;
}

export type ComponentAnimationType = "fade" | "slide-up" | "slide-right" | "zoom-in" | "flip-up";

export interface ComponentBuildInConfig {
  enabled: boolean;
  animation: ComponentAnimationType;
  staggerDelay: number;
  sequenceMode: "auto" | "click";
}

export interface CollabUser {
  id: string;
  name: string;
  color: string;
  avatar?: string;
  activeSlideIndex: number;
  cursor?: {
    x: number; // percentage (0-100)
    y: number; // percentage (0-100)
    slideIndex: number;
  };
  lastSeen: number;
}

export interface CollabRoomState {
  room: string;
  version: number;
  users: CollabUser[];
  lastModified: number;
}

export interface PublishedDeckMeta {
  id: string;
  title: string;
  createdAt: number;
  slideCount: number;
  shareUrl: string;
  embedUrl: string;
  themeId?: string;
  author?: string;
}




