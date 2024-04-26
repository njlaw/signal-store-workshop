import { signalStoreFeature, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { filter, pipe, tap } from 'rxjs';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { MatSnackBar } from '@angular/material/snack-bar';

export type RequestStatus = 'idle' | 'pending' | 'fulfilled' | { errorMessage: string };

export type RequestStatusState = { requestStatus: RequestStatus };

export function withRequestStatus() {
  return signalStoreFeature(
    withState<RequestStatusState>({
      requestStatus: 'idle',
    }),
    withComputed(({  requestStatus }) => ({
      isPending: computed(() => requestStatus() === 'pending'),
      isFulfilled: computed(() => requestStatus() === 'fulfilled'),
      error: computed(() => {
        const status = requestStatus();
        return typeof status === 'object' ? status.errorMessage : null;
      }),
    })),
  );
}

export function setPending(): RequestStatusState {
  return { requestStatus: 'pending' };
}

export function setFulfilled(): RequestStatusState {
  return { requestStatus: 'fulfilled' };
}

export function setError(errorMessage: string): RequestStatusState {
  return { requestStatus: { errorMessage } };
}

export function withNotifyOnError() {
  return signalStoreFeature(
    withMethods((store, snackBar = inject(MatSnackBar)) => ({
      notifyOnError: rxMethod<string | null>(pipe(
        filter((error): error is string => typeof error === 'string'),
        tap((error) => snackBar.open(error, 'Close', { duration: 3000 })),
      )),
    })),
  );
}

export function withRequestStatusWithErrorNotification() {
  return signalStoreFeature(
    withRequestStatus(),
    withNotifyOnError(),
    withHooks(({ notifyOnError, error}) => ({
      onInit() {
        notifyOnError(error);
      }
    })),
  )
}
