import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';
import { Book, Chapter } from '../models/ebook.model';

export interface DbBook {
  id: number;
  created_at: string;
  title: string;
  author: string;
  file_path: string;
  cover_url: string | null;
  structured_content: {
    chapters: Chapter[];
    characters: string[];
  };
  user_id: string;
}

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private supabaseUrl = 'https://rfzoiqeusythlsyaipaa.supabase.co';
  private supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmem9pcWV1c3l0aGxzeWFpcGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4NjMxNjYsImV4cCI6MjA3NTQzOTE2Nn0.H2sMFqSakhVDrW7-OANUBe3K4fYp0tPz7VDQMedZT-k';

  session = signal<Session | null | undefined>(undefined);

  constructor() {
    this.supabase = createClient(this.supabaseUrl, this.supabaseAnonKey);
    
    this.supabase.auth.getSession().then(({ data: { session } }) => {
      this.session.set(session);
    });

    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.session.set(session);
    });
  }

  get currentUser(): User | null {
    return this.session()?.user ?? null;
  }

  async signInWithGoogle(): Promise<void> {
    const { error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) {
      console.error('Error signing in with Google:', error.message);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error.message);
      throw error;
    }
  }

  async getBooks(): Promise<Book[]> {
    const { data, error } = await this.supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching books:', error);
      throw new Error('Could not fetch your books.');
    }

    return (data as DbBook[]).map(this.fromDbBook);
  }
  
  async uploadBookFile(file: File, userId: string): Promise<string> {
      const filePath = `${userId}/${Date.now()}-${file.name}`;
      const { error } = await this.supabase.storage
          .from('books')
          .upload(filePath, file);

      if (error) {
          console.error('Error uploading book file:', error);
          throw new Error('Failed to upload book file.');
      }
      return filePath;
  }

  async addBook(bookData: Omit<DbBook, 'id' | 'created_at' | 'cover_url'>): Promise<Book> {
      const { data, error } = await this.supabase
          .from('books')
          .insert([bookData])
          .select()
          .single();

      if (error || !data) {
          console.error('Error adding book:', error);
          throw new Error('Could not save the book to your library.');
      }
      return this.fromDbBook(data as DbBook);
  }

  private fromDbBook(dbBook: DbBook): Book {
    return {
      id: dbBook.id,
      title: dbBook.title,
      author: dbBook.author,
      chapters: dbBook.structured_content.chapters,
      characters: dbBook.structured_content.characters,
      cover_url: dbBook.cover_url ?? undefined,
      user_id: dbBook.user_id,
      file_path: dbBook.file_path,
    };
  }
}
