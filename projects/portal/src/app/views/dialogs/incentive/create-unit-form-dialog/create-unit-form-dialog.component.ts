import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import cosmosclient from '@cosmos-client/core';
import { StoredWallet, WalletType } from 'projects/portal/src/app/models/wallets/wallet.model';

export type CreateIncentiveUnitOnSubmitEvent = {
  walletType: WalletType;
  unitID: string;
  subjectAddresses: string[];
  weights: string[];
  minimumGasPrice: cosmosclient.proto.cosmos.base.v1beta1.ICoin;
  gasRatio: number;
};
export type IncentiveDist = {
  address: string;
  distRate: number;
};

@Component({
  selector: 'view-create-unit-form-dialog',
  templateUrl: './create-unit-form-dialog.component.html',
  styleUrls: ['./create-unit-form-dialog.component.css'],
})
export class CreateUnitFormDialogComponent implements OnInit {
  @Input()
  currentStoredWallet?: StoredWallet | null;
  @Input()
  coins?: cosmosclient.proto.cosmos.base.v1beta1.ICoin[] | null;
  @Input()
  uguuBalance?: string | null;
  @Input()
  minimumGasPrices?: cosmosclient.proto.cosmos.base.v1beta1.ICoin[] | null;

  @Output()
  appSubmit: EventEmitter<CreateIncentiveUnitOnSubmitEvent>;

  selectedGasPrice?: cosmosclient.proto.cosmos.base.v1beta1.ICoin;
  availableDenoms?: string[];
  unitId?: string;
  firstRecipient?: IncentiveDist;
  recipients: IncentiveDist[];
  gasRatio: number;

  constructor() {
    this.firstRecipient = { address: '', distRate: 0 };
    this.recipients = [];
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

  onClickAddRecipient() {
    this.recipients.push({ address: '', distRate: 0 });
  }

  onClickDeleteRecipient(index: number) {
    this.recipients.splice(index, 1);
  }

  onSubmit() {
    if (
      !this.unitId ||
      !this.firstRecipient ||
      !this.recipients ||
      !this.currentStoredWallet ||
      !this.selectedGasPrice
    ) {
      return;
    }
    const sumDist =
      Math.floor(this.firstRecipient.distRate * 10) / 10 +
      this.recipients.reduce((prev, curr) => prev + curr.distRate / 10, 0);
    if (sumDist != 100) {
      alert('Please make the total of the percentages 100%');
      return;
    }
    const subjectAddresses = [this.firstRecipient.address].concat(
      this.recipients.map((rec) => rec.address),
    );
    const weights = [this.firstRecipient.distRate]
      .concat(this.recipients.map((rec) => rec.distRate))
      .map((weight) => (weight * 10 ** 16).toString());
    this.appSubmit.emit({
      walletType: this.currentStoredWallet?.type,
      unitID: this.unitId,
      subjectAddresses,
      weights,
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
}
