import { txTitle, txSignature } from './../../../../../models/cosmos/tx-common.model';
import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'view-msg-send',
  templateUrl: './msg-send.component.html',
  styleUrls: ['./msg-send.component.css'],
})
export class MsgSendComponent implements OnInit {
  @Input() txDetail?: txTitle | null;
  @Input() txSignature?: txSignature | null;
  constructor() {}

  ngOnInit(): void {}
}
