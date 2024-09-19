import {Component, Input, OnInit} from '@angular/core';
import {MessageService} from 'primeng/api';
import {GardaApiService} from '../../services/garda-api.service';
import ipRegex from 'ip-regex';
import {debounceTime, distinctUntilChanged, Subject} from 'rxjs';
import {PanelModule} from "primeng/panel";
import {DialogModule} from "primeng/dialog";
import {FormsModule} from "@angular/forms";
import {NgIf} from "@angular/common";
import {InputTextModule} from "primeng/inputtext";
import {Button, ButtonDirective} from "primeng/button";
import {TableModule} from "primeng/table";
import {SharedStateService} from '../../services/shared-state.service';

interface IPRecord {
  ip: string;
  comment: string;
}

@Component({
  selector: 'app-network-list',
  templateUrl: './network-list.component.html',
  styleUrl: './network-list.component.css',
  imports: [
    PanelModule,
    DialogModule,
    FormsModule,
    NgIf,
    InputTextModule,
    Button,
    TableModule,
    ButtonDirective
  ],
  standalone: true
})
export class NetworkListComponent implements OnInit {
  @Input() listType: string = '';
  networkList: IPRecord[] = [];
  filteredNetworkList: IPRecord[] = [];
  selectedIPs: IPRecord[] = [];
  ipInput: string = '';
  newComment: string = '';
  displayModal: boolean = false;
  searchTerm: string = '';
  searchResult: IPRecord | null = null;
  isFormValid: boolean = true;
  invalidLines: string[] = [];
  filterInput: string = '';
  filterSubject: Subject<string> = new Subject<string>();


  constructor(private networkListService: GardaApiService,
              private messageService: MessageService,
              private sharedStateService: SharedStateService) {
  }

  ngOnInit() {
    this.loadNetworkList();

    this.sharedStateService.dbUpdate$.subscribe((update: any) => {
      this.handleDbUpdate(update);
    });

    this.filterSubject.pipe(
      debounceTime(200),
      distinctUntilChanged()
    ).subscribe(value => {
      this.applyFilter(value);
    });

    this.sharedStateService.refreshNetworkList$.subscribe(() => {
      this.loadNetworkList();
    });
  }

  handleDbUpdate(update: any) {
    this.messageService.add({
      severity: 'info',
      summary: 'Обновление базы данных',
      detail: update,
    });
  }

  applyFilter(value: string) {
    if (value) {
      this.filteredNetworkList = this.networkList.filter(item =>
        item.ip.toLowerCase().startsWith(value.toLowerCase())
      );
    } else {
      this.filteredNetworkList = [...this.networkList];
    }
  }

  onFilterChange(value: string) {
    this.filterSubject.next(value);
  }

  openAddModal() {
    this.displayModal = true;
  }

  closeAddModal() {
    this.displayModal = false;
  }

  loadNetworkList() {
    this.networkListService.getNetworkList(this.listType).subscribe({
      next: (response) => {
        this.networkList = response.ips.reverse();
        this.filteredNetworkList = this.networkList;

      },
      error: () => {
        this.messageService.add({severity: 'error', summary: 'Ошибка', detail: 'Не удалось получить список'});
      }
    });
  }

  validateIPs() {

    const ipLines = this.ipInput.split('\n').map(line => line.trim());
    const validIPs: string[] = [];
    this.invalidLines = [];

    ipLines.forEach(ip => {
      if (ipRegex({exact: true}).test(ip) || (ip.includes('/') && ipRegex({exact: true}).test(ip.split('/')[0]))) {
        validIPs.push(ip);
      } else {
        this.invalidLines.push(ip);
      }
    });

    this.isFormValid = this.invalidLines.length === 0;
    return validIPs;
  }

  addIPs() {
    const validIPs = this.validateIPs();

    if (!this.isFormValid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: 'Некорректные IP-адреса: ' + this.invalidLines.join(', ')
      });
      return;
    }

    const formattedIPs = validIPs.map(ip => ({
      ip,
      comment: this.newComment
    }));

    this.networkListService.addIPsToList(this.listType, formattedIPs).subscribe({
      next: () => {
        this.loadNetworkList();
        this.ipInput = '';
        this.newComment = '';
        this.displayModal = false;
        this.messageService.add({severity: 'success', summary: 'Успех', detail: 'IP-адреса добавлены'});
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Ошибка',
          detail: error.message || 'Не удалось добавить IP-адреса'
        });
      }
    });
  }

  deleteIPs() {
    const ipsToDelete = this.selectedIPs.map(ip => ip.ip);
    this.networkListService.deleteIPsFromList(this.listType, ipsToDelete).subscribe({
      next: () => {
        this.loadNetworkList();
        this.selectedIPs = [];
        this.messageService.add({severity: 'success', summary: 'Успех', detail: 'IP удалены'});
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Ошибка',
          detail: error.message || 'Не удалось удалить IP-адреса'
        });
      }
    });
  }

  searchIP() {
    const [ip, mask] = this.searchTerm.includes('/') ? this.searchTerm.split('/') : [this.searchTerm, undefined];
    const maskNumber = mask ? parseInt(mask, 10) : undefined;

    this.networkListService.searchIP(this.listType, ip.trim(), maskNumber).subscribe({
      next: (response) => {
        if (response.details) {
          this.searchResult = response.details;
          this.messageService.add({severity: 'success', summary: 'Успех', detail: `${response.details.ip} найден`});
        } else {
          this.searchResult = null;
          this.messageService.add({severity: 'info', summary: 'Информация', detail: `${response.message} `});
        }
      },
    });
  }

  downloadConfig() {
    this.networkListService.downloadConfig(this.listType).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.listType}.conf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.messageService.add({
          severity: 'success',
          summary: 'Успех',
          detail: 'Конфигурация успешно скачана'
        });
      },
    });
  }

  reverseNetworkList() {
    this.networkList = this.networkList.reverse();
  }
}
