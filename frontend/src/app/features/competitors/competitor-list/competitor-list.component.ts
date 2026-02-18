import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CompetitorsService, CompetitorSummary } from '../../../core/services/competitors.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-competitor-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './competitor-list.component.html',
  styleUrl: './competitor-list.component.scss',
})
export class CompetitorListComponent implements OnInit {
  private competitorsService = inject(CompetitorsService);
  authService = inject(AuthService);

  competitors = signal<CompetitorSummary[]>([]);
  availableScrapers = signal<string[]>([]);
  loading = signal(true);
  scraping = signal<string | null>(null);

  ngOnInit() {
    this.loadCompetitors();
    this.loadScrapers();
  }

  loadCompetitors = () => {
    this.competitorsService.getAll().subscribe({
      next: (competitors) => {
        this.competitors.set(competitors);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  };

  loadScrapers = () => {
    this.competitorsService.getAvailableScrapers().subscribe({
      next: (scrapers) => {
        this.availableScrapers.set(scrapers);
      },
    });
  };

  runScraper = (competitor: string) => {
    if (this.scraping()) return;

    this.scraping.set(competitor);
    this.competitorsService.runScraper(competitor).subscribe({
      next: () => {
        this.scraping.set(null);
        this.loadCompetitors();
      },
      error: () => {
        this.scraping.set(null);
      },
    });
  };

  getStatusClass = (status: string): string => {
    return `status-${status.toLowerCase()}`;
  };

  formatDate = (date: string): string => {
    return new Date(date).toLocaleString();
  };
}
