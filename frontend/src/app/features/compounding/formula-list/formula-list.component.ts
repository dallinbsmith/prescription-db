import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CompoundingService, CompoundingFormula } from '../../../core/services/compounding.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-formula-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './formula-list.component.html',
  styleUrl: './formula-list.component.scss',
})
export class FormulaListComponent implements OnInit {
  private compoundingService = inject(CompoundingService);
  authService = inject(AuthService);

  formulas = signal<CompoundingFormula[]>([]);
  total = signal(0);
  loading = signal(true);

  searchTerm = '';
  filters = {
    formula_type: '',
    status: '',
    species: '',
  };

  ngOnInit() {
    this.search();
  }

  search = () => {
    this.loading.set(true);
    this.compoundingService.searchFormulas({
      search: this.searchTerm || undefined,
      formula_type: this.filters.formula_type || undefined,
      status: this.filters.status || undefined,
      species: this.filters.species || undefined,
    }).subscribe({
      next: (result) => {
        this.formulas.set(result.items);
        this.total.set(result.total);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  };

  getStatusClass = (status: string): string => {
    return `status-${status.toLowerCase()}`;
  };
}
