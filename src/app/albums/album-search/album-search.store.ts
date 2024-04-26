import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import { Album, searchAlbums, sortAlbums } from '@/albums/album.model';
import { SortOrder } from '@/shared/models/sort-order.model';
import { computed, inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { exhaustMap, pipe, tap } from 'rxjs';
import { AlbumsService } from '@/albums/albums.service';
import { tapResponse } from '@ngrx/operators';
import {
  setError,
  setFulfilled,
  setPending,
  withRequestStatusWithErrorNotification,
} from '@/shared/state/request-status';

interface AlbumsState {
  albums: Album[],
  query: string;
  order: SortOrder;
}

export const AlbumSearchStore = signalStore(
  { providedIn: 'root' },
  withState<AlbumsState>({
    albums: [],
    query: '',
    order: 'asc',
  }),
  withRequestStatusWithErrorNotification(),
  withComputed((store) => {
    const filteredAlbums = computed(() =>
      sortAlbums(searchAlbums(store.albums(), store.query()), store.order()));
    return {
      filteredAlbums,
      totalAlbums: computed(() => filteredAlbums().length),
      showSpinner: computed(() => store.isPending() && store.albums().length === 0),
    };
  }),
  withMethods((store, albumsService = inject(AlbumsService)) => ({
    updateQuery: (query: string) => patchState(store, { query }),
    updateOrder: (order: SortOrder) => patchState(store, { order }),
    loadAllAlbums: rxMethod<void>(pipe(
      tap(() => patchState(store, setPending())),
      exhaustMap(() => albumsService.getAll().pipe(
        tapResponse(
          (albums) => {
            patchState(store, { albums }, setFulfilled());
          },
          () => patchState(store, setError('Failed to fetch albums')),
        ),
      )),
    )),
  })),
  withHooks((store) => ({
    onInit() {
      store.loadAllAlbums();
    }
  }))
);
