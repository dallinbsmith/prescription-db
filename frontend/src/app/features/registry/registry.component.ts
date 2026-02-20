import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RegistryService, RegistryEntry } from '../../core/services/registry.service';
import { CompetitorDrug } from '../../core/services/competitors.service';

@Component({
  selector: 'app-registry',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './registry.component.html',
  styleUrls: ['./registry.component.scss'],
})
export class RegistryComponent implements OnInit {
  private registryService: RegistryService;

  entries = signal<RegistryEntry[]>([]);
  loading = signal(false);
  searchTerm = '';

  showCompetitorsModal = signal(false);
  selectedEntry = signal<RegistryEntry | null>(null);
  competitors = signal<CompetitorDrug[]>([]);
  loadingCompetitors = signal(false);

  filteredEntries = computed(() => {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) return this.entries();

    return this.entries().filter(entry => {
      const drug = entry.drug;
      return (
        drug.name?.toLowerCase().includes(term) ||
        drug.generic_name?.toLowerCase().includes(term) ||
        drug.manufacturer?.toLowerCase().includes(term) ||
        drug.ndc?.toLowerCase().includes(term)
      );
    });
  });

  constructor(registryService: RegistryService) {
    this.registryService = registryService;
  }

  ngOnInit() {
    this.loadRegistry();
  }

  loadRegistry = () => {
    console.log('loadRegistry called');
    this.loading.set(true);
    this.registryService.getRegistry().subscribe({
      next: (data) => {
        console.log('Registry data received:', data);
        console.log('Data length:', data?.length);
        this.entries.set(data);
        console.log('Entries after set:', this.entries());
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load registry', err);
        this.loading.set(false);
      },
    });
  };

  removeFromRegistry = (entry: RegistryEntry, event: Event) => {
    event.stopPropagation();
    if (!confirm(`Remove "${entry.drug.name}" from registry?`)) return;

    this.registryService.removeFromRegistry(entry.drug_id).subscribe({
      next: () => {
        this.entries.update(entries => entries.filter(e => e.id !== entry.id));
      },
      error: (err) => {
        console.error('Failed to remove from registry', err);
      },
    });
  };

  openCompetitorsModal = (entry: RegistryEntry, event: Event) => {
    event.stopPropagation();
    this.selectedEntry.set(entry);
    this.showCompetitorsModal.set(true);
    this.loadCompetitors(entry.drug_id);
  };

  closeCompetitorsModal = () => {
    this.showCompetitorsModal.set(false);
    this.selectedEntry.set(null);
    this.competitors.set([]);
  };

  loadCompetitors = (drugId: string) => {
    this.loadingCompetitors.set(true);
    this.registryService.getCompetitorsForDrug(drugId).subscribe({
      next: (data) => {
        this.competitors.set(data);
        this.loadingCompetitors.set(false);
      },
      error: (err) => {
        console.error('Failed to load competitors', err);
        this.loadingCompetitors.set(false);
      },
    });
  };

  formatPrice = (price: number | null): string => {
    if (price === null) return 'N/A';
    return `$${price.toFixed(2)}`;
  };
}
