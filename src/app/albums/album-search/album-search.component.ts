import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { ProgressBarComponent } from '@/shared/ui/progress-bar.component';
import { SortOrder } from '@/shared/models/sort-order.model';
import { Album, searchAlbums, sortAlbums } from '@/albums/album.model';
import { AlbumFilterComponent } from './album-filter/album-filter.component';
import { AlbumListComponent } from './album-list/album-list.component';
import { patchState, signalState } from '@ngrx/signals';
import { AlbumsService } from '@/albums/albums.service';
import { catchError, EMPTY } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

interface AlbumsState {
  albums: Album[],
  showProgress: boolean;
  query: string;
  order: SortOrder;
}
const albumsState = signalState<AlbumsState>({
  albums: [],
  showProgress: false,
  query: '',
  order: 'asc',
});

@Component({
  selector: 'ngrx-album-search',
  standalone: true,
  imports: [ProgressBarComponent, AlbumFilterComponent, AlbumListComponent],
  template: `
    <ngrx-progress-bar [showProgress]="showProgress()" />

    <div class="container">
      <h1>Albums ({{ totalAlbums() }})</h1>

      <ngrx-album-filter
        [query]="query()"
        [order]="order()"
        (queryChange)="updateQuery($event)"
        (orderChange)="updateOrder($event)"
      />

      <ngrx-album-list [albums]="filteredAlbums()" [showSpinner]="showSpinner()" />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AlbumSearchComponent {
  readonly albums = albumsState.albums;
  readonly query = albumsState.query;
  readonly order = albumsState.order;
  readonly filteredAlbums = computed(() => {
    return sortAlbums(searchAlbums(albumsState.albums(), albumsState.query()), albumsState.order());
  });
  readonly showProgress = albumsState.showProgress;
  readonly totalAlbums = computed(() => this.filteredAlbums().length);
  readonly showSpinner = computed(() => {
    return this.showProgress() && albumsState.albums().length === 0;
  })

  constructor(
    private readonly albumsService: AlbumsService,
    private readonly snackBar: MatSnackBar,
  ) {
    patchState(albumsState, { showProgress: true });
    this.albumsService.getAll().pipe(
      catchError(() => {
        snackBar.open('Error fetching albums', 'Error', { duration: 3000 });
        patchState(albumsState, { showProgress: false });
        return EMPTY;
      }),
    ).subscribe((albums: Album[]) => {
        patchState(
          albumsState,
          { albums },
          { showProgress: false },
        )
      });
  }

  updateQuery(query: string): void {
    patchState(albumsState, { query });
  }

  updateOrder(order: SortOrder): void {
    patchState(albumsState, { order });
  }
}
