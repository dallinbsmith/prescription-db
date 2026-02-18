import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Drug {
  id: string;
  ndc: string;
  name: string;
  generic_name: string | null;
  dosage_form: string | null;
  strength: string | null;
  route: string | null;
  manufacturer: string | null;
  rx_otc: 'RX' | 'OTC' | 'BOTH';
  dea_schedule: 'I' | 'II' | 'III' | 'IV' | 'V' | null;
  species: 'HUMAN' | 'ANIMAL' | 'BOTH';
  active_ingredients: { name: string; strength: string; unit: string }[] | null;
  fda_application_number: string | null;
  marketing_status: string | null;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface DrugSearchParams {
  search?: string;
  rx_otc?: string;
  dea_schedule?: string;
  species?: string;
  dosage_form?: string;
  manufacturer?: string;
  limit?: number;
  offset?: number;
}

export interface DrugSearchResult {
  drugs: Drug[];
  total: number;
}

@Injectable({ providedIn: 'root' })
export class DrugsService {
  private baseUrl = `${environment.apiUrl}/drugs`;

  constructor(private http: HttpClient) {}

  search = (params: DrugSearchParams) => {
    let httpParams = new HttpParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });

    return this.http.get<DrugSearchResult>(this.baseUrl, { params: httpParams });
  };

  getById = (id: string) => {
    return this.http.get<Drug>(`${this.baseUrl}/${id}`);
  };

  getByNdc = (ndc: string) => {
    return this.http.get<Drug>(`${this.baseUrl}/ndc/${ndc}`);
  };

  getFilterValues = (field: string) => {
    return this.http.get<string[]>(`${this.baseUrl}/filters/${field}`);
  };
}
