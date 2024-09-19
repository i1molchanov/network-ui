import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {catchError, Observable, throwError} from 'rxjs';
import {MessageService} from "primeng/api";

interface IPRecord {
  ip: string;
  comment: string;
}

interface TopRecord {
  ip: string;
  count: number;
}

export interface WhoisResult {
  ip: string;
  asn: string;
  country: string;
  network: string;
  asn_description: string;
}

@Injectable({
  providedIn: 'root'
})

export class GardaApiService {
  private apiUrl = 'http://127.0.0.1:8000';

  constructor(private http: HttpClient, private messageService: MessageService) {
  }

  getNetworkList(listType: string): Observable<{ ips: IPRecord[] }> {
    return this.http.get<{ ips: IPRecord[] }>(`${this.apiUrl}/get_ips/${listType}`).pipe(
      catchError(this.handleError.bind(this))
    );
    ;
  }

  searchIP(listType: string, ip: string, mask?: number): Observable<{ message: string, details: IPRecord }> {
    const body = {ip, mask};
    return this.http.post<{ message: string, details: IPRecord }>(
      `${this.apiUrl}/search_ip/${listType}`,
      body
    ).pipe(catchError(this.handleError.bind(this)));
  }

  addIPsToList(listType: string, ipsArray: IPRecord[]): Observable<any> {
    const payload = {ips_or_subnets: ipsArray.map(ipRecord => ipRecord.ip), comment: ipsArray[0].comment};
    return this.http.post(`${this.apiUrl}/add_ips/${listType}`, payload).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  deleteIPsFromList(listType: string, ipsToDelete: string[]): Observable<any> {
    const payload = {ips_or_subnets: ipsToDelete};
    return this.http.request('delete', `${this.apiUrl}/delete_ips/${listType}`, {body: payload}).pipe(
      catchError(this.handleError.bind(this))
    );
    ;
  }

  getGraylogTop(queryString: string, timerangeType: string, timerangeValue: any, limit: number): Observable<TopRecord[]> {
    // Начинаем формировать строку URL
    let url = `${this.apiUrl}/get_graylog_top/?query_string=${queryString}&timerange_type=${timerangeType}&limit=${limit}`;

    // В зависимости от типа таймрейнджа добавляем соответствующие параметры
    if (timerangeType === 'relative') {
      url += `&range=${timerangeValue}`;  // Для относительного времени добавляем количество секунд
    } else if (timerangeType === 'absolute') {
      url += `&from_time=${timerangeValue.from}&to_time=${timerangeValue.to}`;  // Для абсолютного времени добавляем from и to
    }

    return this.http.get<TopRecord[]>(url).pipe(
      catchError(this.handleError.bind(this))
    );
    ;
  }

  getWhoisInfo(ip: string): Observable<WhoisResult> {
    return this.http.get<WhoisResult>(`${this.apiUrl}/whois/${ip}`).pipe(
      catchError(this.handleError.bind(this))
    );
    ;
  }

  downloadConfig(listType: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/download_config/${listType}`, {
      responseType: 'blob' // Важно, чтобы файл возвращался в виде Blob
    }).pipe(
      catchError(this.handleError.bind(this))
    );
    ;
  }

  private handleError(error: any): Observable<never> {
    const errorMessage = error.error?.message || 'Произошла ошибка';
    this.messageService.add({severity: 'error', summary: 'Ошибка', detail: errorMessage});
    return throwError(() => new Error(errorMessage));
  }
}
