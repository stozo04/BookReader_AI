// FIX: Created model interfaces for the application.
// UPDATE: Added 'id', 'user_id', 'file_path', and 'cover_url' to Book model for Supabase integration.
export interface Book {
  id: number;
  user_id: string;
  file_path: string;
  title: string;
  author: string;
  chapters: Chapter[];
  characters: string[];
  cover_url?: string;
}

export interface Chapter {
  title: string;
  content: string;
}

export interface CharacterRelationship {
  characterName: string;
  relationshipType: string;
}

export interface CharacterProfile {
  description: string;
  physicalAppearance: string;
  relationships: CharacterRelationship[];
}

export interface InteractionState {
  type: 'character' | 'summary' | 'scene-image' | 'definition' | 'settings' | null;
  data: any;
  loading: boolean;
  error: string | null;
  loadingMessage: string;
}

export interface AiCache {
  characters: {
    [characterName: string]: {
      profile: CharacterProfile;
      imageUrl: string;
    };
  };
  summaries: {
    [chapterIndex: number]: string;
  };
}
