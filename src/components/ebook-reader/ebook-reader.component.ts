// FIX: Implemented the EbookReaderComponent which was previously a placeholder.
import { Component, ChangeDetectionStrategy, inject, signal, computed, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressService } from '../../services/progress.service';
import { GeminiService } from '../../services/gemini.service';
import { CharacterProfile, InteractionState } from '../../models/ebook.model';

type SidebarView = {
    type: 'list' | 'character_profile' | 'selection_summary' | 'scene_image' | 'definition';
    data?: any;
};

@Component({
  selector: 'app-ebook-reader',
  template: `
    <div class="flex h-screen font-sans bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <!-- Left Sidebar -->
      <aside 
        class="h-full border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col shadow-lg transition-all duration-300 ease-in-out"
        [class.w-96]="!isSidebarCollapsed()"
        [class.w-20]="isSidebarCollapsed()">
        <!-- Sidebar Header -->
        <div class="p-4 border-b border-gray-200 dark:border-gray-700 shrink-0 flex items-center space-x-3">
            <button (click)="goBackToLibrary()" [disabled]="isSaving()" title="Back to Library" class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shrink-0 disabled:opacity-50 disabled:cursor-wait">
                @if(isSaving()) {
                  <div class="w-6 h-6 border-2 border-blue-500 border-solid rounded-full animate-spin border-t-transparent"></div>
                } @else {
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                  </svg>
                }
            </button>
            @if (!isSidebarCollapsed()) {
            <div class="min-w-0 flex-1">
                <h1 class="text-xl font-bold truncate">{{ progressService.book()?.title }}</h1>
                <h2 class="text-sm text-gray-500 dark:text-gray-400 truncate">{{ progressService.book()?.author }}</h2>
            </div>
            }
        </div>

        <!-- Sidebar Content -->
        <div class="flex-1 flex flex-col overflow-y-auto">
          @if (!isSidebarCollapsed()) {
            @if (sidebarView().type !== 'list') {
              <!-- Detail View (Character Profile, Summary, etc.) -->
              <div class="flex-1 flex flex-col">
                <div class="p-4 border-b border-gray-200 dark:border-gray-700">
                  <button (click)="sidebarView.set({type: 'list'})" class="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
                    Back
                  </button>
                </div>
                <div class="p-6 flex-1">
                  @if (sidebarState().loading) {
                    <div class="flex flex-col items-center justify-center h-full">
                      <div class="w-12 h-12 border-4 border-blue-500 border-solid rounded-full animate-spin border-t-transparent"></div>
                      <p class="mt-4 text-gray-600 dark:text-gray-400">{{ sidebarState().loadingMessage }}</p>
                    </div>
                  } @else if (sidebarState().error) {
                    <div class="p-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800" role="alert">
                      <span class="font-medium">Error:</span> {{ sidebarState().error }}
                    </div>
                  } @else {
                    @switch (sidebarView().type) {
                      @case ('character_profile') {
                        <div class="space-y-4">
                          @if(sidebarView().data.imageUrl) {
                              <img [src]="sidebarView().data.imageUrl" alt="Image of {{ sidebarView().data.profile.characterName }}" width="300" height="300" class="rounded-lg mx-auto shadow-md">
                          }
                          <div>
                            <h4 class="font-semibold text-lg">{{ sidebarView().data.profile.characterName }}</h4>
                            <p class="mt-1 text-gray-600 dark:text-gray-300">{{ sidebarView().data.profile.description }}</p>
                          </div>
                          <div>
                            <h4 class="font-semibold text-lg">Physical Appearance</h4>
                            <p class="mt-1 text-gray-600 dark:text-gray-300">{{ sidebarView().data.profile.physicalAppearance || 'Not described.' }}</p>
                          </div>
                          @if (sidebarView().data.profile.relationships?.length > 0) {
                            <div>
                              <h4 class="font-semibold text-lg">Relationships</h4>
                              <ul class="mt-1 list-disc list-inside space-y-1">
                                @for (rel of sidebarView().data.profile.relationships; track rel.characterName) {
                                  <li><strong>{{ rel.characterName }}:</strong> {{ rel.relationshipType }}</li>
                                }
                              </ul>
                            </div>
                          }
                        </div>
                      }
                      @case ('selection_summary') {
                        <div>
                          <h4 class="font-semibold text-lg mb-2">Summary</h4>
                          <p class="text-gray-600 dark:text-gray-300">{{ sidebarView().data }}</p>
                        </div>
                      }
                      @case ('scene_image') {
                        <div class="space-y-4">
                          <h4 class="font-semibold text-lg mb-2">Scene Visualization</h4>
                          <img [src]="sidebarView().data" alt="Generated scene image" class="rounded-lg shadow-md w-full">
                        </div>
                      }
                       @case ('definition') {
                        <div>
                            <h4 class="font-semibold text-lg mb-2">Definition</h4>
                            <p class="text-gray-600 dark:text-gray-300">{{ sidebarView().data }}</p>
                        </div>
                      }
                    }
                  }
                </div>
              </div>
            } @else {
              <!-- Tabbed List View -->
              <div class="flex-1 flex flex-col overflow-hidden">
                <nav class="flex border-b border-gray-200 dark:border-gray-700 shrink-0">
                  <button (click)="activeTab.set('chapters')" class="flex-1 p-3 text-sm font-medium text-center transition-colors" [class.border-b-2]="activeTab() === 'chapters'" [class.border-blue-500]="activeTab() === 'chapters'" [class.text-blue-600]="activeTab() === 'chapters'" [class.dark:text-blue-400]="activeTab() === 'chapters'" [class.text-gray-500]="activeTab() !== 'chapters'" [class.hover:bg-gray-100]="activeTab() !== 'chapters'" [class.dark:hover:bg-gray-700]="activeTab() !== 'chapters'">Chapters</button>
                  <button (click)="activeTab.set('characters')" class="flex-1 p-3 text-sm font-medium text-center transition-colors" [class.border-b-2]="activeTab() === 'characters'" [class.border-blue-500]="activeTab() === 'characters'" [class.text-blue-600]="activeTab() === 'characters'" [class.dark:text-blue-400]="activeTab() === 'characters'" [class.text-gray-500]="activeTab() !== 'characters'" [class.hover:bg-gray-100]="activeTab() !== 'characters'" [class.dark:hover:bg-gray-700]="activeTab() !== 'characters'">Characters</button>
                  <button (click)="activeTab.set('summaries')" class="flex-1 p-3 text-sm font-medium text-center transition-colors" [class.border-b-2]="activeTab() === 'summaries'" [class.border-blue-500]="activeTab() === 'summaries'" [class.text-blue-600]="activeTab() === 'summaries'" [class.dark:text-blue-400]="activeTab() === 'summaries'" [class.text-gray-500]="activeTab() !== 'summaries'" [class.hover:bg-gray-100]="activeTab() !== 'summaries'" [class.dark:hover:bg-gray-700]="activeTab() !== 'summaries'">Summaries</button>
                </nav>
                <div class="flex-1 overflow-y-auto p-2">
                  @switch (activeTab()) {
                    @case ('chapters') {
                      <ol class="space-y-1">
                        @for (chapter of progressService.book()?.chapters; track chapter.title; let i = $index) {
                          <li>
                            <button (click)="goToChapter(i)" class="w-full text-left p-2 rounded-md transition-colors" [class.bg-blue-100]="i === progressService.currentChapterIndex()" [class.dark:bg-blue-900]="i === progressService.currentChapterIndex()" [class.hover:bg-gray-100]="i !== progressService.currentChapterIndex()" [class.dark:hover:bg-gray-700]="i !== progressService.currentChapterIndex()">
                              <span class="font-semibold">Chapter {{ i + 1 }}</span>
                              <span class="block text-sm text-gray-600 dark:text-gray-400 truncate">{{ chapter.title }}</span>
                            </button>
                          </li>
                        }
                      </ol>
                    }
                    @case ('characters') {
                      <ul class="space-y-1">
                        @for (character of progressService.book()?.characters; track character) {
                          <li>
                            <button (click)="showCharacterProfile(character)" class="w-full text-left p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                              {{ character }}
                            </button>
                          </li>
                        }
                      </ul>
                    }
                    @case ('summaries') {
                      <div class="space-y-2">
                         @for (chapter of progressService.book()?.chapters; track chapter.title; let i = $index) {
                           <div class="rounded-md border border-gray-200 dark:border-gray-700">
                             <button (click)="toggleSummary(i)" class="w-full flex justify-between items-center p-3 text-left">
                                <span class="font-medium">Chapter {{ i + 1 }}: {{ chapter.title }}</span>
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transition-transform" [class.rotate-180]="expandedSummaryIndex() === i" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                             </button>
                             @if (expandedSummaryIndex() === i) {
                               <div class="p-4 border-t border-gray-200 dark:border-gray-700">
                                  @if (summaryStates()[i]?.loading) {
                                    <p class="text-sm text-gray-500">Generating summary...</p>
                                  } @else if (summaryStates()[i]?.error) {
                                    <p class="text-sm text-red-500">{{ summaryStates()[i]?.error }}</p>
                                  } @else if (summaryStates()[i]?.summary) {
                                    <p class="text-sm text-gray-600 dark:text-gray-300">{{ summaryStates()[i]?.summary }}</p>
                                  }
                               </div>
                             }
                           </div>
                         }
                      </div>
                    }
                  }
                </div>
              </div>
            }
          } @else {
            <!-- Collapsed View -->
            <div class="flex-1 flex flex-col items-center space-y-4 py-4">
              <button (click)="setActiveTab('chapters')" class="p-3 rounded-lg transition-colors" [class.bg-blue-100]="activeTab() === 'chapters'" [class.dark:bg-blue-900]="activeTab() === 'chapters'" [class.hover:bg-gray-100]="activeTab() !== 'chapters'" [class.dark:hover:bg-gray-700]="activeTab() !== 'chapters'" title="Chapters">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
              </button>
              <button (click)="setActiveTab('characters')" class="p-3 rounded-lg transition-colors" [class.bg-blue-100]="activeTab() === 'characters'" [class.dark:bg-blue-900]="activeTab() === 'characters'" [class.hover:bg-gray-100]="activeTab() !== 'characters'" [class.dark:hover:bg-gray-700]="activeTab() !== 'characters'" title="Characters">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
              </button>
              <button (click)="setActiveTab('summaries')" class="p-3 rounded-lg transition-colors" [class.bg-blue-100]="activeTab() === 'summaries'" [class.dark:bg-blue-900]="activeTab() === 'summaries'" [class.hover:bg-gray-100]="activeTab() !== 'summaries'" [class.dark:hover:bg-gray-700]="activeTab() !== 'summaries'" title="Summaries">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
              </button>
            </div>
          }
        </div>

        <!-- Sidebar Footer -->
        <div class="p-4 border-t border-gray-200 dark:border-gray-700 mt-auto shrink-0">
          <div class="space-y-2">
            <button (click)="isSettingsOpen.set(true)" title="Settings" class="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              @if (!isSidebarCollapsed()) {
                <span>Settings</span>
              }
            </button>
            <button (click)="toggleSidebar()" title="{{ isSidebarCollapsed() ? 'Expand' : 'Collapse' }}" class="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              @if (isSidebarCollapsed()) {
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
              } @else {
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
                <span>Collapse</span>
              }
            </button>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 flex flex-col overflow-hidden">
        <!-- Header -->
        <header class="flex items-center justify-center p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm z-10 shrink-0">
          <h3 class="text-2xl font-bold text-center truncate">{{ progressService.currentChapter()?.title }}</h3>
        </header>

        <!-- Chapter Content -->
        <div #contentArea class="flex-1 overflow-y-auto p-8 md:p-12 lg:p-16" 
             (mouseup)="handleTextSelection()"
             [style.font-size.px]="progressService.fontSize()"
             [style.font-family]="progressService.fontFamily()">
          @if (progressService.currentChapter(); as chapter) {
            <div [innerHTML]="highlightedContent()" class="prose dark:prose-invert max-w-none leading-relaxed"></div>
          } @else {
            <p>Select a chapter to begin reading.</p>
          }

          <!-- Selection Popover -->
          @if (selection().text) {
            <div class="fixed p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg flex space-x-2 z-50"
                 [style.left.px]="selection().x" [style.top.px]="selection().y">
              <button (click)="handleSelectionAction('selection_summary')" class="px-2 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700">Summarize</button>
              <button (click)="handleSelectionAction('scene_image')" class="px-2 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700">Visualize</button>
              <button (click)="handleSelectionAction('definition')" class="px-2 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700">Define</button>
            </div>
          }
        </div>

        <!-- Navigation -->
        <footer class="flex justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
          <button (click)="progressService.previousChapter()" [disabled]="progressService.currentChapterIndex() === 0" class="px-4 py-2 rounded-md bg-blue-600 text-white disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors">Previous</button>
          <span>Page {{ progressService.currentChapterIndex() + 1 }} of {{ progressService.totalChapters() }}</span>
          <button (click)="progressService.nextChapter()" [disabled]="progressService.currentChapterIndex() === progressService.totalChapters() - 1" class="px-4 py-2 rounded-md bg-blue-600 text-white disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors">Next</button>
        </footer>
      </main>
      
      <!-- Settings Modal -->
      @if (isSettingsOpen()) {
        <div class="fixed inset-0 bg-black bg-opacity-60 z-40 flex items-center justify-center" (click)="isSettingsOpen.set(false)">
           <div class="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg m-4" (click)="$event.stopPropagation()">
            <!-- Modal Header -->
            <div class="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 class="text-xl font-semibold">Settings</h3>
              <button (click)="isSettingsOpen.set(false)" class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" aria-label="Close settings">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
             <!-- Modal Body -->
            <div class="p-6">
               <div class="space-y-8">
                <div>
                  <h4 class="font-semibold text-lg mb-3">Theme</h4>
                  <label class="flex items-center justify-between cursor-pointer">
                    <span class="text-gray-700 dark:text-gray-300">Dark Mode</span>
                    <div class="relative">
                      <input type="checkbox" class="sr-only" 
                             [checked]="progressService.theme() === 'dark'" 
                             (change)="progressService.setTheme(progressService.theme() === 'dark' ? 'light' : 'dark')">
                      <div class="w-10 h-4 bg-gray-300 rounded-full shadow-inner dark:bg-gray-600"></div>
                      <div class="absolute w-6 h-6 -mt-1 transition-transform duration-200 ease-in-out transform bg-white border-2 rounded-full shadow -left-1 top-1/2" 
                           [class.translate-x-full]="progressService.theme() === 'dark'"
                           [class.border-blue-500]="progressService.theme() === 'dark'"
                           [class.border-gray-300]="progressService.theme() === 'light'"></div>
                    </div>
                  </label>
                </div>
                
                <div>
                    <h4 class="font-semibold text-lg mb-3">Font Size ({{ progressService.fontSize() }}px)</h4>
                      <div class="flex items-center space-x-4">
                        <button (click)="progressService.decreaseFontSize()" [disabled]="progressService.fontSize() <= 12" class="p-2 rounded-full border disabled:opacity-50 disabled:cursor-not-allowed">-</button>
                        <input type="range" min="12" max="32" step="1" [value]="progressService.fontSize()" (input)="onFontSizeChange($event)" class="w-full">
                        <button (click)="progressService.increaseFontSize()" [disabled]="progressService.fontSize() >= 32" class="p-2 rounded-full border disabled:opacity-50 disabled:cursor-not-allowed">+</button>
                    </div>
                </div>
                
                <div>
                  <h4 class="font-semibold text-lg mb-3">Font Style</h4>
                  <select [value]="progressService.fontFamily()" (change)="onFontFamilyChange($event)" class="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500">
                    @for (group of fontStyles; track group.group) {
                      <optgroup [label]="group.group">
                        @for (font of group.fonts; track font.name) {
                          <option [value]="font.css" [style.font-family]="font.css">{{ font.name }}</option>
                        }
                      </optgroup>
                    }
                  </select>
                  @if (selectedFontDescription()) {
                    <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">{{ selectedFontDescription() }}</p>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .prose a {
      cursor: pointer;
      text-decoration: underline;
      color: #3b82f6; /* Tailwind's blue-500 */
    }
    .dark .prose a {
      color: #60a5fa; /* Tailwind's blue-400 */
    }
    .animate-spin {
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EbookReaderComponent implements AfterViewInit, OnDestroy {
  progressService = inject(ProgressService);
  private geminiService = inject(GeminiService);

  @ViewChild('contentArea') contentArea!: ElementRef<HTMLDivElement>;

  // UI State
  isSettingsOpen = signal(false);
  isSidebarCollapsed = signal(false);
  isSaving = signal(false);
  activeTab = signal<'chapters' | 'characters' | 'summaries'>('chapters');
  sidebarView = signal<SidebarView>({ type: 'list' });
  sidebarState = signal({ loading: false, error: null as string | null, loadingMessage: '' });
  selection = signal({ text: '', x: 0, y: 0 });
  expandedSummaryIndex = signal<number | null>(null);
  summaryStates = signal<{[index: number]: {loading: boolean, summary?: string, error?: string}}>({});

  fontStyles = [
    {
      group: 'Serif (for long reading)',
      fonts: [
        { name: 'Literata', css: 'Literata', description: "Google Play Books’ typeface – calm, bookish, beautifully tuned for paragraphs." },
        { name: 'Crimson Pro', css: 'Crimson Pro', description: "Classic 'Garamond-ish' vibe, elegant at body sizes." },
        { name: 'Spectral', css: 'Spectral', description: "Contemporary book serif with strong italics; great on screens." },
        { name: 'Lora', css: 'Lora', description: "Warm, sturdy, handles small sizes well." },
        { name: 'Merriweather', css: 'Merriweather', description: "A bit larger x-height; very readable on low-contrast screens." },
        { name: 'EB Garamond', css: 'EB Garamond', description: "Historical flavor; gorgeous at 18–22px." },
        { name: 'Charis SIL', css: 'Charis SIL', description: "Book workhorse, wide language support." },
        { name: 'Noto Serif', css: 'Noto Serif', description: "Massive language coverage; sensible defaults." },
      ]
    },
    {
      group: 'Sans-Serif (for UI & notes)',
      fonts: [
        { name: 'Inter', css: 'Inter', description: "The web’s friendly UI champ; excellent hinting and symbols." },
        { name: 'Source Sans 3', css: 'Source Sans 3', description: "Humanist, neutral, pairs with Source Serif." },
        { name: 'IBM Plex Sans', css: 'IBM Plex Sans', description: "Crisp, techy, still very legible." },
        { name: 'Public Sans', css: 'Public Sans', description: "U.S. Web Design System’s sans; dependable and quiet." },
        { name: 'PT Sans', css: 'PT Sans', description: "Compact, readable; pairs with PT Serif." },
        { name: 'Atkinson Hyperlegible', css: 'Atkinson Hyperlegible', description: "Designed for clarity; great accessibility option." },
        { name: 'Lexend', css: 'Lexend', description: "Research-driven to reduce visual crowding; many widths/grades." },
        { name: 'Noto Sans', css: 'Noto Sans', description: "Pan-script coverage; safe default." },
      ]
    }
  ];
  
  selectedFontDescription = computed(() => {
    const currentFontFamily = this.progressService.fontFamily();
    return this.fontStyles.flatMap(g => g.fonts).find(f => f.css === currentFontFamily)?.description ?? '';
  });

  private contentClickListener: ((event: MouseEvent) => void) | null = null;
  
  highlightedContent = computed(() => {
    const chapter = this.progressService.currentChapter();
    if (!chapter) return '';

    const characters = this.progressService.book()?.characters || [];
    if (characters.length === 0) return chapter.content.replace(/\n/g, '<br>');

    const regex = new RegExp(`\\b(${characters.join('|')})\\b`, 'gi');
    return chapter.content
      .replace(/\n/g, '<br>')
      .replace(regex, (match) => `<a data-character="${match}" class="font-bold hover:text-blue-400">${match}</a>`);
  });

  ngAfterViewInit(): void {
    this.contentClickListener = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'A' && target.hasAttribute('data-character')) {
        event.preventDefault();
        const characterName = target.getAttribute('data-character');
        if (characterName) {
          this.showCharacterProfile(characterName);
        }
      }
    };
    this.contentArea.nativeElement.addEventListener('click', this.contentClickListener);
  }

  ngOnDestroy(): void {
      if (this.contentClickListener && this.contentArea) {
          this.contentArea.nativeElement.removeEventListener('click', this.contentClickListener);
      }
  }

  async goBackToLibrary() {
    this.isSaving.set(true);
    try {
      await this.progressService.reset();
    } catch(e) {
      console.error("Failed to save progress on exit:", e);
      // Even if saving fails, we should probably still let the user navigate.
      // The progress will be saved in localStorage for the next session.
    } finally {
      this.isSaving.set(false);
    }
  }

  toggleSidebar() {
    this.isSidebarCollapsed.update(collapsed => !collapsed);
  }

  setActiveTab(tab: 'chapters' | 'characters' | 'summaries') {
    this.activeTab.set(tab);
    if (this.sidebarView().type !== 'list') {
      this.sidebarView.set({ type: 'list' });
    }
  }

  goToChapter(index: number) {
    this.progressService.goToChapter(index);
    this.sidebarView.set({ type: 'list' });
    this.selection.set({ text: '', x: 0, y: 0 });
    if (this.contentArea) {
      this.contentArea.nativeElement.scrollTop = 0;
    }
  }

  onFontSizeChange(event: Event) {
    const size = Number((event.target as HTMLInputElement).value);
    this.progressService.setFontSize(size);
  }
  
  onFontFamilyChange(event: Event) {
    const fontFamily = (event.target as HTMLSelectElement).value;
    this.progressService.setFontFamily(fontFamily);
  }

  async showCharacterProfile(characterName: string) {
    if (this.isSidebarCollapsed()) {
      this.isSidebarCollapsed.set(false);
      // Give sidebar time to expand before showing profile
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    this.sidebarView.set({ type: 'character_profile' });
    this.sidebarState.set({ loading: true, error: null, loadingMessage: `Generating profile for ${characterName}...` });
    
    const cached = this.progressService.aiCache().characters[characterName];
    if (cached) {
      this.sidebarView.update(s => ({...s, data: cached}));
      this.sidebarState.set({ loading: false, error: null, loadingMessage: '' });
      return;
    }

    try {
      const book = this.progressService.book();
      if (!book) throw new Error('Book not loaded.');

      const profile = await this.geminiService.getCharacterProfile(characterName, book);
      this.sidebarState.update(s => ({...s, loadingMessage: 'Generating character image...'}));
      
      const imageUrl = await this.geminiService.generateCharacterImage(characterName, profile.physicalAppearance, book.title);
      const imageBase64 = `data:image/jpeg;base64,${imageUrl}`;
      
      const data = { profile: { ...profile, characterName }, imageUrl: imageBase64 };
      this.progressService.updateCharacterCache(characterName, profile, imageBase64);
      this.sidebarView.update(s => ({...s, data}));
      this.sidebarState.set({ loading: false, error: null, loadingMessage: '' });

    } catch (error) {
      this.sidebarState.set({ loading: false, error: error instanceof Error ? error.message : 'Unknown error', loadingMessage: '' });
    }
  }
  
  handleTextSelection() {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 10) { 
      const text = selection.toString().trim();
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      this.selection.set({
        text,
        x: rect.left + window.scrollX + (rect.width / 2) - 60,
        y: rect.top + window.scrollY - 50,
      });
    } else if (this.selection().text) {
      setTimeout(() => this.selection.set({ text: '', x: 0, y: 0 }), 100);
    }
  }
  
  async handleSelectionAction(action: 'selection_summary' | 'scene_image' | 'definition') {
    const selectedText = this.selection().text;
    const bookTitle = this.progressService.book()?.title || 'this book';
    this.selection.set({ text: '', x: 0, y: 0 }); // Hide popover

    if (this.isSidebarCollapsed()) {
      this.isSidebarCollapsed.set(false);
      // Give sidebar time to expand before showing action result
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    this.sidebarView.set({ type: action });
    this.sidebarState.set({ loading: true, error: null, loadingMessage: 'Processing selection...' });

    try {
        let resultData: any;
        if (action === 'selection_summary') {
            this.sidebarState.update(s => ({...s, loadingMessage: 'Summarizing selection...'}));
            resultData = await this.geminiService.summarizeSelection(selectedText, bookTitle);
        } else if (action === 'scene_image') {
            this.sidebarState.update(s => ({...s, loadingMessage: 'Generating scene image...'}));
            const imageUrl = await this.geminiService.generateSceneImage(selectedText, bookTitle);
            resultData = `data:image/jpeg;base64,${imageUrl}`;
        } else if (action === 'definition') {
            const words = selectedText.split(/\s+/);
            const wordToDefine = words.length === 1 ? words[0] : selectedText;
            this.sidebarState.update(s => ({...s, loadingMessage: `Defining "${wordToDefine}"...`}));
            resultData = await this.geminiService.getDefinition(wordToDefine);
        }
        this.sidebarView.update(s => ({...s, data: resultData}));
        this.sidebarState.set({ loading: false, error: null, loadingMessage: ''});
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred.';
        this.sidebarState.set({ loading: false, error: errorMsg, loadingMessage: '' });
    }
  }

  async toggleSummary(index: number) {
    if (this.expandedSummaryIndex() === index) {
      this.expandedSummaryIndex.set(null);
      return;
    }

    this.expandedSummaryIndex.set(index);
    const cached = this.progressService.aiCache().summaries[index];
    
    if (cached) {
      this.summaryStates.update(s => ({ ...s, [index]: { loading: false, summary: cached } }));
      return;
    }

    this.summaryStates.update(s => ({ ...s, [index]: { loading: true } }));
    
    try {
      const book = this.progressService.book();
      const chapter = book?.chapters[index];
      if (!book || !chapter) throw new Error('Chapter not found');
      
      const summary = await this.geminiService.getChapterSummary(chapter.title, chapter.content, book.title);
      this.progressService.updateSummaryCache(index, summary);
      this.summaryStates.update(s => ({ ...s, [index]: { loading: false, summary } }));
    } catch (error) {
       const errorMsg = error instanceof Error ? error.message : 'Failed to get summary.';
       this.summaryStates.update(s => ({ ...s, [index]: { loading: false, error: errorMsg } }));
    }
  }
}