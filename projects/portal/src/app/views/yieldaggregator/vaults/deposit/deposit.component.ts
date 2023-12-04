import { Component, Input, OnInit } from '@angular/core';
import { VaultBalance } from 'projects/portal/src/app/pages/yieldaggregator/vaults/deposit/deposit.component';
import {
  EstimateRedeemAmount200Response,
  StrategyAll200ResponseStrategiesInner,
  VaultAll200ResponseVaultsInner,
} from 'ununifi-client/esm/openapi';

@Component({
  selector: 'view-deposit',
  templateUrl: './deposit.component.html',
  styleUrls: ['./deposit.component.css'],
})
export class DepositComponent implements OnInit {
  @Input() address?: string | null;
  @Input() owner?: string | null;
  @Input() vaultBalances?: VaultBalance[] | null;
  @Input() vaults?: VaultAll200ResponseVaultsInner[] | null;
  @Input() symbols?: { symbol: string; display: string; img: string }[] | null;
  @Input() estimatedRedeemAmounts?: EstimateRedeemAmount200Response[] | null;
  @Input() usdDepositAmount?: number[] | null;
  @Input() usdTotalAmount?: number | null;
  @Input()
  strategies?:
    | {
        strategy: StrategyAll200ResponseStrategiesInner;
        amount?: string;
      }[]
    | null;

  constructor() {}

  ngOnInit(): void {}
}
