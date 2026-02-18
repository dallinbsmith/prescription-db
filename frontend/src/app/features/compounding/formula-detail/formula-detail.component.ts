import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CompoundingService, CompoundingFormula } from '../../../core/services/compounding.service';

@Component({
  selector: 'app-formula-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './formula-detail.component.html',
  styleUrl: './formula-detail.component.scss',
})
export class FormulaDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private compoundingService = inject(CompoundingService);

  formula = signal<CompoundingFormula | null>(null);
  loading = signal(true);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadFormula(id);
    }
  }

  loadFormula = (id: string) => {
    this.compoundingService.getFormula(id).subscribe({
      next: (formula) => {
        this.formula.set(formula);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  };
}
