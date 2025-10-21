// FIX: Implemented the BookLoaderComponent which was previously a placeholder.
import { Component, ChangeDetectionStrategy, signal, inject, output } from '@angular/core';
import { GeminiService } from '../../services/gemini.service';
import { Book } from '../../models/ebook.model';

@Component({
  selector: 'app-book-loader',
  template: `
    <div class="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div class="w-full max-w-lg p-8 space-y-8 bg-white rounded-lg shadow-lg dark:bg-gray-800">
        @if (isLoading()) {
          <div class="flex flex-col items-center justify-center">
            <div class="w-16 h-16 border-4 border-blue-500 border-solid rounded-full animate-spin border-t-transparent"></div>
            <p class="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-300">{{ loadingMessage() }}</p>
          </div>
        } @else {
          <div class="text-center">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">AI-Powered eBook Reader</h1>
            <p class="mt-2 text-gray-600 dark:text-gray-400">Upload a plain text (.txt) file of a book to begin.</p>
          </div>
          <div class="flex items-center justify-center p-6 border-2 border-dashed rounded-lg border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
            <input type="file" id="file-upload" class="hidden" (change)="onFileSelected($event)" accept=".txt">
            <label for="file-upload" class="flex flex-col items-center space-y-2 cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span class="font-medium text-blue-600 dark:text-blue-400">Click to upload</span>
              <span class="text-sm text-gray-500 dark:text-gray-400">or drag and drop</span>
            </label>
          </div>
          @if(errorMessage()) {
            <div class="p-4 mt-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800" role="alert">
              <span class="font-medium">Error:</span> {{ errorMessage() }}
            </div>
          }
           <div class="mt-4 text-sm text-center text-gray-500 dark:text-gray-400">
              <p>For best results, use a public domain book from sources like <a href="https://www.gutenberg.org/" target="_blank" class="text-blue-500 hover:underline">Project Gutenberg</a>.</p>
              <p class="mt-2">Note: The AI will process the first ~30,000 characters to structure the book.</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    .animate-spin {
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookLoaderComponent {
  isLoading = signal(false);
  loadingMessage = signal('');
  errorMessage = signal<string | null>(null);

  bookLoaded = output<Book>();

  private geminiService = inject(GeminiService);

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    if (file.type !== 'text/plain') {
      this.errorMessage.set('Please upload a valid .txt file.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.loadingMessage.set('Reading file content...');

    try {
      const textContent = await file.text();
      this.loadingMessage.set('Analyzing book structure with AI...');
      
      const book = await this.geminiService.structureBookFromText(textContent);
      
      this.loadingMessage.set('Book loaded successfully!');
      this.bookLoaded.emit(book);
    } catch (error) {
      console.error('Error processing book:', error);
      this.errorMessage.set(`Failed to process book. ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      this.isLoading.set(false);
      this.loadingMessage.set('');
    }
  }
}
