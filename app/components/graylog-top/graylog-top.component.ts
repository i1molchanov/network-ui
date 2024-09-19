import {Component, OnInit} from '@angular/core';
import {GardaApiService, WhoisResult} from '../../services/garda-api.service';
import {NgForOf, NgIf} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {InputTextModule} from "primeng/inputtext";
import {Button} from "primeng/button";
import {TableModule} from "primeng/table";
import {ToolbarModule} from "primeng/toolbar";
import {MessageService} from "primeng/api";
import {DropdownModule} from "primeng/dropdown";
import {InputSwitchModule} from "primeng/inputswitch";
import {CalendarModule} from "primeng/calendar";
import {InputGroupModule} from "primeng/inputgroup";
import {PanelModule} from "primeng/panel";
import {CardModule} from "primeng/card";
import {SharedStateService} from '../../services/shared-state.service';
import {SelectButtonModule} from "primeng/selectbutton";

interface LimitOption {
  label: string;
  value: number;
}

@Component({
  selector: 'app-graylog-top',
  standalone: true,
  templateUrl: './graylog-top.component.html',
  imports: [
    NgForOf,
    FormsModule,
    InputTextModule,
    Button,
    TableModule,
    ToolbarModule,
    DropdownModule,
    NgIf,
    InputSwitchModule,
    CalendarModule,
    InputGroupModule,
    PanelModule,
    CardModule,
    SelectButtonModule
  ],
  styleUrls: ['./graylog-top.component.css'],
})
export class GraylogTopComponent implements OnInit {
  graylogTop: { ip: string, count: number }[] = [];
  queryString: string = '';
  isRelative: boolean = true;
  timerangeType: string = 'relative';
  relativeRange: number = 300;
  absoluteFrom: Date | null = null;  // Изменяем тип на Date
  absoluteTo: Date | null = null;
  isLoadingSearch: boolean = false;
  isLoadingWhois: boolean = false;
  whoisResult: WhoisResult | null | undefined;
  limitOptions: LimitOption[] = [
    {label: '5', value: 5},
    {label: '10', value: 10},
    {label: '15', value: 15},
    {label: '20', value: 20}
  ];
  selectedLimit: number = 10;
  timerangeOptions: any[] = [
    {label: 'Relative', value: 'relative'},
    {label: 'Absolute', value: 'absolute'}
  ];

  constructor(private GardaApiService: GardaApiService, private messageService: MessageService, private sharedStateService: SharedStateService) {
  }

  ngOnInit(): void {
  }

  formatDate(date: Date): string {
    return date.toISOString().slice(0, 19);  // Обрезаем до формата yyyy-MM-ddTHH:mm:ss
  }

  onTimeRangeChange(): void {
    this.timerangeType = this.isRelative ? 'relative' : 'absolute';
  }

  getGraylogTop(): void {
    let timerangeValue;
    if (this.timerangeType === 'relative') {
      timerangeValue = this.relativeRange;
    } else {
      if (this.absoluteFrom && this.absoluteTo) {
        timerangeValue = {
          from: this.formatDate(this.absoluteFrom),
          to: this.formatDate(this.absoluteTo)
        };
      } else {
      this.messageService.add({severity: "warning", summary: "Ошибка", detail: "Выберите даты для отправки запроса"})
        return;
      }
    }
    this.isLoadingSearch = true;
    this.GardaApiService.getGraylogTop(this.queryString, this.timerangeType, timerangeValue, this.selectedLimit)
      .subscribe({
        next: (response) => {
          this.graylogTop = response;
          this.isLoadingSearch = false;
        }
      });
  }

  getWhoisData(ip: string): void {
    this.isLoadingWhois = true;
    this.GardaApiService.getWhoisInfo(ip).subscribe({
      next: (result) => {
        this.whoisResult = result;
        this.isLoadingWhois = false
      },
      error: () => {
        this.isLoadingWhois = false
      }
    });
  }

  addIPToBlacklist(ip: string): void {
    const formattedIP = {ip, comment: 'Добавлено из WHOIS'}; // Комментарий по умолчанию
    this.GardaApiService.addIPsToList('blacklist', [formattedIP]).subscribe({
      next: () => {
        this.messageService.add({severity: 'success', summary: 'Успех', detail: `IP ${ip} добавлен в blacklist`});
        this.sharedStateService.triggerRefreshNetworkList();
      }
    });
  }

  addSubnetsToBlacklist(subnets: string): void {
    const subnetArray = subnets.split(', ');
    const formattedSubnets = subnetArray.map(subnet => ({
      ip: subnet, comment: 'Добавлено из WHOIS'
    }));

    this.GardaApiService.addIPsToList('blacklist', formattedSubnets).subscribe({
      next: () => {
        this.messageService.add({severity: 'success', summary: 'Успех', detail: 'Подсети добавлены в blacklist'});
        this.sharedStateService.triggerRefreshNetworkList();
      }
    });
  }
}
