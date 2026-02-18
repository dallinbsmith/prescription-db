import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'drugs',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'drugs',
    canActivate: [authGuard],
    loadComponent: () => import('./features/drugs/drug-list/drug-list.component').then(m => m.DrugListComponent),
  },
  {
    path: 'drugs/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/drugs/drug-detail/drug-detail.component').then(m => m.DrugDetailComponent),
  },
  {
    path: 'competitors',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/competitors/competitor-list/competitor-list.component').then(m => m.CompetitorListComponent),
      },
      {
        path: ':competitor',
        loadComponent: () => import('./features/competitors/competitor-drugs/competitor-drugs.component').then(m => m.CompetitorDrugsComponent),
      },
    ],
  },
  {
    path: 'state-regulations',
    canActivate: [authGuard],
    loadComponent: () => import('./features/state-regulations/state-regulations.component').then(m => m.StateRegulationsComponent),
  },
  {
    path: 'compounding',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'formulas',
        pathMatch: 'full',
      },
      {
        path: 'formulas',
        loadComponent: () => import('./features/compounding/formula-list/formula-list.component').then(m => m.FormulaListComponent),
      },
      {
        path: 'formulas/:id',
        loadComponent: () => import('./features/compounding/formula-detail/formula-detail.component').then(m => m.FormulaDetailComponent),
      },
      {
        path: 'ingredients',
        loadComponent: () => import('./features/compounding/ingredient-list/ingredient-list.component').then(m => m.IngredientListComponent),
      },
      {
        path: 'regulations',
        loadComponent: () => import('./features/compounding/compounding-regulations/compounding-regulations.component').then(m => m.CompoundingRegulationsComponent),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'drugs',
  },
];
