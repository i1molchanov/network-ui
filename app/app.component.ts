import {Component, OnInit} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {TabViewModule} from "primeng/tabview";
import {NetworkListComponent} from './components/network-list/network-list.component';
import {GraylogTopComponent} from './components/graylog-top/graylog-top.component';
import {Ripple} from "primeng/ripple";
import {ToastModule} from "primeng/toast";
import {MessageService} from 'primeng/api';
import {WebsocketService} from './services/websocket.service';
import { SharedStateService } from './services/shared-state.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TabViewModule, NetworkListComponent, Ripple, GraylogTopComponent, ToastModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',

})
export class AppComponent implements OnInit {
  title = 'ui';
  wsMessage: string | null = null;
  public tasks: any[] = [];
  public dbUpdates: any[] = [];

  constructor(private websocketService: WebsocketService, private messageService: MessageService,
              private sharedStateService: SharedStateService) {
  }

  ngOnInit() {
    this.websocketService.getMessages().subscribe((message) => {
      if (message.type === 'task') {
        this.updateTaskStatus(message.data);
      } else if (message.type === 'db_update') {
        this.updateDb(message.data.update);
        this.sharedStateService.sendDbUpdate(message.data.update);
      }
    });
  }

  updateTaskStatus(task: any) {
    const index = this.tasks.findIndex((t) => t.task_id === task.task_id);
    if (index !== -1) {
      this.tasks[index] = task;
    } else {
      this.tasks.push(task);
    }
  }

  updateDb(update: string) {
    this.dbUpdates.push(update);
  }
}
