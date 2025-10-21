// FIX: Implemented the ProgressService which was previously a placeholder.
import { Injectable, signal, computed, effect } from '@angular/core';
import { Book, AiCache, CharacterProfile } from '../models/ebook.model';

const PROGRESS_STORAGE_KEY = 'ebook-reader-progress';

interface Progress {
  book: Book;
  currentChapterIndex: number;
}

@Injectable({
  providedIn: 'root',
})
export class ProgressService {
  book = signal<Book | null>(null);
  currentChapterIndex = signal<number>(0);
  aiCache = signal<AiCache>({ characters: {}, summaries: {} });

  currentChapter = computed(() => {
    const book = this.book();
    const index = this.currentChapterIndex();
    if (book && book.chapters && book.chapters[index]) {
      return book.chapters[index];
    }
    return null;
  });

  progressPercentage = computed(() => {
    const book = this.book();
    if (!book || !book.chapters || book.chapters.length === 0) {
      return 0;
    }
    return ((this.currentChapterIndex() + 1) / book.chapters.length) * 100;
  });

  constructor() {
    this.loadProgress();

    // Auto-save progress whenever it changes
    effect(() => {
      const book = this.book();
      const chapterIndex = this.currentChapterIndex();
      if (book) {
        this.saveProgress(book, chapterIndex);
      }
    });

    // Auto-save AI cache whenever it changes
    effect(() => {
      const book = this.book();
      const cache = this.aiCache();
      if (book) {
        this.saveAiCache(book.title, cache);
      }
    });
  }

  loadBook(book: Book) {
    this.book.set(book);
    this.currentChapterIndex.set(0);
    this.loadAiCache(book.title);
  }

  goToChapter(index: number) {
    const book = this.book();
    if (book && index >= 0 && index < book.chapters.length) {
      this.currentChapterIndex.set(index);
    }
  }

  nextChapter() {
    const book = this.book();
    if (book && this.currentChapterIndex() < book.chapters.length - 1) {
      this.currentChapterIndex.update(i => i + 1);
    }
  }

  previousChapter() {
    if (this.currentChapterIndex() > 0) {
      this.currentChapterIndex.update(i => i - 1);
    }
  }

  clearBook() {
    const bookTitle = this.book()?.title;
    if (bookTitle) {
      localStorage.removeItem(this.getAiCacheStorageKey(bookTitle));
    }
    localStorage.removeItem(PROGRESS_STORAGE_KEY);
    this.book.set(null);
    this.currentChapterIndex.set(0);
    this.aiCache.set({ characters: {}, summaries: {} });
  }

  // --- Caching Methods ---
  getCharacterProfileFromCache(name: string) {
    return this.aiCache().characters[name];
  }

  getSummaryFromCache(index: number) {
    return this.aiCache().summaries[index];
  }

  saveCharacterProfileToCache(name: string, data: { profile: CharacterProfile, imageUrl: string }) {
    this.aiCache.update(cache => {
      cache.characters[name] = data;
      return {...cache};
    });
  }

  saveSummaryToCache(index: number, summary: string) {
    this.aiCache.update(cache => {
      cache.summaries[index] = summary;
      return {...cache};
    });
  }
  
  private getAiCacheStorageKey(bookTitle: string): string {
    // Sanitize title to create a valid key
    return `ebook-reader-ai-cache-${bookTitle.replace(/[^a-zA-Z0-9]/g, '-')}`;
  }

  private saveAiCache(bookTitle: string, cache: AiCache) {
    try {
      const key = this.getAiCacheStorageKey(bookTitle);
      localStorage.setItem(key, JSON.stringify(cache));
    } catch (e) {
      console.error('Error saving AI cache to localStorage', e);
    }
  }

  private loadAiCache(bookTitle: string) {
    try {
      const key = this.getAiCacheStorageKey(bookTitle);
      const savedCache = localStorage.getItem(key);
      if (savedCache) {
        this.aiCache.set(JSON.parse(savedCache));
      } else {
        this.aiCache.set({ characters: {}, summaries: {} });
      }
    } catch (e) {
      console.error('Error loading AI cache from localStorage', e);
      this.aiCache.set({ characters: {}, summaries: {} });
    }
  }

  private saveProgress(book: Book, chapterIndex: number) {
    try {
      const progress: Progress = { book, currentChapterIndex: chapterIndex };
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
      console.error('Error saving progress to localStorage', e);
    }
  }

  private loadProgress() {
    try {
      const savedProgress = localStorage.getItem(PROGRESS_STORAGE_KEY);
      if (savedProgress) {
        const progress: Progress = JSON.parse(savedProgress);
        this.book.set(progress.book);
        this.currentChapterIndex.set(progress.currentChapterIndex);
        if (progress.book?.title) {
            this.loadAiCache(progress.book.title);
        }
      }
    } catch (e) {
      console.error('Error loading progress from localStorage', e);
      localStorage.removeItem(PROGRESS_STORAGE_KEY);
    }
  }
}
