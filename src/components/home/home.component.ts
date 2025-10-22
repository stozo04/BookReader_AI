import { Component, ChangeDetectionStrategy, output, inject, signal, effect } from '@angular/core';
import { SupabaseService } from '../../services/supabase.service';
import { Book } from '../../models/ebook.model';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-home',
  template: `
    <div class="min-h-screen bg-gray-900 text-white font-sans">
      @if (session()) {
        <!-- Logged-in view: User's Library -->
        <header class="p-6 flex flex-col sm:flex-row justify-between items-center bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-800">
          <div class="flex items-center space-x-4">
            <h1 class="text-3xl font-bold text-center sm:text-left">My Library</h1>
            <button (click)="loadBookClicked.emit()" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-lg hover:shadow-blue-500/50">
              Upload Book
            </button>
          </div>
          <div class="flex items-center space-x-4 mt-4 sm:mt-0">
             @if (session()?.user?.email) {
              <span class="text-gray-400 text-sm hidden md:block">{{ session()?.user?.email }}</span>
            }
            <button (click)="supabaseService.signOut()" class="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
              Logout
            </button>
          </div>
        </header>

        <main class="p-6 md:p-10">
          @if (isLoading()) {
            <div class="flex justify-center items-center h-64">
              <div class="w-12 h-12 border-4 border-blue-500 border-solid rounded-full animate-spin border-t-transparent"></div>
            </div>
          } @else if (books().length === 0) {
            <div class="text-center py-20 px-6 bg-gray-800 rounded-lg">
              <h2 class="text-2xl font-semibold text-white mb-2">Your library is empty.</h2>
              <p class="text-gray-400 mb-6">Upload your first book to get started.</p>
              <button (click)="loadBookClicked.emit()" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg shadow-lg hover:shadow-blue-500/50">
                Upload a Book
              </button>
            </div>
          } @else {
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              @for(book of books(); track book.id) {
                <div (click)="bookSelected.emit(book)" class="group cursor-pointer" title="{{ book.title }} by {{ book.author }}">
                  <div class="aspect-[2/3] bg-gray-800 rounded-lg overflow-hidden relative shadow-lg transform group-hover:scale-105 transition-transform duration-300">
                    <!-- FIX: Use NgOptimizedImage for better performance -->
                    <img [ngSrc]="book.cover_url || 'https://picsum.photos/seed/'+book.id+'/300/450'" [alt]="'Cover of ' + book.title" class="w-full h-full object-cover" width="300" height="450" />
                    <div class="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
                  </div>
                  <h3 class="mt-3 font-semibold text-gray-100 truncate">{{ book.title }}</h3>
                  <p class="text-sm text-gray-400 truncate">{{ book.author }}</p>
                </div>
              }
            </div>
          }
        </main>

      } @else {
        <!-- Logged-out view: Login Page -->
        <div class="flex flex-col items-center justify-center min-h-screen p-6">
          <div class="text-center max-w-2xl">
            <h1 class="text-5xl md:text-6xl font-extrabold text-white leading-tight">
              Unlock a New Dimension of Reading with <span class="text-blue-500">AI E-Book Interactor</span>
            </h1>
            <p class="mt-6 text-lg md:text-xl text-gray-300">
              Go beyond the text. Get character profiles, chapter summaries, and AI-generated visualizations of scenes as you read. Your personal library, enhanced by AI.
            </p>
            <button (click)="supabaseService.signInWithGoogle()" class="mt-10 inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-blue-600 rounded-lg shadow-lg hover:bg-blue-700 transition-transform hover:scale-105">
                <svg class="w-6 h-6 mr-3" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_17_40)"><path d="M47.532 24.5528C47.532 22.9214 47.3997 21.2811 47.1177 19.6409H24.2236V28.918H37.4332C36.8663 31.8953 35.1952 34.4882 32.7383 36.1284V42.022H40.231C44.7554 37.8814 47.532 31.7611 47.532 24.5528Z" fill="#4285F4"/><path d="M24.2236 48.0001C30.8694 48.0001 36.4426 45.8955 40.231 42.022L32.7383 36.1284C30.5298 37.5779 27.6015 38.4842 24.2236 38.4842C17.9547 38.4842 12.597 34.2327 10.8286 28.4632H3.125V34.4881C6.91295 42.4411 14.931 48.0001 24.2236 48.0001Z" fill="#34A853"/><path d="M10.8286 28.4632C10.2617 26.8318 9.94824 25.0827 9.94824 23.2921C9.94824 21.5016 10.2617 19.7525 10.8286 18.1211V12.1962H3.125C1.10761 16.2368 0 20.4093 0 24.9998C0 29.5902 1.10761 33.7628 3.125 37.8033L10.8286 28.4632Z" fill="#FBBC04"/><path d="M24.2236 8.10001C27.9158 8.10001 31.2936 9.36365 33.9015 11.8592L40.4074 5.35339C36.4426 1.95606 30.8694 0 24.2236 0C14.931 0 6.91295 5.55903 3.125 13.512L10.8286 18.1211C12.597 12.3516 17.9547 8.10001 24.2236 8.10001Z" fill="#EA4335"/></g><defs><clipPath id="clip0_17_40"><rect width="48" height="48" fill="white"/></clipPath></defs></svg>
                Sign In with Google
            </button>
          </div>
        </div>
      }
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
    .aspect-\\[2\\/3\\] {
        aspect-ratio: 2 / 3;
    }
  `,
  imports: [NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  supabaseService = inject(SupabaseService);

  loadBookClicked = output<void>();
  bookSelected = output<Book>();

  session = this.supabaseService.session;
  books = signal<Book[]>([]);
  isLoading = signal(true);

  constructor() {
    effect(async () => {
      if (this.session()) {
        this.isLoading.set(true);
        try {
          const userBooks = await this.supabaseService.getBooks();
          this.books.set(userBooks);
        } catch (error) {
          console.error('Failed to load books', error);
          // Optionally, show an error message to the user
        } finally {
          this.isLoading.set(false);
        }
      } else {
        this.books.set([]);
      }
    }, { allowSignalWrites: true });
  }
}