import { txTitle } from './../../../../../models/cosmos/tx-common.model';
import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'view-msg-undelegate',
  templateUrl: './msg-undelegate.component.html',
  styleUrls: ['./msg-undelegate.component.css'],
})
export class MsgUndelegateComponent implements OnInit {
  @Input() txDetail?: txTitle | null;

  constructor() {}

  ngOnInit(): void {}
}
