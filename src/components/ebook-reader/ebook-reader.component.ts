// FIX: Implemented the EbookReaderComponent which was previously a placeholder.
import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { ProgressService } from '../../services/progress.service';
import { GeminiService } from '../../services/gemini.service';
import { InteractionState } from '../../models/ebook.model';

@Component({
  selector: 'app-ebook-reader',
  template: `
    <div class="flex h-screen font-sans bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <!-- Sidebar for Chapters and Characters -->
      <aside 
        class="absolute z-30 inset-y-0 left-0 w-80 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out"
        [class.translate-x-0]="isMenuOpen()"
        [class.-translate-x-full]="!isMenuOpen()">
        <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-xl font-bold">Menu</h2>
          <button (click)="isMenuOpen.set(false)" class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
             <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div class="p-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex space-x-1 bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
            <button 
              (click)="activeTab.set('chapters')" 
              class="w-full px-4 py-2 text-sm font-semibold rounded-md transition-colors"
              [class.bg-white]="activeTab() === 'chapters'"
              [class.dark:bg-gray-900]="activeTab() === 'chapters'"
              [class.text-gray-800]="activeTab() === 'chapters'"
              [class.dark:text-white]="activeTab() === 'chapters'"
              [class.text-gray-600]="activeTab() !== 'chapters'"
              [class.dark:text-gray-400]="activeTab() !== 'chapters'">
              Chapters
            </button>
            <button 
              (click)="activeTab.set('characters')"
              class="w-full px-4 py-2 text-sm font-semibold rounded-md transition-colors"
              [class.bg-white]="activeTab() === 'characters'"
              [class.dark:bg-gray-900]="activeTab() === 'characters'"
              [class.text-gray-800]="activeTab() === 'characters'"
              [class.dark:text-white]="activeTab() === 'characters'"
              [class.text-gray-600]="activeTab() !== 'characters'"
              [class.dark:text-gray-400]="activeTab() !== 'characters'">
              Characters
            </button>
            <button 
              (click)="activeTab.set('summaries')"
              class="w-full px-4 py-2 text-sm font-semibold rounded-md transition-colors"
              [class.bg-white]="activeTab() === 'summaries'"
              [class.dark:bg-gray-900]="activeTab() === 'summaries'"
              [class.text-gray-800]="activeTab() === 'summaries'"
              [class.dark:text-white]="activeTab() === 'summaries'"
              [class.text-gray-600]="activeTab() !== 'summaries'"
              [class.dark:text-gray-400]="activeTab() !== 'summaries'">
              Summaries
            </button>
          </div>
        </div>
        <div class="overflow-y-auto h-[calc(100vh-140px)]">
          @if (activeTab() === 'chapters') {
            <ul>
              @for(chapter of progressService.book()?.chapters; track chapter.title; let i = $index) {
                <li 
                  (click)="goToChapter(i)"
                  class="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700"
                  [class.bg-blue-100]="i === progressService.currentChapterIndex()"
                  [class.dark:bg-blue-900]="i === progressService.currentChapterIndex()">
                  <span class="font-semibold">{{ i + 1 }}. {{ chapter.title }}</span>
                </li>
              }
            </ul>
          }
          @if (activeTab() === 'characters') {
             <ul>
              @for(character of progressService.book()?.characters; track character) {
                <li 
                  (click)="viewCharacter(character)"
                  class="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                  <span class="font-semibold">{{ character }}</span>
                </li>
              }
            </ul>
          }
           @if (activeTab() === 'summaries') {
             <ul>
              @for(chapter of progressService.book()?.chapters; track chapter.title; let i = $index) {
                <li 
                  (click)="viewChapterSummary(i)"
                  class="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                  <span class="font-semibold">{{ i + 1 }}. {{ chapter.title }}</span>
                </li>
              }
            </ul>
          }
        </div>
      </aside>
      @if(isMenuOpen()) {
        <div (click)="isMenuOpen.set(false)" class="fixed inset-0 z-20 bg-black bg-opacity-50"></div>
      }

      <!-- Main Content -->
      <div class="flex-1 flex flex-col transition-all duration-300 ease-in-out" [class.ml-80]="isMenuOpen()">
        <!-- Header -->
        <header class="flex items-center justify-between p-4 bg-white dark:bg-gray-800 shadow-md z-10">
          <button (click)="isMenuOpen.set(true)" class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div class="text-center">
            <h1 class="text-xl font-bold truncate">{{ progressService.book()?.title }}</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ progressService.book()?.author }}</p>
          </div>
          <button (click)="progressService.clearBook()" class="p-2 text-sm font-semibold text-red-600 rounded-lg hover:bg-red-100 dark:hover:bg-red-900">
            End Reading
          </button>
        </header>

         <!-- Progress Bar -->
        <div class="w-full bg-gray-200 dark:bg-gray-700 h-1.5">
          <div class="bg-blue-600 h-1.5" [style.width.%]="progressService.progressPercentage()"></div>
        </div>

        <!-- Chapter Content -->
        <main #mainContent class="flex-1 p-6 md:p-10 lg:p-12 overflow-y-auto" (mouseup)="onTextSelection($event)">
          @if (progressService.currentChapter(); as chapter) {
            <div class="max-w-3xl mx-auto">
              <h2 class="text-3xl font-bold mb-6 text-center">{{ chapter.title }}</h2>
              <div class="prose dark:prose-invert max-w-none text-lg leading-relaxed space-y-4">
                @for (paragraph of chapter.content.split('\\n'); track $index) {
                   <p>{{ paragraph }}</p>
                }
              </div>
            </div>
          }
        </main>

        <!-- Footer Navigation -->
        <footer class="flex items-center justify-between p-4 bg-white dark:bg-gray-800 shadow-inner">
          <button (click)="progressService.previousChapter()" [disabled]="progressService.currentChapterIndex() === 0" class="px-4 py-2 font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700">Previous</button>
          <div class="text-sm text-gray-600 dark:text-gray-400">
            Chapter {{ progressService.currentChapterIndex() + 1 }} of {{ progressService.book()?.chapters.length }}
          </div>
          <button (click)="progressService.nextChapter()" [disabled]="progressService.currentChapterIndex() === (progressService.book()?.chapters.length || 0) - 1" class="px-4 py-2 font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700">Next</button>
        </footer>
      </div>

      <!-- Text Selection Popover -->
      @if (selectedText()) {
        <div class="absolute z-40 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 flex space-x-2"
             [style.top.px]="selectionRect()?.top - 50" 
             [style.left.px]="selectionRect()?.left + (selectionRect()?.width / 2) - 130">
             <button (click)="getDefinition(selectedText())" 
                     [disabled]="!canDefine()"
                     class="px-3 py-1 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">Define</button>
             <button (click)="viewCharacter(selectedText())" 
                     class="px-3 py-1 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">Character</button>
             <button (click)="generateScene(selectedText())" 
                     [disabled]="!canSummarizeOrVisualize()"
                     class="px-3 py-1 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">Visualize</button>
             <button (click)="summarizeSelection(selectedText())"
                     [disabled]="!canSummarizeOrVisualize()"
                     class="px-3 py-1 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">Summarize</button>
        </div>
      }

      <!-- Interaction Modal -->
      @if (interactionState().type) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" (click)="closeInteraction()">
          <div class="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 class="text-xl font-semibold">{{ interactionState().loadingMessage || modalTitle() }}</h3>
                <button (click)="closeInteraction()" class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            
            <div class="p-6 overflow-y-auto">
              @if(interactionState().loading) {
                 <div class="flex flex-col items-center justify-center h-64">
                    <div class="w-12 h-12 border-4 border-blue-500 border-solid rounded-full animate-spin border-t-transparent"></div>
                    <p class="mt-4 text-gray-600 dark:text-gray-400">{{ interactionState().loadingMessage }}</p>
                 </div>
              } @else if (interactionState().error) {
                  <div class="p-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800" role="alert">
                    <span class="font-medium">Error:</span> {{ interactionState().error }}
                  </div>
              } @else {
                @switch (interactionState().type) {
                  @case ('character') {
                    @if(interactionState().data?.profile; as profile) {
                      <div class="flex flex-col md:flex-row gap-6">
                        <div class="flex-shrink-0 md:w-1/3">
                          @if(interactionState().data.imageUrl) {
                            <img [src]="'data:image/jpeg;base64,' + interactionState().data.imageUrl" alt="Image of {{ interactionState().data.characterName }}" class="object-cover w-full rounded-lg shadow-md">
                          } @else {
                            <div class="w-full aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                              <p class="text-sm text-gray-500">No image</p>
                            </div>
                          }
                        </div>
                        <div class="md:w-2/3">
                           <h4 class="text-2xl font-bold mb-2">{{ interactionState().data.characterName }}</h4>
                           <p class="mb-4 text-gray-600 dark:text-gray-400">{{ profile.physicalAppearance }}</p>
                           <p class="mb-4">{{ profile.description }}</p>
                           @if(profile.relationships?.length > 0) {
                             <h5 class="font-semibold mt-4 mb-2">Relationships</h5>
                             <ul class="space-y-2">
                               @for(rel of profile.relationships; track rel.characterName) {
                                 <li><strong>{{ rel.characterName }}:</strong> {{ rel.relationshipType }}</li>
                               }
                             </ul>
                           }
                        </div>
                      </div>
                    }
                  }
                  @case ('summary') {
                     <p class="text-lg leading-relaxed">{{ interactionState().data }}</p>
                  }
                   @case ('scene-image') {
                     <img [src]="'data:image/jpeg;base64,' + interactionState().data" alt="Generated scene" class="w-full rounded-lg shadow-md">
                  }
                  @case ('definition') {
                     <p class="text-lg">{{ interactionState().data }}</p>
                  }
                }
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .prose {
        text-align: justify;
    }
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
export class EbookReaderComponent {
  progressService = inject(ProgressService);
  geminiService = inject(GeminiService);

  isMenuOpen = signal(false);
  activeTab = signal<'chapters' | 'characters' | 'summaries'>('chapters');
  
  interactionState = signal<InteractionState>({ type: null, data: null, loading: false, error: null, loadingMessage: '' });

  selectedText = signal('');
  selectionRect = signal<{ top: number, left: number, width: number, height: number } | null>(null);
  
  wordCount = computed(() => this.selectedText().split(/\s+/).filter(Boolean).length);
  canDefine = computed(() => this.wordCount() > 0 && this.wordCount() <= 5);
  canSummarizeOrVisualize = computed(() => this.wordCount() > 2);

  modalTitle = computed(() => {
    switch(this.interactionState().type) {
      case 'character': return `Character Profile: ${this.interactionState().data?.characterName}`;
      case 'summary': return `Summary`;
      case 'scene-image': return 'Scene Visualization';
      case 'definition': return `Definition`;
      default: return '';
    }
  });

  onTextSelection(event: MouseEvent) {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      const text = selection.toString().trim();
      // Simple check to avoid activating on chapter titles etc.
      if (text.length > 0 && text.length < 500 && (event.target as HTMLElement).nodeName === 'P') {
        this.selectedText.set(text);
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        this.selectionRect.set({ top: rect.top + window.scrollY, left: rect.left + window.scrollX, width: rect.width, height: rect.height });
      }
    } else {
      // Delay clearing to allow clicks on the popover
      setTimeout(() => {
        if (!this.interactionState().type) { // Don't clear if a modal was just opened
            this.selectedText.set('');
            this.selectionRect.set(null);
        }
      }, 100);
    }
  }

  goToChapter(index: number) {
    this.progressService.goToChapter(index);
    this.isMenuOpen.set(false);
  }

  closeInteraction() {
    this.interactionState.set({ type: null, data: null, loading: false, error: null, loadingMessage: '' });
    this.selectedText.set('');
    this.selectionRect.set(null);
  }

  async viewCharacter(name: string) {
    const book = this.progressService.book();
    if (!book) return;

    // Check if the selected text is a known character
    const characterName = book.characters.find(c => c.toLowerCase() === name.toLowerCase());
    if (!characterName) {
        this.interactionState.set({ type: 'character', data: null, loading: false, error: `"${name}" is not recognized as a main character.`, loadingMessage: '' });
        return;
    }
    
    this.interactionState.set({ type: 'character', data: { characterName }, loading: true, error: null, loadingMessage: `Generating profile for ${characterName}...` });
    
    const cached = this.progressService.getCharacterProfileFromCache(characterName);
    if (cached) {
      this.interactionState.set({ type: 'character', data: { characterName, ...cached }, loading: false, error: null, loadingMessage: '' });
      return;
    }

    try {
      const profile = await this.geminiService.getCharacterProfile(characterName, book);
      this.interactionState.update(s => ({...s, loadingMessage: 'Generating character image...'}));
      const imageUrl = await this.geminiService.generateCharacterImage(characterName, profile.physicalAppearance, book.title);
      
      this.progressService.saveCharacterProfileToCache(characterName, { profile, imageUrl });
      this.interactionState.set({ type: 'character', data: { characterName, profile, imageUrl }, loading: false, error: null, loadingMessage: '' });
    } catch (e) {
      this.interactionState.set({ type: 'character', data: { characterName }, loading: false, error: e instanceof Error ? e.message : 'Unknown error', loadingMessage: '' });
    }
  }

  async summarizeSelection(selectedText: string) {
    const book = this.progressService.book();
    if (!book) return;

    this.interactionState.set({ type: 'summary', data: null, loading: true, error: null, loadingMessage: 'Generating summary for selection...' });
    
    try {
      const summary = await this.geminiService.summarizeSelection(selectedText, book.title);
      this.interactionState.set({ type: 'summary', data: summary, loading: false, error: null, loadingMessage: '' });
    } catch (e) {
      this.interactionState.set({ type: 'summary', data: null, loading: false, error: e instanceof Error ? e.message : 'Unknown error', loadingMessage: '' });
    }
  }

  async viewChapterSummary(index: number) {
    const book = this.progressService.book();
    if (!book) return;
    const chapter = book.chapters[index];

    this.interactionState.set({ type: 'summary', data: null, loading: true, error: null, loadingMessage: `Generating summary for "${chapter.title}"...` });
    this.isMenuOpen.set(false);

    const cached = this.progressService.getSummaryFromCache(index);
    if (cached) {
      this.interactionState.set({ type: 'summary', data: cached, loading: false, error: null, loadingMessage: '' });
      return;
    }

    try {
      const summary = await this.geminiService.getChapterSummary(chapter.title, chapter.content, book.title);
      this.progressService.saveSummaryToCache(index, summary);
      this.interactionState.set({ type: 'summary', data: summary, loading: false, error: null, loadingMessage: '' });
    } catch (e) {
      this.interactionState.set({ type: 'summary', data: null, loading: false, error: e instanceof Error ? e.message : 'Unknown error', loadingMessage: '' });
    }
  }

  async generateScene(selectedText: string) {
    const book = this.progressService.book();
    if (!book) return;

    this.interactionState.set({ type: 'scene-image', data: null, loading: true, error: null, loadingMessage: 'Generating scene visualization...' });

    try {
      const imageUrl = await this.geminiService.generateSceneImage(selectedText, book.title);
      this.interactionState.set({ type: 'scene-image', data: imageUrl, loading: false, error: null, loadingMessage: '' });
    } catch (e) {
      this.interactionState.set({ type: 'scene-image', data: null, loading: false, error: e instanceof Error ? e.message : 'Unknown error', loadingMessage: '' });
    }
  }

  async getDefinition(word: string) {
    this.interactionState.set({ type: 'definition', data: null, loading: true, error: null, loadingMessage: `Defining "${word}"...` });

    try {
      const definition = await this.geminiService.getDefinition(word);
      this.interactionState.set({ type: 'definition', data: definition, loading: false, error: null, loadingMessage: '' });
    } catch (e) {
      this.interactionState.set({ type: 'definition', data: null, loading: false, error: e instanceof Error ? e.message : 'Unknown error', loadingMessage: '' });
    }
  }
}