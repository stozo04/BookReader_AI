// FIX: Created model interfaces for the application.
export interface Book {
  title: string;
  author: string;
  chapters: Chapter[];
  characters: string[];
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
  type: 'character' | 'summary' | 'scene-image' | 'definition' | null;
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
