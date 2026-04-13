// ── User & Auth ──

export type UserRole = "ADMIN" | "MANAGER" | "PARTNER";
export type UserStatus = "ACTIVE" | "BLOCKED" | "PENDING";

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  companyName?: string;
}

// ── Door Systems ──

export interface DoorSystem {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
  minWidth: number;
  maxWidth: number;
  maxFullWidth?: number;
  hasExtraField: boolean;
  isActive: boolean;
  videoUrl?: string;
  posterUrl?: string;
  tooltipWidthUrl?: string;
  tooltipHeightUrl?: string;
  tooltipOpenUrl?: string;
  subsystems: Subsystem[];
}

export interface Subsystem {
  id: string;
  systemId: string;
  name: string;
  minWidth: number;
  maxWidth: number;
  sortOrder: number;
  isActive: boolean;
  videoUrl?: string;
  posterUrl?: string;
  params: Record<string, unknown>;
}

// ── Components & Pricing ──

export interface Component {
  id: string;
  key: string;
  name: string;
  unit: string;
  category: "component" | "glass" | "service" | "shotlan";
  defaultPrice: number;
  isActive: boolean;
}

export interface PartnerPrice {
  id: string;
  partnerId: string;
  componentId: string;
  price: number;
}

// ── Glass & Shotlan ──

export interface GlassType {
  id: string;
  name: string;
  defaultPrice: number;
  sortOrder: number;
  isActive: boolean;
  imageUrl?: string;
  mobileImageUrl?: string;
  restrictedShotlans: string[];
}

export interface ShotlanOption {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  imageUrl?: string;
  mobileImageUrl?: string;
  calcMethod: string;
}

// ── Additional Services ──

export interface AdditionalService {
  id: string;
  name: string;
  description?: string;
  defaultPrice: number;
  priceUnit: "per_sqm" | "fixed" | "per_door";
  isActive: boolean;
  showInPdf: boolean;
  sortOrder: number;
}

// ── Calculations ──

export interface CalculatedComponent {
  name: string;
  key: string;
  qty: number;
  price: number;
  sum: number;
  unit: string;
}

export interface Calculation {
  id: string;
  userId?: string;
  customerName: string;
  customerPhone: string;
  systemId: string;
  subsystemId: string;
  fullWidth: number;
  openWidth?: number;
  height: number;
  doorWidth: number;
  glassType: string;
  shotlanType: string;
  components: CalculatedComponent[];
  totalPrice: number;
  services?: AdditionalService[];
  pdfUrl?: string;
  status: "draft" | "sent" | "ordered" | "completed";
  createdAt: string;
}

// ── Calculator State ──

export interface CalculatorSelections {
  systemSlug: string | null;
  systemName: string;
  subsystemId: string | null;
  glass: string | null;
  shotlan: string | null;
  fullWidth: number;
  openWidth: number;
  height: number;
  selectedServices: string[];
}
