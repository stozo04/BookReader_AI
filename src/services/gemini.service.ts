// FIX: Implemented the GeminiService to handle all interactions with the Google GenAI API.
import { Injectable } from '@angular/core';
import { GoogleGenAI, Type } from '@google/genai';
import { Book, CharacterProfile } from '../models/ebook.model';

// The instructions are strict about using process.env.API_KEY.
// This declaration is a workaround for the browser environment where 'process' is not a standard global.
// It assumes the execution environment will provide this object.
declare const process: any;

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async structureBookFromText(textContent: string): Promise<Book> {
    const truncatedContent = textContent.substring(0, 30000);

    const bookSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'The title of the book.' },
        author: { type: Type.STRING, description: 'The author of the book. If unknown, state "Unknown Author".' },
        chapters: {
          type: Type.ARRAY,
          description: 'An array of chapters that make up the book.',
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: 'The title of the chapter.' },
              content: { type: Type.STRING, description: 'The full text content of the chapter.' },
            },
            required: ['title', 'content'],
          },
        },
        characters: {
          type: Type.ARRAY,
          description: 'A list of main character names mentioned in the text.',
          items: { type: Type.STRING },
        },
      },
      required: ['title', 'author', 'chapters', 'characters'],
    };

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze the following text from a book. The text may be incomplete. Based on the provided text, identify the title, author, a list of main characters, and divide the text into logical chapters with titles and content. The first chapter should start from the beginning of the text. Do not invent content not present in the text. Return the result in JSON format.\n\nTEXT:\n${truncatedContent}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: bookSchema,
        },
      });

      const jsonString = response.text;
      const structuredBook: Book = JSON.parse(jsonString);
      return structuredBook;
    } catch (error) {
      console.error('Error structuring book with Gemini:', error);
      throw new Error('Failed to analyze the book structure. The AI model could not process the text.');
    }
  }

  async getCharacterProfile(characterName: string, book: Book): Promise<CharacterProfile> {
    const characterProfileSchema = {
        type: Type.OBJECT,
        properties: {
            description: { type: Type.STRING, description: "A detailed description of the character's personality, motivations, and role in the story." },
            physicalAppearance: { type: Type.STRING, description: "A description of the character's physical appearance." },
            relationships: {
                type: Type.ARRAY,
                description: "A list of the character's key relationships with other characters.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        characterName: { type: Type.STRING, description: "The name of the other character." },
                        relationshipType: { type: Type.STRING, description: "The nature of their relationship (e.g., friend, enemy, family)." },
                    },
                    required: ["characterName", "relationshipType"],
                },
            },
        },
        required: ["description", "physicalAppearance", "relationships"],
    };

    const bookContext = `The book is "${book.title}" by ${book.author}. The main characters are: ${book.characters.join(', ')}.`;

    try {
        const response = await this.ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Based on the provided book context, create a character profile for ${characterName}. \n\nCONTEXT: ${bookContext}`,
            config: {
                responseMimeType: 'application/json',
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

  async generateCharacterImage(characterName: string, physicalAppearance: string, bookTitle: string): Promise<string> {
    try {
        const response = await this.ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: `A digital painting portrait of ${characterName} from the book "${bookTitle}". Their appearance is described as: "${physicalAppearance}". The image should be focused on the character, with a simple, atmospheric background related to the book's setting.`,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '1:1',
            }
        });
        return response.generatedImages[0].image.imageBytes;
    } catch (error) {
        console.error(`Error generating image for ${characterName}:`, error);
        throw new Error(`Failed to generate an image for ${characterName}.`);
    }
  }

  async getChapterSummary(chapterTitle: string, chapterContent: string, bookTitle: string): Promise<string> {
    try {
        const response = await this.ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Concisely summarize the following chapter from the book "${bookTitle}". The chapter is titled "${chapterTitle}". The summary should be 2-3 sentences long, capturing the main events and character developments.\n\nCHAPTER CONTENT:\n${chapterContent.substring(0, 8000)}`,
        });
        return response.text;
    } catch (error) {
        console.error(`Error generating summary for chapter "${chapterTitle}":`, error);
        throw new Error('Failed to generate chapter summary.');
    }
  }

  async generateSceneImage(selectedText: string, bookTitle: string): Promise<string> {
    try {
        const response = await this.ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: `An atmospheric, digital painting illustrating the following scene from the book "${bookTitle}": "${selectedText}"`,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '16:9',
            }
        });
        return response.generatedImages[0].image.imageBytes;
    } catch (error) {
        console.error('Error generating scene image:', error);
        throw new Error('Failed to generate an image for the scene.');
    }
  }

  async getDefinition(word: string): Promise<string> {
    try {
        const response = await this.ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Provide a concise definition for the word: "${word}"`,
        });
        return response.text;
    } catch (error) {
        console.error(`Error getting definition for "${word}":`, error);
        throw new Error(`Failed to get a definition for "${word}".`);
    }
  }
}
