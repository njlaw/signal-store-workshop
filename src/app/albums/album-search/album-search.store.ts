import { signalStore, withComputed } from '@ngrx/signals';
import { searchAlbums, sortAlbums } from '@/albums/album.model';
import { toSortOrder } from '@/shared/models/sort-order.model';
import { computed, inject } from '@angular/core';
import { withQueryParams } from '@/shared/state/route/query-params.feature';
import { AlbumsStore } from '@/albums/albums.store';

export const AlbumSearchStore = signalStore(
  { providedIn: 'root' },
  withQueryParams({
    query: query => query ?? '',
    order: toSortOrder
  }),
  withComputed((store, albumStore = inject(AlbumsStore)) => {
    const filteredAlbums = computed(() =>
      sortAlbums(searchAlbums(albumStore.entities(), store.query()), store.order()));
    return {
      filteredAlbums,
      totalAlbums: computed(() => filteredAlbums().length),
      showSpinner: computed(() => albumStore.isPending() && albumStore.entities().length === 0),
    };
  }),
);
