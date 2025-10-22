// FIX: Implemented the root AppComponent which was previously a placeholder.
import { Component, ChangeDetectionStrategy, inject, effect, signal } from '@angular/core';
import { ProgressService } from './services/progress.service';
import { BookLoaderComponent } from './components/book-loader/book-loader.component';
import { EbookReaderComponent } from './components/ebook-reader/ebook-reader.component';
import { HomeComponent } from './components/home/home.component';
import { Book } from './models/ebook.model';

@Component({
  selector: 'app-root',
  template: `
    <main>
      @switch (currentView()) {
        @case ('home') {
          <app-home (loadBookClicked)="showLoader()" />
        }
        @case ('loader') {
          <app-book-loader (bookLoaded)="onBookLoaded($event)" (backClicked)="showHome()" />
        }
        @case ('reader') {
          <app-ebook-reader />
        }
      }
    </main>
  `,
  imports: [HomeComponent, BookLoaderComponent, EbookReaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  progressService = inject(ProgressService);
  currentView = signal<'home' | 'loader' | 'reader'>('home');

  constructor() {
    // If a book is already loaded from localStorage, go straight to the reader.
    if (this.progressService.book()) {
      this.currentView.set('reader');
    }

    effect(() => {
      // If book is reset (e.g. from reader), go home
      if (!this.progressService.book() && this.currentView() === 'reader') {
        this.currentView.set('home');
      }

      // FIX: Correctly access the theme signal's value
      if (this.progressService.theme() === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    });
  }

  onBookLoaded(book: Book) {
    // FIX: Correctly call the loadBook method on the service
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
