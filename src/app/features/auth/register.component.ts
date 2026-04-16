import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  username = '';
  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  constructor(private auth: AuthService, private router: Router) {}

  submit(): void {
    if (!this.username || this.password.length < 8) {
      this.error.set('Username required; password must be at least 8 characters.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.auth.register(this.username, this.email, this.password).subscribe({
      next: () => this.router.navigate(['/guild']),
      error: err => {
        const msg = err.error?.username?.[0] || err.error?.password?.[0] || 'Registration failed.';
        this.error.set(msg);
        this.loading.set(false);
      },
    });
  }
}
