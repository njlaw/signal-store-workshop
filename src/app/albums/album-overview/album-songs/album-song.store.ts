import { patchState, signalStore, withHooks, withMethods } from '@ngrx/signals';
import { setAllEntities, withEntities } from '@ngrx/signals/entities';
import {
  setError,
  setFulfilled,
  setPending,
  withRequestStatusWithErrorNotification,
} from '@/shared/state/request-status';
import { Song } from '@/songs/song.model';
import { withRouteParams } from '@/shared/state/route/route-params.feature';
import { SongsService } from '@/songs/songs.service';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { filter, pipe, switchMap, tap } from 'rxjs';
import { inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';

export const AlbumSongsStore = signalStore(
  withEntities<Song>(),
  withRequestStatusWithErrorNotification(),
  withRouteParams({
    albumId: albumId => Number(albumId),
  }),
  withMethods((store, songsService = inject(SongsService)) => ({
    loadSongsByAlbumId: rxMethod<number>(pipe(
      filter(albumId => albumId != null),
      tap(() => patchState(store, setPending())),
      switchMap((albumId) => songsService.getByAlbumId(albumId).pipe(
        tapResponse({
          next: (songs) => patchState(store, setAllEntities(songs), setFulfilled()),
          error: () => patchState(store, setError('Error fetching songs')),
        })
      ))
    ))
  })),
  withHooks(({ albumId, loadSongsByAlbumId }) => ({
    onInit() {
      loadSongsByAlbumId(albumId);
    }
  })),
);
