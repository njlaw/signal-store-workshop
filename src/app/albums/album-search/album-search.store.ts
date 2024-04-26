import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import { Album, searchAlbums, sortAlbums } from '@/albums/album.model';
import { SortOrder } from '@/shared/models/sort-order.model';
import { computed, inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { exhaustMap, pipe, tap } from 'rxjs';
import { AlbumsService } from '@/albums/albums.service';
import { tapResponse } from '@ngrx/operators';
import { MatSnackBar } from '@angular/material/snack-bar';

interface AlbumsState {
  albums: Album[],
  showProgress: boolean;
  query: string;
  order: SortOrder;
}

export const AlbumSearchStore = signalStore(
  withState<AlbumsState>({
    albums: [],
    showProgress: false,
    query: '',
    order: 'asc',
  }),
  withComputed((store) => {
    const filteredAlbums = computed(() =>
      sortAlbums(searchAlbums(store.albums(), store.query()), store.order()));
    return {
      filteredAlbums,
      totalAlbums: computed(() => filteredAlbums().length),
      showSpinner: computed(() => store.showProgress() && store.albums().length === 0),
    };
  }),
  withMethods((store, albumsService = inject(AlbumsService), snackBar = inject(MatSnackBar)) => ({
    updateQuery: (query: string) => patchState(store, { query }),
    updateOrder: (order: SortOrder) => patchState(store, { order }),
    loadAllAlbums: rxMethod<void>(pipe(
      tap(() => patchState(store, { showProgress: true })),
      exhaustMap(() => albumsService.getAll().pipe(
        tapResponse(
          (albums) => patchState(store, { albums }, { showProgress: false}),
          () => {
            snackBar.open('Error fetching albums', 'Error', { duration: 3000 });
            patchState(store, { showProgress: false });
          },
        )
      ))
    )),
  })),
  withHooks((store) => ({
    onInit() {
      store.loadAllAlbums();
    }
  }))
);
