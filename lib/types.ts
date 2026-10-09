export interface CatalogItem {
  id: string;
  code: string;
  description: string;
  group: string;
  unit: string;
  cost: number;
  weightBar: number;
  notes?: string;
  createdAt?: string;
}

export interface MaterialListItem {
  id: string;
  itemId?: string;
  code: string;
  description: string;
  group: string;
  unit: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  weightBar: number;
  totalWeight: number;
  notes?: string;
}

export type ListStatus = 'Rascunho' | 'Em Andamento' | 'Concluída' | 'Aprovada' | 'Entregue';

export interface MaterialList {
  id: string;
  name: string;
  machine: string;
  client: string;
  responsible: string;
  date: string;
  deliveryDate?: string;
  status: ListStatus;
  notes?: string;
  items: MaterialListItem[];
  createdAt: string;
  updatedAt: string;
}

export type PDFTemplateType = 'modern' | 'corporate' | 'workshop' | 'quote';
export type ExcelTemplateType = 'complete' | 'engineering' | 'procurement';
export type PDFThemeColor = 'navy' | 'cyan' | 'emerald' | 'slate' | 'crimson';

export type DatabaseProvider = 'firebase' | 'supabase';

export type UserRole = 'admin' | 'operador';

export interface AppUser {
  id: string;
  username: string;
  name: string;
  email?: string;
  role: UserRole;
  password?: string;
  avatar?: string;
  createdAt?: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected?: boolean;
}

export interface AppSettings {
  appName?: string; // Custom application/system name (e.g. ListaPro Industrial)
  appLogo?: string; // Base64 data URL for program/system logo in navbar
  groups: string[];
  units: string[];
  companyName: string;
  companyLogo?: string; // Base64 data URL for company logo in PDF/reports
  companyPhone: string;
  companyEmail: string;
  companyCnpj: string;
  companyAddress: string;
  defaultResponsible: string;
  currencySymbol: string;
  whatsAppTemplate: string;

  // Cloud Database Provider Selection & Config
  databaseProvider?: DatabaseProvider;
  supabaseConfig?: SupabaseConfig;
  lastBackupDate?: string;

  // Access Control / Users
  users?: AppUser[];

  // PDF Template Customization
  pdfTemplate?: PDFTemplateType;
  pdfThemeColor?: PDFThemeColor;
  pdfShowLogo?: boolean;
  pdfShowPrices?: boolean;
  pdfShowWeights?: boolean;
  pdfShowSignatures?: boolean;
  pdfShowNotes?: boolean;
  pdfFooterText?: string;

  // Excel Template Customization
  excelTemplate?: ExcelTemplateType;
  excelIncludeSummary?: boolean;
  excelIncludeHeader?: boolean;
  excelShowPrices?: boolean;
  excelShowWeights?: boolean;
}

export type PartnerType = 'cliente' | 'fornecedor' | 'ambos';

export interface Partner {
  id: string;
  type: PartnerType; // 'cliente' | 'fornecedor' | 'ambos'
  name: string; // Razão Social / Nome Principal
  tradeName?: string; // Nome Fantasia
  document?: string; // CNPJ ou CPF
  phone?: string; // Telefone / WhatsApp
  email?: string; // E-mail
  contactPerson?: string; // Pessoa de Contato / Representante
  city?: string; // Cidade
  state?: string; // UF
  address?: string; // Endereço completo
  category?: string; // Categoria / Segmento (ex: Usinagem, Parafusos, Automação, Indústria)
  paymentTerms?: string; // Condição Comercial / Pagamento
  notes?: string; // Observações / Notas
  status: 'ativo' | 'inativo';
  createdAt: string;
  updatedAt: string;
}

export type ActiveTab = 'lists' | 'new-list' | 'catalog' | 'settings' | 'requisitions' | 'partners';

export type RequisitionPriority = 'Baixa' | 'Normal' | 'Alta' | 'Urgente';
export type RequisitionStatus = 'Pendente' | 'Em Cotação' | 'Aprovada' | 'Entregue' | 'Cancelada';

export interface RequisitionItem {
  id: string;
  catalogItemId?: string;
  code: string;
  description: string;
  group: string;
  unit: string;
  quantity: number;
  estimatedCost: number;
  totalEstimatedCost: number;
  destinationMachine?: string;
  notes?: string;
}

export interface SupplyRequisition {
  id: string;
  protocol: string;
  title: string;
  requesterName: string;
  sector: string;
  destinationMachine?: string;
  priority: RequisitionPriority;
  status: RequisitionStatus;
  requestDate: string;
  neededByDate?: string;
  justification: string;
  items: RequisitionItem[];
  totalEstimatedCost: number;
  totalItemsCount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type SortOrder = 'asc' | 'desc';
