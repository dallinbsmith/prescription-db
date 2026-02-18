import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CompoundingService, BulkIngredient } from '../../../core/services/compounding.service';

@Component({
  selector: 'app-ingredient-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './ingredient-list.component.html',
  styleUrl: './ingredient-list.component.scss',
})
export class IngredientListComponent implements OnInit {
  private compoundingService = inject(CompoundingService);

  ingredients = signal<BulkIngredient[]>([]);
  total = signal(0);
  loading = signal(true);

  searchTerm = '';
  fdaBulkListFilter = '';

  ngOnInit() {
    this.search();
  }

  search = () => {
    this.loading.set(true);
    this.compoundingService.searchIngredients({
      search: this.searchTerm || undefined,
      fda_bulk_list: this.fdaBulkListFilter || undefined,
    }).subscribe({
      next: (result) => {
        this.ingredients.set(result.items);
        this.total.set(result.total);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  };

  getFdaListClass = (list: string): string => {
    return `fda-${list.toLowerCase().replace('_', '-')}`;
  };
}
