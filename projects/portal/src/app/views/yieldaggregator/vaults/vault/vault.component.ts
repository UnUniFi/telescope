import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { cosmos } from '@cosmos-client/core/esm/proto';
import { TokenAmountUSD } from 'projects/portal/src/app/models/band-protocols/band-protocol.service';
import { YieldInfo } from 'projects/portal/src/app/models/config.service';
import {
  DepositToVaultRequest,
  WithdrawFromVaultRequest,
} from 'projects/portal/src/app/models/yield-aggregators/yield-aggregator.model';
import {
  EstimateMintAmount200Response,
  EstimateRedeemAmount200Response,
  StrategyAll200ResponseStrategiesInnerStrategy,
  Vault200Response,
} from 'ununifi-client/esm/openapi';

@Component({
  selector: 'view-vault',
  templateUrl: './vault.component.html',
  styleUrls: ['./vault.component.css'],
})
export class VaultComponent implements OnInit, OnChanges {
  @Input()
  vault?: Vault200Response | null;
  @Input()
  symbol?: string | null;
  @Input()
  displaySymbol?: string | null;
  @Input()
  symbolImage?: string | null;
  @Input()
  symbolBalancesMap?: { [symbol: string]: number } | null;
  @Input()
  symbolMetadataMap?: { [symbol: string]: cosmos.bank.v1beta1.IMetadata } | null;
  @Input()
  totalDepositAmount?: TokenAmountUSD | null;
  @Input()
  totalBondedAmount?: TokenAmountUSD | null;
  @Input()
  totalUnbondingAmount?: TokenAmountUSD | null;
  @Input()
  withdrawReserve?: TokenAmountUSD | null;
  @Input()
  estimatedMintAmount?: EstimateMintAmount200Response | null;
  @Input()
  estimatedRedeemAmount?: EstimateRedeemAmount200Response | null;
  @Input()
  vaultInfo?: YieldInfo | null;

  @Output()
  changeDeposit: EventEmitter<number>;
  @Output()
  appDeposit: EventEmitter<DepositToVaultRequest>;
  @Output()
  changeWithdraw: EventEmitter<number>;
  @Output()
  appWithdraw: EventEmitter<WithdrawFromVaultRequest>;
  @Output()
  appClickChain: EventEmitter<string>;

  mintAmount?: number;
  burnAmount?: number;
  tab: 'mint' | 'burn' = 'mint';

  chains = [
    {
      id: 'ununifi',
      display: 'UnUniFi',
      disabled: false,
    },
    {
      id: 'ethereum',
      display: 'Ethereum',
      disabled: true,
    },
    {
      id: 'avalanche',
      display: 'Avalanche',
      disabled: true,
    },
    {
      id: 'polygon',
      display: 'Polygon',
      disabled: true,
    },
    {
      id: 'arbitrum',
      display: 'Arbitrum',
      disabled: true,
    },
    {
      id: 'cosmoshub',
      display: 'Cosmos Hub',
      disabled: true,
    },
    {
      id: 'neutron',
      display: 'Neutron',
      disabled: true,
    },
    {
      id: 'osmosis',
      display: 'Osmosis',
      disabled: false,
    },
    {
      id: 'sei',
      display: 'Sei',
      disabled: true,
    },
  ];

  constructor() {
    this.changeDeposit = new EventEmitter();
    this.appDeposit = new EventEmitter();
    this.changeWithdraw = new EventEmitter();
    this.appWithdraw = new EventEmitter();
    this.appClickChain = new EventEmitter();
  }

  ngOnInit(): void {}

  ngOnChanges(): void {}

  onClickChain(id: string) {
    this.appClickChain.emit(id);
    (global as any).chain_select_modal.close();
  }

  onDepositAmountChange() {
    this.changeDeposit.emit(this.mintAmount);
  }

  onSubmitDeposit() {
    if (!this.mintAmount) {
      return;
    }
    this.appDeposit.emit({
      vaultId: this.vault?.vault?.id!,
      amount: this.mintAmount,
      symbol: this.symbol!,
    });
  }

  onWithdrawAmountChange() {
    this.changeWithdraw.emit(this.burnAmount);
  }

  onSubmitWithdraw() {
    if (!this.burnAmount) {
      return;
    }
    this.appWithdraw.emit({
      vaultId: this.vault?.vault?.id!,
      amount: this.burnAmount,
      symbol: this.symbol!,
    });
  }

  getStrategyInfo(id?: string): StrategyAll200ResponseStrategiesInnerStrategy | undefined {
    return this.vault?.strategies?.find((strategy) => strategy.id === id);
  }

  setMintAmount(rate: number) {
    this.mintAmount = (this.symbolBalancesMap?.[this.symbol || ''] || 0) * rate;
    this.onDepositAmountChange();
  }

  setBurnAmount(rate: number) {
    this.burnAmount = (this.symbolBalancesMap?.['YA-VAULT-' + this.vault?.vault?.id] || 0) * rate;
    this.onWithdrawAmountChange();
  }
}
