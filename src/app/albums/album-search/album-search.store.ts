import { patchState, signalStore, withComputed, withHooks, withMethods } from '@ngrx/signals';
import { Album, searchAlbums, sortAlbums } from '@/albums/album.model';
import { toSortOrder } from '@/shared/models/sort-order.model';
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
import { setEntities, withEntities } from '@ngrx/signals/entities';
import { withQueryParams } from '@/shared/state/route/query-params.feature';

export const AlbumSearchStore = signalStore(
  { providedIn: 'root' },
  withEntities<Album>(),
  withRequestStatusWithErrorNotification(),
  withQueryParams({
    query: query => query ?? '',
    order: toSortOrder
  }),
  withComputed((store) => {
    const filteredAlbums = computed(() =>
      sortAlbums(searchAlbums(store.entities(), store.query()), store.order()));
    return {
      filteredAlbums,
      totalAlbums: computed(() => filteredAlbums().length),
      showSpinner: computed(() => store.isPending() && store.entities().length === 0),
    };
  }),
  withMethods((store, albumsService = inject(AlbumsService)) => ({
    loadAllAlbums: rxMethod<void>(pipe(
      tap(() => patchState(store, setPending())),
      exhaustMap(() => albumsService.getAll().pipe(
        tapResponse(
          (albums) => {
            patchState(store, setEntities(albums), setFulfilled());
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
