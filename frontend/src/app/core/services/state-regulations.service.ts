import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface StateRegulation {
  id: string;
  state_code: string;
  regulation_type: string;
  applies_to: string;
  description: string | null;
  source_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateStateRegulation = Omit<StateRegulation, 'id' | 'created_at' | 'updated_at'>;

@Injectable({ providedIn: 'root' })
export class StateRegulationsService {
  private baseUrl = `${environment.apiUrl}/state-regulations`;

  constructor(private http: HttpClient) {}

  getAll = () => {
    return this.http.get<StateRegulation[]>(this.baseUrl);
  };

  getByState = (stateCode: string) => {
    return this.http.get<StateRegulation[]>(`${this.baseUrl}/state/${stateCode}`);
  };

  getById = (id: string) => {
    return this.http.get<StateRegulation>(`${this.baseUrl}/${id}`);
  };

  getStates = () => {
    return this.http.get<string[]>(`${this.baseUrl}/states`);
  };

  create = (regulation: CreateStateRegulation) => {
    return this.http.post<StateRegulation>(this.baseUrl, regulation);
  };

  update = (id: string, updates: Partial<CreateStateRegulation>) => {
    return this.http.patch<StateRegulation>(`${this.baseUrl}/${id}`, updates);
  };

  delete = (id: string) => {
    return this.http.delete(`${this.baseUrl}/${id}`);
  };
}
