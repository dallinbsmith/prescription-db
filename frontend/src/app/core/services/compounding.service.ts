import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface BulkIngredient {
  id: string;
  name: string;
  cas_number: string | null;
  usp_nf_status: boolean;
  fda_bulk_list: '503A_POSITIVE' | '503B_POSITIVE' | 'NOT_LISTED' | 'WITHDRAWN';
  category: string | null;
  storage_requirements: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FormulaIngredient {
  id: string;
  formula_id: string;
  ingredient_id: string;
  quantity: string;
  unit: string;
  purpose: string | null;
  order_index: number;
  ingredient_name?: string;
  cas_number?: string;
}

export interface CompoundingFormula {
  id: string;
  name: string;
  drug_id: string | null;
  dosage_form: string | null;
  route: string | null;
  species: 'HUMAN' | 'ANIMAL' | 'BOTH';
  beyond_use_date: string | null;
  formula_type: '503A' | '503B';
  status: 'DRAFT' | 'APPROVED' | 'DISCONTINUED';
  notes: string | null;
  ingredients?: FormulaIngredient[];
  drug_name?: string;
  created_at: string;
  updated_at: string;
}

export interface CompoundingRegulation {
  id: string;
  regulation_type: '503A' | '503B' | 'STATE' | 'USP';
  state_code: string | null;
  title: string;
  description: string | null;
  requirements: object | null;
  source_url: string | null;
  effective_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

@Injectable({ providedIn: 'root' })
export class CompoundingService {
  private baseUrl = `${environment.apiUrl}/compounding`;

  constructor(private http: HttpClient) {}

  searchIngredients = (params: { search?: string; fda_bulk_list?: string; category?: string; limit?: number; offset?: number }) => {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });
    return this.http.get<{ items: BulkIngredient[]; total: number }>(`${this.baseUrl}/ingredients`, { params: httpParams });
  };

  getIngredient = (id: string) => {
    return this.http.get<BulkIngredient>(`${this.baseUrl}/ingredients/${id}`);
  };

  getIngredientCategories = () => {
    return this.http.get<string[]>(`${this.baseUrl}/ingredients/categories`);
  };

  createIngredient = (ingredient: Omit<BulkIngredient, 'id' | 'created_at' | 'updated_at'>) => {
    return this.http.post<BulkIngredient>(`${this.baseUrl}/ingredients`, ingredient);
  };

  updateIngredient = (id: string, updates: Partial<BulkIngredient>) => {
    return this.http.patch<BulkIngredient>(`${this.baseUrl}/ingredients/${id}`, updates);
  };

  deleteIngredient = (id: string) => {
    return this.http.delete(`${this.baseUrl}/ingredients/${id}`);
  };

  searchFormulas = (params: { search?: string; formula_type?: string; status?: string; species?: string; limit?: number; offset?: number }) => {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });
    return this.http.get<{ items: CompoundingFormula[]; total: number }>(`${this.baseUrl}/formulas`, { params: httpParams });
  };

  getFormula = (id: string) => {
    return this.http.get<CompoundingFormula>(`${this.baseUrl}/formulas/${id}`);
  };

  createFormula = (formula: Omit<CompoundingFormula, 'id' | 'created_at' | 'updated_at'>) => {
    return this.http.post<CompoundingFormula>(`${this.baseUrl}/formulas`, formula);
  };

  updateFormula = (id: string, updates: Partial<CompoundingFormula>) => {
    return this.http.patch<CompoundingFormula>(`${this.baseUrl}/formulas/${id}`, updates);
  };

  updateFormulaIngredients = (formulaId: string, ingredients: Omit<FormulaIngredient, 'id' | 'formula_id'>[]) => {
    return this.http.put<FormulaIngredient[]>(`${this.baseUrl}/formulas/${formulaId}/ingredients`, ingredients);
  };

  deleteFormula = (id: string) => {
    return this.http.delete(`${this.baseUrl}/formulas/${id}`);
  };

  getRegulations = () => {
    return this.http.get<CompoundingRegulation[]>(`${this.baseUrl}/regulations`);
  };

  getRegulationsByType = (type: string) => {
    return this.http.get<CompoundingRegulation[]>(`${this.baseUrl}/regulations/type/${type}`);
  };

  getRegulationsByState = (stateCode: string) => {
    return this.http.get<CompoundingRegulation[]>(`${this.baseUrl}/regulations/state/${stateCode}`);
  };

  getRegulation = (id: string) => {
    return this.http.get<CompoundingRegulation>(`${this.baseUrl}/regulations/${id}`);
  };

  createRegulation = (regulation: Omit<CompoundingRegulation, 'id' | 'created_at' | 'updated_at'>) => {
    return this.http.post<CompoundingRegulation>(`${this.baseUrl}/regulations`, regulation);
  };

  updateRegulation = (id: string, updates: Partial<CompoundingRegulation>) => {
    return this.http.patch<CompoundingRegulation>(`${this.baseUrl}/regulations/${id}`, updates);
  };

  deleteRegulation = (id: string) => {
    return this.http.delete(`${this.baseUrl}/regulations/${id}`);
  };
}
