import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  is_premium: boolean;
  subscription_status: 'free' | 'premium';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = environment.apiUrl;

  // Access token lives only in memory — never written to localStorage or cookies.
  // On page reload it is re-hydrated via the HttpOnly refresh cookie.
  private _accessToken: string | null = null;

  currentUser = signal<AuthUser | null>(null);
  isLoggedIn = computed(() => !!this.currentUser());
  isPremium = computed(() => this.currentUser()?.is_premium ?? false);

  constructor(private http: HttpClient) {
    // Try to restore session silently using the HttpOnly refresh cookie
    this.tryRestoreSession();
  }

  register(username: string, email: string, password: string): Observable<any> {
    return this.http.post<any>(
      `${this.API}/auth/register/`,
      { username, email, password },
      { withCredentials: true },
    ).pipe(
      tap(res => {
        this._accessToken = res.access;
        this.currentUser.set(res.user);
      }),
    );
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(
      `${this.API}/auth/login/`,
      { username, password },
      { withCredentials: true },
    ).pipe(
      tap(res => {
        this._accessToken = res.access;
        this.currentUser.set(res.user);
      }),
    );
  }

  logout(): Observable<any> {
    this._accessToken = null;
    this.currentUser.set(null);
    return this.http.post(`${this.API}/auth/logout/`, {}, { withCredentials: true });
  }

  refreshAccessToken(): Observable<any> {
    // The browser automatically sends the HttpOnly cookie
    return this.http.post<any>(
      `${this.API}/auth/refresh/`,
      {},
      { withCredentials: true },
    ).pipe(
      tap(res => {
        if (res?.access) {
          this._accessToken = res.access;
        }
      }),
    );
  }

  fetchMe(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${this.API}/auth/me/`).pipe(
      tap(user => this.currentUser.set(user)),
      catchError(() => {
        this.currentUser.set(null);
        return of(null as any);
      }),
    );
  }

  startCheckout(): Observable<{ checkout_url: string }> {
    return this.http.post<any>(`${this.API}/auth/billing/subscribe/`, {});
  }

  cancelSubscription(): Observable<any> {
    return this.http.post<any>(`${this.API}/auth/billing/cancel/`, {});
  }

  getAccessToken(): string | null {
    return this._accessToken;
  }

  private tryRestoreSession(): void {
    // Silently attempt a refresh — succeeds if the HttpOnly cookie is still valid
    this.refreshAccessToken().pipe(
      catchError(() => of(null)),
    ).subscribe(res => {
      if (res?.access) {
        this.fetchMe().subscribe();
      }
    });
  }
}
