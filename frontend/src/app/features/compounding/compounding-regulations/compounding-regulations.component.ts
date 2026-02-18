import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CompoundingService, CompoundingRegulation } from '../../../core/services/compounding.service';

@Component({
  selector: 'app-compounding-regulations',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './compounding-regulations.component.html',
  styleUrl: './compounding-regulations.component.scss',
})
export class CompoundingRegulationsComponent implements OnInit {
  private compoundingService = inject(CompoundingService);

  regulations = signal<CompoundingRegulation[]>([]);
  loading = signal(true);
  selectedType = '';

  regulationTypes = ['503A', '503B', 'STATE', 'USP'];

  ngOnInit() {
    this.loadRegulations();
  }

  loadRegulations = () => {
    this.loading.set(true);
    const request = this.selectedType
      ? this.compoundingService.getRegulationsByType(this.selectedType)
      : this.compoundingService.getRegulations();

    request.subscribe({
      next: (regulations) => {
        this.regulations.set(regulations);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  };

  onTypeChange = () => {
    this.loadRegulations();
  };

  getTypeClass = (type: string): string => {
    return `type-${type.toLowerCase()}`;
  };

  formatDate = (date: string | null): string => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  };
}
