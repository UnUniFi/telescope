import { Component, OnInit, Input } from '@angular/core';
import { cosmosclient } from '@cosmos-client/core';
import { CosmosTxV1beta1GetTxResponse } from '@cosmos-client/core/esm/openapi';

@Component({
  selector: 'view-tx',
  templateUrl: './tx.component.html',
  styleUrls: ['./tx.component.css'],
})
export class TxComponent implements OnInit {
  @Input()
  tx?: CosmosTxV1beta1GetTxResponse | null;

  @Input()
  txType?: string[] | null;

  constructor() { }

  ngOnInit(): void { }
}
