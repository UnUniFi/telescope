import { DialogRef } from '@angular/cdk/dialog';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import cosmosclient from '@cosmos-client/core';
import { StoredWallet } from 'projects/portal/src/app/models/wallets/wallet.model';
import { CdpAll200ResponseCdpInnerCdpCollateral } from 'ununifi-client/esm/openapi';

export type WithdrawAllRewardsOnSubmitEvent = {
  minimumGasPrice: cosmosclient.proto.cosmos.base.v1beta1.ICoin;
  gasRatio: number;
};

@Component({
  selector: 'view-withdraw-incentive-all-rewards-form-dialog',
  templateUrl: './withdraw-incentive-all-rewards-form-dialog.component.html',
  styleUrls: ['./withdraw-incentive-all-rewards-form-dialog.component.css'],
})
export class WithdrawIncentiveAllRewardsFormDialogComponent implements OnInit {
  @Input()
  address?: string;
  @Input()
  currentStoredWallet?: StoredWallet | null;
  @Input()
  coins?: cosmosclient.proto.cosmos.base.v1beta1.ICoin[] | null;
  @Input()
  uguuBalance?: string | null;
  @Input()
  minimumGasPrices?: cosmosclient.proto.cosmos.base.v1beta1.ICoin[] | null;
  @Input()
  rewards?: CdpAll200ResponseCdpInnerCdpCollateral[] | null;

  @Output()
  appSubmit: EventEmitter<WithdrawAllRewardsOnSubmitEvent>;

  selectedGasPrice?: cosmosclient.proto.cosmos.base.v1beta1.ICoin;
  availableDenoms?: string[];
  gasRatio: number;

  constructor(public dialogRef: DialogRef) {
    this.appSubmit = new EventEmitter();
    this.availableDenoms = ['uguu'];

    this.gasRatio = 0;
  }

  ngOnChanges(): void {
    if (this.minimumGasPrices && this.minimumGasPrices.length > 0) {
      this.selectedGasPrice = this.minimumGasPrices[0];
    }
  }

  ngOnInit(): void {}

  changeGasRatio(ratio: number) {
    this.gasRatio = ratio;
  }

  onSubmit() {
    if (!this.currentStoredWallet || !this.selectedGasPrice) {
      return;
    }
    this.appSubmit.emit({
      minimumGasPrice: this.selectedGasPrice,
      gasRatio: this.gasRatio,
    });
  }

  onMinimumGasDenomChanged(denom: string): void {
    this.selectedGasPrice = this.minimumGasPrices?.find(
      (minimumGasPrice) => minimumGasPrice.denom === denom,
    );
  }

  onMinimumGasAmountSliderChanged(amount: string): void {
    if (this.selectedGasPrice) {
      this.selectedGasPrice.amount = amount;
    }
  }

  onClickClose() {
    this.dialogRef.close();
  }
}
