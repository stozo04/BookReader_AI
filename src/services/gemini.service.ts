// FIX: Implemented the GeminiService to handle all interactions with the Google GenAI API.
import { Injectable } from '@angular/core';
import { GoogleGenAI, Type } from '@google/genai';
import { Book, CharacterProfile, Chapter } from '../models/ebook.model';
import { environment } from "../environments/environment";

// Read the API key from Angular environment files. If empty, enable development bypass.
const GEMINI_API_KEY = environment.GEMINI_API_KEY || "";
const IS_DEV_BYPASS = !GEMINI_API_KEY;

@Injectable({
  providedIn: "root",
})
export class GeminiService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    if (IS_DEV_BYPASS) {
      console.warn(
        "GeminiService: GEMINI_API_KEY is not set in environment. Running in development bypass mode. " +
          "To enable live AI features, set environment.GEMINI_API_KEY in your environment files or CI."
      );
      this.ai = null;
    } else {
      // Use the provided API key
      this.ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    }
  }

  async structureBookFromText(textContent: string): Promise<Book> {
    if (IS_DEV_BYPASS || !this.ai) {
      console.warn("Bypassing Gemini book structuring for development.");
      // Return a mock book structure
      const mockChapters: Chapter[] = textContent
        .split(/\n\s*\n/)
        .filter((p) => p.trim())
        .slice(0, 15)
        .map((p, i) => ({
          title: `Mock Chapter ${i + 1}`,
          content:
            p ||
            `This is the mock content for chapter ${
              i + 1
            }. It is generated locally.`,
        }));

      const mockBook: Book = {
        id: 0,
        user_id: "dev_user",
        file_path: "local/mock.txt",
        title: "Mock Book Title",
        author: "Development Author",
        chapters:
          mockChapters.length > 0
            ? mockChapters
            : [
                {
                  title: "Chapter 1",
                  content: "The book content could not be parsed or was empty.",
                },
              ],
        characters: ["Alice", "The Mad Hatter", "The Queen of Hearts", "Bob"],
        // FIX: Added missing required property to satisfy the Book interface.
        current_chapter_index: 0,
      };
      return new Promise((resolve) =>
        setTimeout(() => resolve(mockBook), 1500)
      );
    }

    const bookSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "The title of the book." },
        author: {
          type: Type.STRING,
          description:
            'The author of the book. If unknown, state "Unknown Author".',
        },
        chapters: {
          type: Type.ARRAY,
          description: "An array of chapters that make up the book.",
          items: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: "The title of the chapter.",
              },
              content: {
                type: Type.STRING,
                description: "The full text content of the chapter.",
              },
            },
            required: ["title", "content"],
          },
        },
        characters: {
          type: Type.ARRAY,
          description: "A list of main character names mentioned in the text.",
          items: { type: Type.STRING },
        },
      },
      required: ["title", "author", "chapters", "characters"],
    };

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Analyze the following book text. Identify the title, author, a list of main characters, and divide the text into logical chapters with titles and full content. The first chapter should start from the beginning of the text. Do not invent content not present in the text. Return the result in JSON format.\n\nTEXT:\n${textContent}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: bookSchema,
        },
      });

      const jsonString = response.text;
      const partialBook = JSON.parse(jsonString);
      // FIX: Augment the partial book from AI with required fields to match the return type.
      const structuredBook: Book = {
        ...partialBook,
        id: -1, // placeholder
        user_id: "", // placeholder
        file_path: "", // placeholder
        current_chapter_index: 0,
      };
      return structuredBook;
    } catch (error) {
      console.error("Error structuring book with Gemini:", error);
      throw new Error(
        "Failed to analyze the book structure. The AI model could not process the text."
      );
    }
  }

  async getCharacterProfile(
    characterName: string,
    book: Book
  ): Promise<CharacterProfile> {
    if (IS_DEV_BYPASS || !this.ai) {
      console.warn(`Bypassing Gemini profile generation for ${characterName}.`);
      const mockProfile: CharacterProfile = {
        description: `This is a mock description for ${characterName}. They are a central figure in this mock book, known for their courage and wit. This profile was generated locally for development purposes.`,
        physicalAppearance:
          "A tall individual with striking blue eyes and a friendly smile. Their appearance is notable and often commented on by others.",
        relationships: [
          { characterName: "Alice", relationshipType: "Friend" },
          { characterName: "The Mad Hatter", relationshipType: "Ally" },
          {
            characterName: "The Queen of Hearts",
            relationshipType: "Antagonist",
          },
        ].filter((r) => r.characterName !== characterName),
      };
      return new Promise((resolve) =>
        setTimeout(() => resolve(mockProfile), 1000)
      ); // Simulate network delay
    }

    const characterProfileSchema = {
      type: Type.OBJECT,
      properties: {
        description: {
          type: Type.STRING,
          description:
            "A detailed description of the character's personality, motivations, and role in the story.",
        },
        physicalAppearance: {
          type: Type.STRING,
          description:
            "A description of the character's physical appearance. If none is found, this should be an empty string.",
        },
        relationships: {
          type: Type.ARRAY,
          description:
            "A list of the character's key relationships with other characters.",
          items: {
            type: Type.OBJECT,
            properties: {
              characterName: {
                type: Type.STRING,
                description: "The name of the other character.",
              },
              relationshipType: {
                type: Type.STRING,
                description:
                  "The nature of their relationship (e.g., friend, enemy, family).",
              },
            },
            required: ["characterName", "relationshipType"],
          },
        },
      },
      required: ["description", "physicalAppearance", "relationships"],
    };

    const systemInstruction = `You are an expert literary analyst. Your task is to create a detailed character profile based on the provided text from a book.
- **Analyze Deeply**: Read the text carefully to understand the character's personality, appearance, and relationships.
- **Be Accurate**: Only include details explicitly mentioned or strongly implied in the text. Do not invent information.
- **Relationships are CRITICAL**: Actively search for mentions of other characters interacting with the target character. If relationships are described, you MUST include them. For example, if the text says "Andrew's best friend, Natalie," you must list Natalie as a 'Best Friend'.
- **Appearance**: If there is any description of the character's physical appearance, you MUST include it. If there is absolutely no description, return an empty string for the 'physicalAppearance' field. Do not write "No description available."`;

    const fullBookText = book.chapters.map((c) => c.content).join("\n\n");
    const contextText = fullBookText.substring(0, 200000); // Use a large context window

    const prompt = `From the book "${book.title}", analyze the provided text to create a profile for the character: "${characterName}".

## Full Book Text (excerpt):
${contextText}
`;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: characterProfileSchema,
        },
      });
      const jsonString = response.text;
      return JSON.parse(jsonString);
    } catch (error) {
      console.error(`Error fetching profile for ${characterName}:`, error);
      throw new Error(`Failed to generate a profile for ${characterName}.`);
    }
  }

  async generateCharacterImage(
    characterName: string,
    physicalAppearance: string,
    bookTitle: string
  ): Promise<string> {
    if (IS_DEV_BYPASS || !this.ai) {
      console.warn(`Bypassing Gemini image generation for ${characterName}.`);
      // A simple, small, gray placeholder image (base64 encoded).
      const mockImageBytes =
        "iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAB/g1sMAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAACXBIWXMAAAsTAAALEwEAmpwYAAABWWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPHg6eG1wmetaIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJYTVAgQ29yZSA2LjAuMCI+CiAgIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgICAgIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiCiAgICAgICAgICAgIHhtbG5zOnRpZmY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vdGlmZi8xLjAvIj4KICAgICAgICAgPHRpZmY6UmVzb2x1dGlvblVuaXQ+MjwvdGlmZjpSZXNvbHV0aW9uVW5pdD4KICAgICAgICAgPHRpZmY6WFJlc29sdXRpb24+NzI8L3RpZmY6WFJlc29sdXRpb24+CiAgICAgICAgIDx0aWZmOllSZXNvbHV0aW9uPjcyPC90aWZmOllSZXNvbHV0aW9uPgogICAgICA8L3JkZjpEZXNjcmlwdGlvbj4KICAgPC9yZGY6UkRGPgo8L3g6eG1wmetaPgpMwidZAAABJElEQVR42uzZsQ2AMBAF0e8/JR0kEEjA0s093AlI4A95AIHkd2fX5z3n/h5+n88BwBUmB8AYJgfAGCYHwBgmdQDm7u6+vr6+u7vLMAxIJBKfz2cyySQSiSRJlmVZlmVZ161pmhAEURRFEARBkiQIgqBpmjiO4ziOY7/f6/V6v9/v9/sQQhAEy7JEURRFURzHruv6PE8QBEEQBEEQBMuyLMuyLMsURcGyrFixYkWMjo6urq4ODg583w8hBEEQBEFzcyvP87qu67qur7u7W5ZlkiSchOM4SRJBEARBEARBEARBEARBkiRJkiRJkixJkiSdTqdpmhAEQRD0+32SJBzH+/3+6uqqqqra2toCgYDt7W0sFkssFlssFu12u91um6YpSRJBEARBEARBkiT/2gcYJgfAGCYHwBgmB8AYpgcAL/wDCvE4fOpJ3wcAAAAASUVORK5CYII=";
      return new Promise((resolve) =>
        setTimeout(() => resolve(mockImageBytes), 1500)
      );
    }

    try {
      const response = await this.ai.models.generateImages({
        model: "imagen-3.0-generate-002",
        prompt: `A digital painting portrait of ${characterName} from the book "${bookTitle}". Their appearance is described as: "${physicalAppearance}". The image should be focused on the character, with a simple, atmospheric background related to the book's setting.`,
        config: {
          numberOfImages: 1,
          outputMimeType: "image/jpeg",
          aspectRatio: "1:1",
        },
      });
      return response.generatedImages[0].image.imageBytes;
    } catch (error) {
      console.error(`Error generating image for ${characterName}:`, error);
      throw new Error(`Failed to generate an image for ${characterName}.`);
    }
  }

  async getChapterSummary(
    chapterTitle: string,
    chapterContent: string,
    bookTitle: string
  ): Promise<string> {
    if (IS_DEV_BYPASS || !this.ai) {
      console.warn(`Bypassing Gemini summary for chapter "${chapterTitle}".`);
      const mockSummary = `This is a mock summary for the chapter titled "${chapterTitle}". Key events include mock characters doing mock things. This summary was generated locally for development purposes.`;
      return new Promise((resolve) =>
        setTimeout(() => resolve(mockSummary), 800)
      );
    }

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Concisely summarize the following chapter from the book "${bookTitle}". The chapter is titled "${chapterTitle}". The summary should be 2-3 sentences long, capturing the main events and character developments.\n\nCHAPTER CONTENT:\n${chapterContent.substring(
          0,
          8000
        )}`,
      });
      return response.text;
    } catch (error) {
      console.error(
        `Error generating summary for chapter "${chapterTitle}":`,
        error
      );
      throw new Error("Failed to generate chapter summary.");
    }
  }

  async summarizeSelection(
    selectedText: string,
    bookTitle: string
  ): Promise<string> {
    if (IS_DEV_BYPASS || !this.ai) {
      console.warn(`Bypassing Gemini summary for selection.`);
      const mockSummary = `This is a mock summary of your selected text. It highlights the main points in a simulated, developer-friendly way.`;
      return new Promise((resolve) =>
        setTimeout(() => resolve(mockSummary), 500)
      );
    }

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Concisely summarize the following text selection from the book "${bookTitle}". The summary should be 1-2 sentences long, capturing the main point of the selection.\n\nTEXT:\n${selectedText}`,
      });
      return response.text;
    } catch (error) {
      console.error(`Error generating summary for selection:`, error);
      throw new Error("Failed to generate summary for the selection.");
    }
  }

  async generateSceneImage(
    selectedText: string,
    bookTitle: string
  ): Promise<string> {
    if (IS_DEV_BYPASS || !this.ai) {
      console.warn(`Bypassing Gemini scene image generation.`);
      // A simple, small, gray placeholder image (base64 encoded).
      const mockImageBytes =
        "iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAB/g1sMAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAACXBIWXMAAAsTAAALEwEAmpwYAAABWWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPHg6eG1wmetaIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJYTVAgQ29yZSA2LjAuMCI+CiAgIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgICAgIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiCiAgICAgICAgICAgIHhtbG5zOnRpZmY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vdGlmZi8xLjAvIj4KICAgICAgICAgPHRpZmY6UmVzb2x1dGlvblVuaXQ+MjwvdGlmZjpSZXNvbHV0aW9uVW5pdD4KICAgICAgICAgPHRpZmY6WFJlc29sdXRpb24+NzI8L3RpZmY6WFJlc29sdXRpb24+CiAgICAgICAgIDx0aWZmOllSZXNvbHV0aW9uPjcyPC90aWZmOllSZXNvbHV0aW9uPgogICAgICA8L3JkZjpEZXNjcmlwdGlvbj4KICAgPC9yZGY6UkRGPgo8L3g6eG1wmetaPgpMwidZAAABJElEQVR42uzZsQ2AMBAF0e8/JR0kEEjA0s093AlI4A95AIHkd2fX5z3n/h5+n88BwBUmB8AYJgfAGCYHwBgmdQDm7u6+vr6+u7vLMAxIJBKfz2cyySQSiSRJlmVZlmVZ161pmhAEURRFEARBkiQIgqBpmjiO4ziOY7/f6/V6v9/v9/sQQhAEy7JEURRFURzHruv6PE8QBEEQBEEQBMuyLMuyLMsURcGyrFixYkWMjo6urq4ODg583w8hBEEQBEFzcyvP87qu67qur7u7W5ZlkiSchOM4SRJBEARBEARBEARBEARBkiRJkiRJkixJkiSdTqdpmhAEQRD0+32SJBzH+/3+6uqqqqra2toCgYDt7W0sFkssFlssFu12u91um6YpSRJBEARBEARBkiT/2gcYJgfAGCYHwBgmB8AYpgcAL/wDCvE4fOpJ3wcAAAAASUVORK5CYII=";
      return new Promise((resolve) =>
        setTimeout(() => resolve(mockImageBytes), 2000)
      );
    }

    try {
      const response = await this.ai.models.generateImages({
        model: "imagen-3.0-generate-002",
        prompt: `An atmospheric, digital painting illustrating the following scene from the book "${bookTitle}": "${selectedText}"`,
        config: {
          numberOfImages: 1,
          outputMimeType: "image/jpeg",
          aspectRatio: "16:9",
        },
      });
      return response.generatedImages[0].image.imageBytes;
    } catch (error) {
      console.error("Error generating scene image:", error);
      throw new Error("Failed to generate an image for the scene.");
    }
  }

  async getDefinition(word: string): Promise<string> {
    if (IS_DEV_BYPASS || !this.ai) {
      console.warn(`Bypassing Gemini definition for "${word}".`);
      return new Promise((resolve) =>
        setTimeout(
          () =>
            resolve(
              `This is a mock definition for "${word}". It is a word used in this book for illustrative purposes in a development environment.`
            ),
          500
        )
      );
    }

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Provide a concise definition for the word: "${word}"`,
      });
      return response.text;
    } catch (error) {
      console.error(`Error getting definition for "${word}":`, error);
      throw new Error(`Failed to get a definition for "${word}".`);
    }
  }
}