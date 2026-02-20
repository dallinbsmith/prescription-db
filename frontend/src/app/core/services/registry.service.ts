import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Drug } from './drugs.service';
import { CompetitorDrug } from './competitors.service';

export interface RegistryEntry {
  id: string;
  user_id: string;
  drug_id: string;
  notes: string | null;
  created_at: string;
  drug: Drug;
}

export interface RegistryCheckResponse {
  inRegistry: boolean;
  entry: RegistryEntry | null;
}

@Injectable({ providedIn: 'root' })
export class RegistryService {
  private baseUrl = `${environment.apiUrl}/registry`;

  constructor(private http: HttpClient) {}

  getRegistry = (): Observable<RegistryEntry[]> => {
    return this.http.get<RegistryEntry[]>(this.baseUrl);
  };

  checkRegistry = (drugId: string): Observable<RegistryCheckResponse> => {
    return this.http.get<RegistryCheckResponse>(`${this.baseUrl}/check/${drugId}`);
  };

  addToRegistry = (drugId: string, notes?: string): Observable<RegistryEntry> => {
    return this.http.post<RegistryEntry>(this.baseUrl, { drugId, notes });
  };

  removeFromRegistry = (drugId: string): Observable<{ success: boolean }> => {
    return this.http.delete<{ success: boolean }>(`${this.baseUrl}/${drugId}`);
  };

  updateNotes = (drugId: string, notes: string): Observable<RegistryEntry> => {
    return this.http.patch<RegistryEntry>(`${this.baseUrl}/${drugId}`, { notes });
  };

  getCompetitorsForDrug = (drugId: string): Observable<CompetitorDrug[]> => {
    return this.http.get<CompetitorDrug[]>(`${environment.apiUrl}/drugs/${drugId}/competitors`);
  };
}
