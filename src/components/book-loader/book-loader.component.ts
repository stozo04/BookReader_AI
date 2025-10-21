// FIX: Implemented the BookLoaderComponent which was previously a placeholder.
import { Component, ChangeDetectionStrategy, signal, inject, output } from '@angular/core';
import { GeminiService } from '../../services/gemini.service';
import { Book } from '../../models/ebook.model';

declare const pdfjsLib: any;
declare const ePub: any;
declare const mammoth: any;

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
            <p class="mt-2 text-gray-600 dark:text-gray-400">Upload a book to begin. Supported formats: .txt, .pdf, .epub, .docx</p>
          </div>
          <div class="flex items-center justify-center p-6 border-2 border-dashed rounded-lg border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
            <input type="file" id="file-upload" class="hidden" (change)="onFileSelected($event)" accept=".txt,.pdf,.epub,.docx">
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
              <p class="mt-2">Note: Processing an entire book may take a minute or two.</p>
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

  constructor() {
    // FIX: Set the worker source for pdf.js to avoid errors.
    if (typeof pdfjsLib !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.5.136/pdf.worker.mjs`;
    }
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.loadingMessage.set('Reading file content...');

    try {
      let textContent = '';
      switch (extension) {
        case 'txt':
          textContent = await file.text();
          break;
        case 'pdf':
          this.loadingMessage.set('Parsing PDF file...');
          textContent = await this.parsePdf(file);
          break;
        case 'epub':
          this.loadingMessage.set('Parsing EPUB file...');
          textContent = await this.parseEpub(file);
          break;
        case 'docx':
           this.loadingMessage.set('Parsing DOCX file...');
          textContent = await this.parseDocx(file);
          break;
        default:
          throw new Error(`Unsupported file type: .${extension}. Please upload a .txt, .pdf, .epub, or .docx file.`);
      }

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

  private async parsePdf(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    // Use the globally available pdfjsLib
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(' ');
        text += '\n\n'; // Add separation between pages
    }
    return text;
  }

  private async parseEpub(file: File): Promise<string> {
      const arrayBuffer = await file.arrayBuffer();
      const book = ePub(arrayBuffer);
      const allContent = await Promise.all(
        book.spine.spineItems.map(async (item: any) => {
          const section = await book.section(item.index);
          const doc = await section.load();
          // Remove HTML tags to get plain text
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = doc.body.innerHTML;
          return tempDiv.textContent || tempDiv.innerText || '';
        })
      );
      return allContent.join('\n\n');
  }

  private async parseDocx(file: File): Promise<string> {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
  }
}