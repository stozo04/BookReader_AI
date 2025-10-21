// FIX: Implemented the root AppComponent which was previously a placeholder.
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { ProgressService } from './services/progress.service';
import { BookLoaderComponent } from './components/book-loader/book-loader.component';
import { EbookReaderComponent } from './components/ebook-reader/ebook-reader.component';
import { Book } from './models/ebook.model';

@Component({
  selector: 'app-root',
  template: `
    <main>
      @if (progressService.book()) {
        <app-ebook-reader />
      } @else {
        <app-book-loader (bookLoaded)="onBookLoaded($event)" />
      }
    </main>
  `,
  imports: [BookLoaderComponent, EbookReaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  progressService = inject(ProgressService);

  onBookLoaded(book: Book) {
    this.progressService.loadBook(book);
  }
}
