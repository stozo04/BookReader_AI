import { Component, ChangeDetectionStrategy, output } from '@angular/core';

@Component({
  selector: 'app-home',
  template: `
    <div class="min-h-screen bg-gray-900 text-white font-sans">
      <!-- Header -->
      <header class="p-6 flex flex-col sm:flex-row justify-between items-center bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-800">
        <h1 class="text-3xl font-bold text-center sm:text-left mb-4 sm:mb-0">AI E-Book Interactor</h1>
        <button (click)="loadBookClicked.emit()" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-lg hover:shadow-blue-500/50">
          Upload Your Book
        </button>
      </header>

      <!-- Main Content -->
      <main class="px-6 md:px-10 pb-12">
        <!-- Categories loop -->
        @for(category of bookCategories; track category.title) {
          <section class="mb-12">
            <h2 class="text-2xl font-semibold mb-4 text-gray-200">{{ category.title }}</h2>
            <!-- Carousel -->
            <div class="flex space-x-4 overflow-x-auto pb-4 book-carousel">
              <!-- Books loop -->
              @for(book of category.books; track book.title) {
                <div class="flex-shrink-0 w-48 group cursor-pointer" title="{{ book.title }} by {{ book.author }}">
                  <img [src]="book.coverUrl" [alt]="'Cover of ' + book.title" class="w-full h-72 object-cover rounded-lg shadow-lg transform group-hover:scale-105 transition-transform duration-300" width="192" height="288" />
                  <h3 class="mt-3 font-semibold text-gray-100 truncate">{{ book.title }}</h3>
                  <p class="text-sm text-gray-400 truncate">{{ book.author }}</p>
                </div>
              }
            </div>
          </section>
        }
      </main>
    </div>
  `,
  styles: `
    .book-carousel::-webkit-scrollbar {
      height: 8px;
    }
    .book-carousel::-webkit-scrollbar-track {
      background-color: #1f2937; /* gray-800 */
      border-radius: 10px;
    }
    .book-carousel::-webkit-scrollbar-thumb {
      background-color: #4b5563; /* gray-600 */
      border-radius: 10px;
      border: 2px solid #1f2937; /* gray-800 */
    }
    .book-carousel::-webkit-scrollbar-thumb:hover {
      background-color: #6b7280; /* gray-500 */
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  loadBookClicked = output<void>();

  bookCategories = [
    {
      title: 'Featured Classics',
      books: [
        { title: 'Moby Dick', author: 'Herman Melville', coverUrl: 'https://picsum.photos/seed/moby-dick/300/450' },
        { title: 'Pride and Prejudice', author: 'Jane Austen', coverUrl: 'https://picsum.photos/seed/pride-prejudice/300/450' },
        { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', coverUrl: 'https://picsum.photos/seed/gatsby/300/450' },
        { title: 'To Kill a Mockingbird', author: 'Harper Lee', coverUrl: 'https://picsum.photos/seed/mockingbird/300/450' },
        { title: '1984', author: 'George Orwell', coverUrl: 'https://picsum.photos/seed/1984/300/450' },
        { title: 'The Catcher in the Rye', author: 'J.D. Salinger', coverUrl: 'https://picsum.photos/seed/catcher-rye/300/450' },
        { title: 'Wuthering Heights', author: 'Emily Brontë', coverUrl: 'https://picsum.photos/seed/wuthering/300/450' },
      ]
    },
    {
      title: 'Fantasy Adventures',
      books: [
        { title: 'The Hobbit', author: 'J.R.R. Tolkien', coverUrl: 'https://picsum.photos/seed/hobbit/300/450' },
        { title: 'A Game of Thrones', author: 'George R.R. Martin', coverUrl: 'https://picsum.photos/seed/got/300/450' },
        { title: 'The Name of the Wind', author: 'Patrick Rothfuss', coverUrl: 'https://picsum.photos/seed/name-wind/300/450' },
        { title: 'Mistborn: The Final Empire', author: 'Brandon Sanderson', coverUrl: 'https://picsum.photos/seed/mistborn/300/450' },
        { title: 'The Chronicles of Narnia', author: 'C.S. Lewis', coverUrl: 'https://picsum.photos/seed/narnia/300/450' },
        { title: 'The Eye of the World', author: 'Robert Jordan', coverUrl: 'https://picsum.photos/seed/eye-world/300/450' },
      ]
    },
    {
      title: 'Science Fiction Worlds',
      books: [
        { title: 'Dune', author: 'Frank Herbert', coverUrl: 'https://picsum.photos/seed/dune/300/450' },
        { title: "Ender's Game", author: 'Orson Scott Card', coverUrl: 'https://picsum.photos/seed/enders-game/300/450' },
        { title: 'Foundation', author: 'Isaac Asimov', coverUrl: 'https://picsum.photos/seed/foundation/300/450' },
        { title: 'Hyperion', author: 'Dan Simmons', coverUrl: 'https://picsum.photos/seed/hyperion/300/450' },
        { title: 'Brave New World', author: 'Aldous Huxley', coverUrl: 'https://picsum.photos/seed/brave-new/300/450' },
        { title: 'Neuromancer', author: 'William Gibson', coverUrl: 'https://picsum.photos/seed/neuromancer/300/450' },
      ]
    }
  ];
}
