import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DrugsService, Drug, DrugSearchParams } from '../../../core/services/drugs.service';

@Component({
  selector: 'app-drug-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './drug-list.component.html',
  styleUrl: './drug-list.component.scss',
})
export class DrugListComponent implements OnInit {
  private drugsService = inject(DrugsService);

  drugs = signal<Drug[]>([]);
  total = signal(0);
  loading = signal(false);

  searchTerm = '';
  currentPage = signal(1);
  pageSize = 50;
  pageSizeOptions = [25, 50, 100, 200];

  filters: DrugSearchParams = {};

  rxOtcOptions = ['RX', 'OTC', 'BOTH'];
  deaScheduleOptions = ['NONE', 'I', 'II', 'III', 'IV', 'V'];
  speciesOptions = ['HUMAN', 'ANIMAL', 'BOTH'];

  totalPages = computed(() => Math.ceil(this.total() / this.pageSize) || 1);
  startIndex = computed(() => (this.currentPage() - 1) * this.pageSize + 1);
  endIndex = computed(() => Math.min(this.currentPage() * this.pageSize, this.total()));

  visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: (number | string)[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push('...');
      for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
        pages.push(i);
      }
      if (current < total - 2) pages.push('...');
      pages.push(total);
    }
    return pages;
  });

  ngOnInit() {
    this.loadPage();
  }

  loadPage = () => {
    this.loading.set(true);

    const params: DrugSearchParams = {
      ...this.filters,
      search: this.searchTerm || undefined,
      limit: this.pageSize,
      offset: (this.currentPage() - 1) * this.pageSize,
    };

    this.drugsService.search(params).subscribe({
      next: (result) => {
        this.drugs.set(result.drugs);
        this.total.set(result.total);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  };

  search = () => {
    this.currentPage.set(1);
    this.loadPage();
  };

  goToPage = (page: number | string) => {
    if (typeof page !== 'number') return;
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadPage();
  };

  previousPage = () => {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.loadPage();
    }
  };

  nextPage = () => {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
      this.loadPage();
    }
  };

  onPageSizeChange = () => {
    this.currentPage.set(1);
    this.loadPage();
  };

  onFilterChange = () => {
    this.search();
  };

  clearFilters = () => {
    this.searchTerm = '';
    this.filters = {};
    this.currentPage.set(1);
    this.loadPage();
  };

  getDeaClass = (schedule: string | null): string => {
    if (!schedule) return '';
    return `dea-${schedule.toLowerCase()}`;
  };
}
