import { BankApplicationService } from '../../../../models/cosmos/bank.application.service';
import { SendOnSubmitEvent } from '../../../../views/cosmos/bank/send/send.component';
import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import cosmosclient from '@cosmos-client/core';
import { ConfigService } from 'projects/portal/src/app/models/config.service';
import { CosmosRestService } from 'projects/portal/src/app/models/cosmos-rest.service';
import { StoredWallet } from 'projects/portal/src/app/models/wallets/wallet.model';
import { WalletService } from 'projects/portal/src/app/models/wallets/wallet.service';
import { Observable } from 'rxjs';
import { filter, map, mergeMap } from 'rxjs/operators';

@Component({
  selector: 'app-send',
  templateUrl: './send.component.html',
  styleUrls: ['./send.component.css'],
})
export class SendComponent implements OnInit {
  currentStoredWallet$: Observable<StoredWallet | null | undefined>;
  coins$: Observable<cosmosclient.proto.cosmos.base.v1beta1.ICoin[] | undefined>;
  amount$: Observable<cosmosclient.proto.cosmos.base.v1beta1.ICoin[] | undefined>;
  minimumGasPrices$: Observable<cosmosclient.proto.cosmos.base.v1beta1.ICoin[] | undefined>;

  constructor(
    private readonly walletService: WalletService,
    private readonly bankApplication: BankApplicationService,
    private readonly snackBar: MatSnackBar,
    private readonly configS: ConfigService,
    private readonly cosmosRest: CosmosRestService,
  ) {
    this.currentStoredWallet$ = this.walletService.currentStoredWallet$;

    const address$ = this.currentStoredWallet$.pipe(
      filter((wallet): wallet is StoredWallet => wallet !== undefined && wallet !== null),
      map((wallet) => cosmosclient.AccAddress.fromString(wallet.address)),
    );

    this.coins$ = address$.pipe(mergeMap((address) => this.cosmosRest.allBalances$(address)));

    this.amount$ = this.coins$.pipe(
      map((amount) =>
        amount?.map((coin) => ({
          denom: coin.denom,
          amount: '0',
        })),
      ),
    );

    this.minimumGasPrices$ = this.configS.config$.pipe(map((config) => config?.minimumGasPrices));
  }

  ngOnInit(): void {}

  async onSubmit($event: SendOnSubmitEvent) {
    if ($event.amount.length === 0) {
      this.snackBar.open('Invalid coins', undefined, {
        duration: 6000,
      });
      return;
    }
    await this.bankApplication.send(
      $event.toAddress,
      $event.amount,
      $event.minimumGasPrice,
      $event.coins,
      1.1,
    );
  }
}
