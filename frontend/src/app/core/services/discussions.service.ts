import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Discussion {
  id: string;
  drug_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  user_name: string;
  user_email: string;
  created_at: string;
  updated_at: string;
}

@Injectable({ providedIn: 'root' })
export class DiscussionsService {
  private baseUrl = `${environment.apiUrl}/discussions`;

  constructor(private http: HttpClient) {}

  getByDrug = (drugId: string) => {
    return this.http.get<Discussion[]>(`${this.baseUrl}/drug/${drugId}`);
  };

  create = (drugId: string, content: string, parentId?: string) => {
    return this.http.post<Discussion>(this.baseUrl, {
      drug_id: drugId,
      content,
      parent_id: parentId,
    });
  };

  update = (id: string, content: string) => {
    return this.http.patch<Discussion>(`${this.baseUrl}/${id}`, { content });
  };

  delete = (id: string) => {
    return this.http.delete(`${this.baseUrl}/${id}`);
  };
}
