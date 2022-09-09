import { txTitle } from './../../../../../models/cosmos/tx-common.model';
import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'view-msg-withdraw-deledator-reward',
  templateUrl: './msg-withdraw-deledator-reward.component.html',
  styleUrls: ['./msg-withdraw-deledator-reward.component.css'],
})
export class MsgWithdrawDeledatorRewardComponent implements OnInit {
  @Input() txDetail?: txTitle | null;

  constructor() {}

  ngOnInit(): void {}
}
