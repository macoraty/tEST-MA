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

export interface AppSettings {
  groups: string[];
  units: string[];
  companyName: string;
  companyPhone: string;
  companyEmail: string;
  companyCnpj: string;
  companyAddress: string;
  defaultResponsible: string;
  currencySymbol: string;
  whatsAppTemplate: string;
}

export type ActiveTab = 'lists' | 'new-list' | 'catalog' | 'settings';

export type SortOrder = 'asc' | 'desc';
