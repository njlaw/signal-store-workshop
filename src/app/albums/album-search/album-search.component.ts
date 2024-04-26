import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ProgressBarComponent } from '@/shared/ui/progress-bar.component';
import { AlbumFilterComponent } from './album-filter/album-filter.component';
import { AlbumListComponent } from './album-list/album-list.component';
import { AlbumSearchStore } from '@/albums/album-search/album-search.store';

@Component({
  selector: 'ngrx-album-search',
  standalone: true,
  imports: [ProgressBarComponent, AlbumFilterComponent, AlbumListComponent],
  template: `
    <ngrx-progress-bar [showProgress]="store.showProgress()" />

    <div class="container">
      <h1>Albums ({{ store.totalAlbums() }})</h1>
      <button (click)="refresh()">Reload</button>

      <ngrx-album-filter
        [query]="store.query()"
        [order]="store.order()"
        (queryChange)="store.updateQuery($event)"
        (orderChange)="store.updateOrder($event)"
      />

      <ngrx-album-list [albums]="store.filteredAlbums()" [showSpinner]="store.showSpinner()" />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    AlbumSearchStore,
  ]
})
export default class AlbumSearchComponent {
  protected readonly store = inject(AlbumSearchStore);

  protected refresh() {
    this.store.loadAllAlbums();
  }
}
