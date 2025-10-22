import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';
import { Book, Chapter } from '../models/ebook.model';
import { environment } from "../environments/environment";

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
  current_chapter_index: number;
}

// DEV_FLAG: When Supabase keys are not set in the environment, enable development bypass.
const IS_DEV_BYPASS =
  !environment.NEXT_PUBLIC_SUPABASE_URL ||
  !environment.NEXT_PUBLIC_SUPABASE_ANON_KEY;

@Injectable({
  providedIn: "root",
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private supabaseUrl = environment.NEXT_PUBLIC_SUPABASE_URL;
  private supabaseAnonKey = environment.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  session = signal<Session | null | undefined>(undefined);

  constructor() {
    if (IS_DEV_BYPASS) {
      console.warn(
        "SupabaseService: Supabase environment variables are not set. Running in development bypass mode."
      );
      // Create a dummy client with empty strings to avoid runtime errors in dev mode
      this.supabase = createClient("", "");
      this.createDevelopmentSession();
      return;
    }

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

  private createDevelopmentSession() {
    const mockUser: User = {
      id: "489f40c8-f103-4146-90c0-fa649c449510", // From provided JWT
      app_metadata: { provider: "google", providers: ["google"] },
      user_metadata: {
        email: "gates.steven@gmail.com",
        full_name: "Steven Gates",
      },
      aud: "authenticated",
      created_at: new Date().toISOString(),
      is_anonymous: false,
      role: "authenticated",
      email: "gates.steven@gmail.com",
      phone: "",
      updated_at: new Date().toISOString(),
    };

    const mockSession: Session = {
      access_token: "mock_access_token_for_dev",
      refresh_token: "mock_refresh_token_for_dev",
      token_type: "bearer",
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: mockUser,
    };

    this.session.set(mockSession);
  }

  async signInWithGoogle(): Promise<void> {
    if (IS_DEV_BYPASS) {
      console.log("Bypassing Google Sign-In for development.");
      this.createDevelopmentSession();
      return;
    }
    const { error } = await this.supabase.auth.signInWithOAuth({
      provider: "google",
    });
    if (error) {
      console.error("Error signing in with Google:", error.message);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    if (IS_DEV_BYPASS) {
      this.session.set(null);
      return;
    }
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error.message);
      throw error;
    }
  }

  async getBooks(): Promise<Book[]> {
    const { data, error } = await this.supabase
      .from("books")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching books:", error);
      throw new Error("Could not fetch your books.");
    }

    return (data as DbBook[]).map(this.fromDbBook);
  }

  async uploadBookFile(file: File, userId: string): Promise<string> {
    const filePath = `${userId}/${Date.now()}-${file.name}`;
    const { error } = await this.supabase.storage
      .from("books")
      .upload(filePath, file);

    if (error) {
      console.error("Error uploading book file:", error);
      throw new Error("Failed to upload book file.");
    }
    return filePath;
  }

  async addBook(
    bookData: Omit<
      DbBook,
      "id" | "created_at" | "cover_url" | "current_chapter_index"
    >
  ): Promise<Book> {
    const dataToInsert = {
      ...bookData,
      current_chapter_index: 0,
    };

    const { data, error } = await this.supabase
      .from("books")
      .insert([dataToInsert])
      .select()
      .single();

    if (error || !data) {
      console.error("Error adding book:", error);
      throw new Error("Could not save the book to your library.");
    }
    return this.fromDbBook(data as DbBook);
  }

  async updateBookProgress(
    bookId: number,
    chapterIndex: number
  ): Promise<void> {
    const { error } = await this.supabase
      .from("books")
      .update({ current_chapter_index: chapterIndex })
      .eq("id", bookId);

    if (error) {
      console.error("Error updating book progress:", error);
      throw new Error("Could not save your reading progress.");
    }
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
      current_chapter_index: dbBook.current_chapter_index || 0,
    };
  }
}