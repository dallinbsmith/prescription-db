import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
}

export interface LoginResponse {
  token: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSignal = signal<User | null>(null);
  private tokenSignal = signal<string | null>(null);

  currentUser = this.currentUserSignal.asReadonly();
  isAuthenticated = computed(() => !!this.tokenSignal());
  isAdmin = computed(() => this.currentUserSignal()?.role === 'ADMIN');

  constructor(private http: HttpClient, private router: Router) {
    this.loadFromStorage();
  }

  private loadFromStorage = () => {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');

    if (token && userJson) {
      this.tokenSignal.set(token);
      this.currentUserSignal.set(JSON.parse(userJson));
    }
  };

  getToken = () => this.tokenSignal();

  login = (email: string, password: string) => {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email, password });
  };

  handleLoginSuccess = (response: LoginResponse) => {
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    this.tokenSignal.set(response.token);
    this.currentUserSignal.set(response.user);
  };

  logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.tokenSignal.set(null);
    this.currentUserSignal.set(null);
    this.router.navigate(['/login']);
  };

  refreshUser = () => {
    return this.http.get<User>(`${environment.apiUrl}/auth/me`);
  };

  changePassword = (currentPassword: string, newPassword: string) => {
    return this.http.post(`${environment.apiUrl}/auth/change-password`, {
      currentPassword,
      newPassword,
    });
  };
}
