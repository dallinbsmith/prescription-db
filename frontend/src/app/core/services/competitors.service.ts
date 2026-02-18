import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface CompetitorSummary {
  competitor: string;
  count: number;
  latestScrape: ScrapeLog | null;
}

export interface CompetitorDrug {
  id: string;
  competitor: string;
  drug_id: string | null;
  external_name: string;
  url: string | null;
  price: number | null;
  category: string | null;
  requires_prescription: boolean | null;
  requires_consultation: boolean | null;
  drug_name?: string;
  drug_ndc?: string;
  scraped_at: string;
  created_at: string;
}

export interface ScrapeLog {
  id: string;
  competitor: string;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  drugs_found: number;
  error_message: string | null;
  duration_ms: number;
  created_at: string;
}

export interface ScrapeResult {
  success: boolean;
  drugsFound: number;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class CompetitorsService {
  private baseUrl = `${environment.apiUrl}/competitors`;

  constructor(private http: HttpClient) {}

  getAll = () => {
    return this.http.get<CompetitorSummary[]>(this.baseUrl);
  };

  getDrugs = (competitor: string, limit = 100, offset = 0, search?: string) => {
    let params = new HttpParams()
      .set('competitor', competitor)
      .set('limit', limit)
      .set('offset', offset);

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<{ items: CompetitorDrug[]; total: number }>(`${this.baseUrl}/drugs`, { params });
  };

  getUnmatched = (competitor?: string) => {
    let params = new HttpParams();
    if (competitor) {
      params = params.set('competitor', competitor);
    }
    return this.http.get<CompetitorDrug[]>(`${this.baseUrl}/drugs/unmatched`, { params });
  };

  getDrugById = (id: string) => {
    return this.http.get<CompetitorDrug>(`${this.baseUrl}/drugs/${id}`);
  };

  matchDrug = (competitorDrugId: string, drugId: string | null) => {
    return this.http.patch<CompetitorDrug>(`${this.baseUrl}/drugs/${competitorDrugId}/match`, {
      drug_id: drugId,
    });
  };

  getLogs = (competitor?: string, limit = 50) => {
    let params = new HttpParams().set('limit', limit);
    if (competitor) {
      params = params.set('competitor', competitor);
    }
    return this.http.get<ScrapeLog[]>(`${this.baseUrl}/logs`, { params });
  };

  getAvailableScrapers = () => {
    return this.http.get<string[]>(`${this.baseUrl}/scrapers`);
  };

  runScraper = (competitor: string) => {
    return this.http.post<ScrapeResult>(`${this.baseUrl}/scrape/${competitor}`, {});
  };

  deleteByCompetitor = (competitor: string) => {
    return this.http.delete<{ deleted: number }>(`${this.baseUrl}/drugs/${competitor}`);
  };
}
