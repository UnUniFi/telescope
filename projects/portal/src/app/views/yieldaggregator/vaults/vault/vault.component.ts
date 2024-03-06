import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import cosmosclient from '@cosmos-client/core';
import { getDenomExponent } from 'projects/portal/src/app/models/cosmos/bank.model';
import {
  DepositToVaultRequest,
  VaultInfo,
  WithdrawFromVaultRequest,
  WithdrawFromVaultWithUnbondingRequest,
} from 'projects/portal/src/app/models/yield-aggregators/yield-aggregator.model';
import { DenomOnChain } from 'projects/portal/src/app/pages/yieldaggregator/vaults/vault/vault.component';
import { CoinAmountPipe } from 'projects/portal/src/app/pipes/coin-amount.pipe';
import {
  DenomInfos200ResponseInfoInner,
  EstimateMintAmount200Response,
  EstimateRedeemAmount200Response,
  StrategyAll200ResponseStrategiesInnerStrategy,
  Vault200Response,
} from 'ununifi-client/esm/openapi';

export type ExternalChain = {
  id: string;
  display: string;
  disabled: boolean;
  external: boolean;
  cosmos: boolean;
};

export type WithdrawOption = {
  id: number;
  name: string;
  description: string;
  icon?: string;
  disabled: boolean;
};

@Component({
  selector: 'view-vault',
  templateUrl: './vault.component.html',
  styleUrls: ['./vault.component.css'],
})
export class VaultComponent implements OnInit, OnChanges {
  @Input()
  vault?: Vault200Response | null;
  @Input()
  denom?: string | null;
  @Input()
  availableDenoms?: DenomOnChain[] | null;
  @Input()
  symbolImage?: string | null;
  @Input()
  denomBalancesMap?: { [denom: string]: cosmosclient.proto.cosmos.base.v1beta1.ICoin } | null;
  @Input()
  denomMetadataMap?: { [denom: string]: cosmosclient.proto.cosmos.bank.v1beta1.IMetadata } | null;
  @Input()
  totalDepositAmount?: number | null;
  @Input()
  totalBondedAmount?: number | null;
  @Input()
  totalUnbondingAmount?: number | null;
  @Input()
  withdrawReserve?: number | null;
  @Input()
  estimatedMintAmount?: EstimateMintAmount200Response | null;
  @Input()
  estimatedRedeemAmount?: EstimateRedeemAmount200Response | null;
  @Input()
  estimatedDepositedAmount?: EstimateRedeemAmount200Response | null;
  @Input()
  vaultBalance?: cosmosclient.proto.cosmos.base.v1beta1.ICoin | null;
  @Input()
  usdDepositAmount?: number | null;
  @Input()
  vaultInfo?: VaultInfo | null;
  @Input()
  externalWalletAddress?: string;

  @Output()
  changeDeposit: EventEmitter<number>;
  @Output()
  appDeposit: EventEmitter<DepositToVaultRequest>;
  @Output()
  changeWithdraw: EventEmitter<number>;
  @Output()
  appWithdraw: EventEmitter<WithdrawFromVaultRequest>;
  @Output()
  appWithdrawWithUnbonding: EventEmitter<WithdrawFromVaultWithUnbondingRequest>;
  @Output()
  appClickChain: EventEmitter<ExternalChain>;

  mintAmount?: number;
  burnAmount?: number;
  tab: 'mint' | 'burn' = 'mint';
  withdrawOptions: WithdrawOption[] = [
    {
      id: 0,
      name: 'Unbonding',
      description: 'Withdrawal will be received after unbonding time ',
      icon: 'pending_actions',
      disabled: true,
    },
    {
      id: 1,
      name: 'Immediate',
      description: 'Withdrawal will be received instantly',
      icon: 'bolt',
      disabled: true,
    },
  ];
  selectedWithdrawOption?: WithdrawOption;
  selectedDenom?: DenomOnChain;

