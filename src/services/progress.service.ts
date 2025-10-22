// FIX: Implemented the ProgressService which was previously a placeholder.
import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { Book, AiCache, CharacterProfile } from '../models/ebook.model';
import { SupabaseService } from './supabase.service';

const EBOOK_READER_STATE = 'ebook_reader_state';

interface AppState {
  book: Book | null;
  currentChapterIndex: number;
  fontSize: number;
  theme: 'light' | 'dark';
  fontFamily: string;
  aiCache: AiCache;
  progressByBookId: { [id: number]: number }; // bookId: chapterIndex
}

@Injectable({
  providedIn: 'root',
})
export class ProgressService {
  private supabaseService = inject(SupabaseService);
  private state = signal<AppState>(this.loadState());

  book = computed(() => this.state().book);
  currentChapterIndex = computed(() => this.state().currentChapterIndex);
  fontSize = computed(() => this.state().fontSize);
  theme = computed(() => this.state().theme);
  fontFamily = computed(() => this.state().fontFamily);
  aiCache = computed(() => this.state().aiCache);
  
  currentChapter = computed(() => {
    const book = this.book();
    const index = this.currentChapterIndex();
    if (!book || index < 0 || index >= book.chapters.length) {
      return null;
    }
    return book.chapters[index];
  });

  totalChapters = computed(() => this.book()?.chapters.length ?? 0);
  
  constructor() {
    effect(() => {
      try {
        localStorage.setItem(EBOOK_READER_STATE, JSON.stringify(this.state()));
      } catch (error) {
        console.error('Could not save state to localStorage', error);
      }
    });
  }

  loadBook(book: Book) {
    // Initialize chapter index from the book's persisted data from Supabase
    const lastChapterIndex = book.current_chapter_index || 0;
    this.state.update(state => ({
      ...state,
      book,
      currentChapterIndex: lastChapterIndex,
      // Update local progress map as well
      progressByBookId: {
        ...state.progressByBookId,
        [book.id]: lastChapterIndex,
      },
      aiCache: { characters: {}, summaries: {} },
    }));
  }
  
  goToChapter(index: number) {
    const book = this.state().book;
    const total = this.totalChapters();
    if (book && index >= 0 && index < total) {
      this.state.update(state => ({
        ...state,
        currentChapterIndex: index,
        // Update the local progress map; this will be synced on exit.
        progressByBookId: {
          ...state.progressByBookId,
          [book.id]: index,
        },
      }));
    }
  }

  nextChapter() {
    this.goToChapter(this.currentChapterIndex() + 1);
  }

  previousChapter() {
    this.goToChapter(this.currentChapterIndex() - 1);
  }
  
  increaseFontSize() {
    this.state.update(state => ({ ...state, fontSize: Math.min(state.fontSize + 1, 32) }));
  }

  decreaseFontSize() {
    this.state.update(state => ({ ...state, fontSize: Math.max(state.fontSize - 1, 12) }));
  }

  setFontSize(size: number) {
    this.state.update(state => ({
      ...state,
      fontSize: Math.max(12, Math.min(32, Number(size)))
    }));
  }

  setTheme(theme: 'light' | 'dark') {
    this.state.update(state => ({ ...state, theme }));
  }
  
  setFontFamily(fontFamily: string) {
    this.state.update(state => ({ ...state, fontFamily }));
  }

  updateCharacterCache(characterName: string, profile: CharacterProfile, imageUrl: string) {
    this.state.update(state => ({
      ...state,
      aiCache: {
        ...state.aiCache,
        characters: {
          ...state.aiCache.characters,
          [characterName]: { profile, imageUrl },
        },
      },
    }));
  }

  updateSummaryCache(chapterIndex: number, summary: string) {
    this.state.update(state => ({
      ...state,
      aiCache: {
        ...state.aiCache,
        summaries: {
          ...state.aiCache.summaries,
          [chapterIndex]: summary,
        },
      },
    }));
  }

  async reset() {
    const currentBook = this.book();
    if (currentBook) {
      const latestChapterIndex = this.state().progressByBookId[currentBook.id] ?? currentBook.current_chapter_index;
      try {
        await this.supabaseService.updateBookProgress(currentBook.id, latestChapterIndex);
      } catch (error) {
        console.error("Failed to save progress to Supabase:", error);
        // Optionally, notify the user that progress couldn't be saved.
      }
    }

    // Keep user settings and progress, but clear the active book
    this.state.update(state => {
      const initialState = this.getInitialState();
      return {
        ...state,
        book: null,
        currentChapterIndex: 0,
        aiCache: initialState.aiCache,
      };
    });
  }

  private loadState(): AppState {
    const initialState = this.getInitialState();
    try {
      const savedState = localStorage.getItem(EBOOK_READER_STATE);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        // Merge saved state over defaults to ensure all properties exist
        return { ...initialState, ...parsed };
      }
    } catch (error) {
      console.error('Could not load state from localStorage', error);
    }
    return initialState;
  }

  private getInitialState(): AppState {
    const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return {
      book: null,
      currentChapterIndex: 0,
      fontSize: 16,
      theme: prefersDark ? 'dark' : 'light',
      fontFamily: 'Literata',
      aiCache: { characters: {}, summaries: {} },
      progressByBookId: {},
    };
  }
}