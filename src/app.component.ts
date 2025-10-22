// FIX: Implemented the root AppComponent which was previously a placeholder.
// UPDATE: Integrated SupabaseService to manage views based on authentication state and added logic for selecting books from the library.
import { Component, ChangeDetectionStrategy, inject, effect, signal } from '@angular/core';
import { ProgressService } from './services/progress.service';
import { BookLoaderComponent } from './components/book-loader/book-loader.component';
import { EbookReaderComponent } from './components/ebook-reader/ebook-reader.component';
import { HomeComponent } from './components/home/home.component';
import { Book } from './models/ebook.model';
import { SupabaseService } from './services/supabase.service';

@Component({
  selector: 'app-root',
  template: `
    @if (supabaseService.session() === undefined) {
       <div class="flex items-center justify-center h-screen bg-gray-900">
        <div class="w-16 h-16 border-4 border-blue-500 border-solid rounded-full animate-spin border-t-transparent"></div>
       </div>
    } @else {
      <main>
        @switch (currentView()) {
          @case ('home') {
            <app-home (loadBookClicked)="showLoader()" (bookSelected)="onBookSelected($event)" />
          }
          @case ('loader') {
            <app-book-loader (bookLoaded)="onBookLoaded($event)" (backClicked)="showHome()" />
          }
          @case ('reader') {
            <app-ebook-reader />
          }
        }
      </main>
    }
  `,
  imports: [HomeComponent, BookLoaderComponent, EbookReaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .animate-spin {
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `
})
export class AppComponent {
  progressService = inject(ProgressService);
  supabaseService = inject(SupabaseService);
  currentView = signal<'home' | 'loader' | 'reader'>('home');

  constructor() {
    // on app load, if a book is in progress service (from localStorage), go straight to the reader.
    if (this.progressService.book() && this.supabaseService.session()) {
      this.currentView.set('reader');
    }

    effect(() => {
      const book = this.progressService.book();
      const session = this.supabaseService.session();

      // If book is reset (e.g. from reader), go home.
      if (!book && this.currentView() === 'reader') {
        this.currentView.set('home');
      }

      // If user logs out, go home and clear any active book.
      if (!session && book) {
          this.progressService.reset();
          this.currentView.set('home');
      }

      // Handle theme changes.
      if (this.progressService.theme() === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    });
  }

  onBookLoaded(book: Book) {
    this.progressService.loadBook(book);
    this.currentView.set('reader');
  }

  onBookSelected(book: Book) {
    this.progressService.loadBook(book);
    this.currentView.set('reader');
  }

  showLoader() {
    this.currentView.set('loader');
  }
  
  showHome() {
    this.currentView.set('home');
  }
}
