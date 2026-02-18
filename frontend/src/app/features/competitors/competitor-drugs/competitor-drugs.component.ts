import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CompetitorsService, CompetitorDrug } from '../../../core/services/competitors.service';

@Component({
  selector: 'app-competitor-drugs',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './competitor-drugs.component.html',
  styleUrl: './competitor-drugs.component.scss',
})
export class CompetitorDrugsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private competitorsService = inject(CompetitorsService);

  competitor = '';
  drugs = signal<CompetitorDrug[]>([]);
  total = signal(0);
  totalUnfiltered = signal(0);
  loading = signal(true);

  searchTerm = '';
  currentPage = signal(1);
  pageSize = 50;
  pageSizeOptions = [25, 50, 100, 200];

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
    this.competitor = this.route.snapshot.paramMap.get('competitor') || '';
    if (this.competitor) {
      this.loadInitial();
    }
  }

  loadInitial = () => {
    this.competitorsService.getDrugs(this.competitor, this.pageSize, 0).subscribe({
      next: (result) => {
        const validItems = result.items.filter(item => item && item.external_name && item.external_name.trim());
        this.drugs.set(validItems);
        this.total.set(result.total);
        this.totalUnfiltered.set(result.total);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  };

  loadPage = () => {
    this.loading.set(true);
    const offset = (this.currentPage() - 1) * this.pageSize;
    const search = this.searchTerm.trim() || undefined;

    this.competitorsService.getDrugs(this.competitor, this.pageSize, offset, search).subscribe({
      next: (result) => {
        const validItems = result.items.filter(item => item && item.external_name && item.external_name.trim());
        this.drugs.set(validItems);
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

  clearSearch = () => {
    this.searchTerm = '';
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

  formatPrice = (price: number | string | null): string => {
    if (price === null || price === undefined) return '-';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return '-';
    return '$' + numPrice.toFixed(2);
  };
}
