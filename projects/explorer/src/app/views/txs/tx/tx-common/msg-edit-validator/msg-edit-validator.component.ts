import { txTitle } from './../../../../../models/cosmos/tx-common.model';
import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'view-msg-edit-validator',
  templateUrl: './msg-edit-validator.component.html',
  styleUrls: ['./msg-edit-validator.component.css'],
})
export class MsgEditValidatorComponent implements OnInit {
  @Input() txDetail?: txTitle | null;

  constructor() {}

  ngOnInit(): void {}
}
