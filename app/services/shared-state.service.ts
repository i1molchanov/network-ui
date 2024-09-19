import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedStateService {
  private dbUpdateSubject = new Subject<any>();
  public dbUpdate$ = this.dbUpdateSubject.asObservable();
  private refreshNetworkListSource = new Subject<void>();
  refreshNetworkList$ = this.refreshNetworkListSource.asObservable();

  constructor() {}

  triggerRefreshNetworkList() {
    this.refreshNetworkListSource.next();
  }

  sendDbUpdate(update: any) {
    this.dbUpdateSubject.next(update);
  }
}
