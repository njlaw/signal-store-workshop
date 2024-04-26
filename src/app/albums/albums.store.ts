import { patchState, signalStore, withHooks, withMethods } from '@ngrx/signals';
import { setEntities, withEntities } from '@ngrx/signals/entities';
import { Album } from '@/albums/album.model';
import {
  setError,
  setFulfilled,
  setPending,
  withRequestStatusWithErrorNotification,
} from '@/shared/state/request-status';
import { inject } from '@angular/core';
import { AlbumsService } from '@/albums/albums.service';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { exhaustMap, pipe, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';

export const AlbumsStore = signalStore(
  { providedIn: 'root' },
  withEntities<Album>(),
  withRequestStatusWithErrorNotification(),
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