  constructor(private coinAmountPipe: CoinAmountPipe) {
    this.changeDeposit = new EventEmitter();
    this.appDeposit = new EventEmitter();
    this.changeWithdraw = new EventEmitter();
    this.appWithdraw = new EventEmitter();
    this.appWithdrawWithUnbonding = new EventEmitter();
    this.appClickChain = new EventEmitter();
    this.selectedWithdrawOption = this.withdrawOptions[1];
  }

  ngOnInit(): void {}

  ngOnChanges(): void {
    if (!this.selectedDenom && this.availableDenoms) {
      this.selectedDenom = this.availableDenoms[0];
    }
  }

  onClickChain(denom: DenomOnChain) {
    this.selectedDenom = denom;
    if (denom.chain === 'ethereum') {
      this.appClickChain.emit();
    }
    (global as any).token_select_modal.close();
  }

  onClickWithdrawOption(option: WithdrawOption) {
    this.selectedWithdrawOption = option;
  }

  onDepositAmountChange() {
    this.changeDeposit.emit(this.mintAmount);
  }

  onSubmitDeposit() {
    alert('Sorry, UnUniFi Yield Aggregator is currently suspending deposits.');
    return;
    // if (!this.mintAmount) {
    //   alert('Please input amount');
    //   return;
    // }
    // if (!this.denom) {
    //   alert('Please select denom');
    //   return;
    // }
    // this.appDeposit.emit({
    //   vaultId: this.vault?.vault?.id!,
    //   readableAmount: this.mintAmount,
    //   denom: this.denom,
    // });
  }

  onWithdrawAmountChange() {
    this.changeWithdraw.emit(this.burnAmount);
  }

  onSubmitWithdraw() {
    if (!this.burnAmount) {
      alert('Please input amount');
      return;
    }
    if (this.selectedWithdrawOption?.id === 0) {
      this.appWithdrawWithUnbonding.emit({
        vaultId: this.vault?.vault?.id!,
        readableAmount: this.burnAmount,
        lp_denom: 'yieldaggregator/vaults/' + this.vault?.vault?.id,
      });
    }
    if (this.selectedWithdrawOption?.id === 1) {
      this.appWithdraw.emit({
        vaultId: this.vault?.vault?.id!,
        readableAmount: this.burnAmount,
        lp_denom: 'yieldaggregator/vaults/' + this.vault?.vault?.id,
        redeemAmount: Number(this.estimatedRedeemAmount?.redeem_amount),
        feeAmount: Number(this.estimatedRedeemAmount?.fee),
        symbol: this.vault?.vault?.symbol!,
      });
    }
  }

  getStrategyInfo(id?: string): StrategyAll200ResponseStrategiesInnerStrategy | undefined {
    return this.vault?.strategies?.find((strategy) => strategy.id === id);
  }

  setMintAmount(rate: number) {
    this.mintAmount =
      Number(
        this.coinAmountPipe.transform(this.denomBalancesMap?.[this.denom || ''].amount, this.denom),
      ) * rate;
    const exponent = getDenomExponent(this.denom || '');
    this.mintAmount = Math.floor(this.mintAmount * Math.pow(10, exponent)) / Math.pow(10, exponent);
    this.onDepositAmountChange();
  }

  setBurnAmount(rate: number) {
    const denom = 'yieldaggregator/vaults/' + this.vault?.vault?.id;
    this.burnAmount =
      Number(this.coinAmountPipe.transform(this.denomBalancesMap?.[denom].amount, denom)) * rate;
    const exponent = getDenomExponent(denom);
    this.burnAmount = Math.floor(this.burnAmount * Math.pow(10, exponent)) / Math.pow(10, exponent);
    this.onWithdrawAmountChange();
  }

  calcVaultAmount(vault?: Vault200Response | null): string {
    if (!vault) {
      return '0';
    }
    return (
      Number(vault.total_bonded_amount) +
      Number(vault.total_unbonding_amount) +
      Number(vault.withdraw_reserve)
    ).toString();
  }

  detectIBCDenom(denom?: string): boolean {
    if (!denom) {
      return false;
    }
    return denom.startsWith('ibc/');
  }
}
