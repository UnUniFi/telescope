import { CosmosRestService } from '../../models/cosmos-rest.service';
import { BankQueryService } from '../../models/cosmos/bank.query.service';
import { BankService } from '../../models/cosmos/bank.service';
import { DistributionApplicationService } from '../../models/cosmos/distribution.application.service';
import { StoredWallet, WalletType } from '../../models/wallets/wallet.model';
import { WalletService } from '../../models/wallets/wallet.service';
import { throughMap } from '../../utils/pipes';
import { BalanceUsecaseService } from './balance.usecase.service';
import { Component, OnInit } from '@angular/core';
import cosmosclient from '@cosmos-client/core';
import { GetNodeInfo200Response } from '@cosmos-client/core/esm/openapi';
import { Observable, combineLatest } from 'rxjs';
import { filter, map, mergeMap } from 'rxjs/operators';

@Component({
  selector: 'app-balance',
  templateUrl: './balance.component.html',
  styleUrls: ['./balance.component.css'],
})
export class BalanceComponent implements OnInit {
  walletId$: Observable<string | null | undefined>;
  walletType$: Observable<WalletType | null | undefined>;
  accAddress$: Observable<string | null | undefined>;
  accountTypeName$: Observable<string | null | undefined>;
  publicKey$: Observable<string | null | undefined>;
  valAddress$: Observable<string | null | undefined>;
  symbolDisplayMap$: Observable<{ [symbol: string]: string }>;
  symbolImageMap: { [symbol: string]: string };
  denomBalancesMap$: Observable<{ [denom: string]: cosmosclient.proto.cosmos.base.v1beta1.ICoin }>;

  faucetSymbols$: Observable<string[] | undefined>;
  faucets$: Observable<
    | {
        hasFaucet: boolean;
        faucetURL: string;
        denom: string;
        creditAmount: number;
        maxCredit: number;
      }[]
    | undefined
  >;
  nodeInfo$: Observable<GetNodeInfo200Response>;

  constructor(
    private readonly walletService: WalletService,
    private readonly bank: BankService,
    private readonly bankQuery: BankQueryService,
    private readonly rest: CosmosRestService,
    private usecase: BalanceUsecaseService,
    private readonly distributionAppService: DistributionApplicationService,
  ) {
    const wallet$ = this.walletService.currentStoredWallet$.pipe(
      filter((wallet): wallet is StoredWallet => wallet !== undefined && wallet !== null),
    );
    const address$ = wallet$.pipe(map((wallet) => wallet.address));
    this.walletId$ = wallet$.pipe(map((wallet) => wallet.id));
    this.walletType$ = wallet$.pipe(map((wallet) => wallet.type));
    this.accAddress$ = wallet$.pipe(map((wallet) => wallet.address));
    this.publicKey$ = wallet$.pipe(map((wallet) => wallet.public_key));
    const cosmosWallet$ = wallet$.pipe(
      throughMap((storedWallet) =>
        this.walletService.convertStoredWalletToCosmosWallet(storedWallet),
      ),
    );
    this.valAddress$ = cosmosWallet$.pipe(
      throughMap((wallet) => wallet.address.toValAddress().toString()),
    );
    this.symbolImageMap = this.bankQuery.getSymbolImageMap();
    this.denomBalancesMap$ = address$.pipe(
      mergeMap((address) => this.bankQuery.getDenomBalanceMap$(address!)),
    );
    this.symbolDisplayMap$ = this.bankQuery.getSymbolDisplayMap$();
    const denomMetadataMap$ = this.bankQuery.getDenomMetadataMap$();

    this.faucets$ = this.usecase.faucets$;
    this.faucetSymbols$ = combineLatest([this.faucets$, denomMetadataMap$]).pipe(
      map(([faucets, denomMetadataMap]) =>
        faucets?.map((f) => denomMetadataMap?.[f.denom!].symbol || 'Invalid Token'),
      ),
    );
    this.nodeInfo$ = this.rest.getNodeInfo$();
    this.accountTypeName$ = this.usecase.accountTypeName$;
  }

  ngOnInit(): void {}

  onSubmitWithdrawAllDelegatorReward() {
    this.distributionAppService.openWithdrawAllDelegatorRewardFormDialog();
  }
}
