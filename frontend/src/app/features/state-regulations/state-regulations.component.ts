import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StateRegulationsService, StateRegulation } from '../../core/services/state-regulations.service';
import { AuthService } from '../../core/services/auth.service';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
];

@Component({
  selector: 'app-state-regulations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './state-regulations.component.html',
  styleUrl: './state-regulations.component.scss',
})
export class StateRegulationsComponent implements OnInit {
  private stateRegulationsService = inject(StateRegulationsService);
  authService = inject(AuthService);

  regulations = signal<StateRegulation[]>([]);
  loading = signal(true);
  selectedState = '';
  showForm = false;

  usStates = US_STATES;
  regulationTypes = ['PROHIBITED', 'RESTRICTED', 'REQUIRES_LICENSE', 'ADDITIONAL_REQUIREMENTS'];

  formData = {
    state_code: '',
    regulation_type: '',
    applies_to: '',
    description: '',
    source_url: '',
    notes: '',
  };

  ngOnInit() {
    this.loadRegulations();
  }

  loadRegulations = () => {
    this.loading.set(true);
    const request = this.selectedState
      ? this.stateRegulationsService.getByState(this.selectedState)
      : this.stateRegulationsService.getAll();

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

  onStateChange = () => {
    this.loadRegulations();
  };

  openForm = () => {
    this.formData = {
      state_code: this.selectedState || '',
      regulation_type: '',
      applies_to: '',
      description: '',
      source_url: '',
      notes: '',
    };
    this.showForm = true;
  };

  closeForm = () => {
    this.showForm = false;
  };

  submitForm = () => {
    if (!this.formData.state_code || !this.formData.regulation_type || !this.formData.applies_to) {
      return;
    }

    this.stateRegulationsService.create(this.formData).subscribe({
      next: () => {
        this.closeForm();
        this.loadRegulations();
      },
    });
  };

  deleteRegulation = (id: string) => {
    if (confirm('Are you sure you want to delete this regulation?')) {
      this.stateRegulationsService.delete(id).subscribe({
        next: () => {
          this.loadRegulations();
        },
      });
    }
  };

  getRegulationsByState = (): Map<string, StateRegulation[]> => {
    const grouped = new Map<string, StateRegulation[]>();
    for (const reg of this.regulations()) {
      const existing = grouped.get(reg.state_code) || [];
      grouped.set(reg.state_code, [...existing, reg]);
    }
    return grouped;
  };
}
