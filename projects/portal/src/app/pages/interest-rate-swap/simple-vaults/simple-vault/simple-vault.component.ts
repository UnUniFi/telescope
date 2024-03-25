import { EstimationInfo, ReadableEstimationInfo } from '../../vaults/vault/vault.component';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import cosmosclient from '@cosmos-client/core';
import { IRSVaultImage, ConfigService } from 'projects/portal/src/app/models/config.service';
import { getDenomExponent } from 'projects/portal/src/app/models/cosmos/bank.model';
import { BankQueryService } from 'projects/portal/src/app/models/cosmos/bank.query.service';
import { BankService } from 'projects/portal/src/app/models/cosmos/bank.service';
import { IrsApplicationService } from 'projects/portal/src/app/models/irs/irs.application.service';
import { MintPtRequest, RedeemPtRequest } from 'projects/portal/src/app/models/irs/irs.model';
import { IrsQueryService } from 'projects/portal/src/app/models/irs/irs.query.service';
import { StoredWallet } from 'projects/portal/src/app/models/wallets/wallet.model';
import { WalletService } from 'projects/portal/src/app/models/wallets/wallet.service';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { filter, map, mergeMap } from 'rxjs/operators';
import {
  AllTranches200ResponseTranchesInner,
  VaultByContract200ResponseVault,
  TranchePtAPYs200Response,
} from 'ununifi-client/esm/openapi';

@Component({
  selector: 'app-simple-vault',
  templateUrl: './simple-vault.component.html',
  styleUrls: ['./simple-vault.component.css'],
})
export class SimpleVaultComponent implements OnInit {
  address$: Observable<string>;
  contractAddress$: Observable<string>;
  vault$: Observable<VaultByContract200ResponseVault | undefined>;
  tranches$: Observable<AllTranches200ResponseTranchesInner[] | undefined>;
  trancheFixedAPYs$: Observable<(TranchePtAPYs200Response | undefined)[]>;
  denomBalancesMap$: Observable<{ [symbol: string]: cosmosclient.proto.cosmos.base.v1beta1.ICoin }>;
  vaultImage$?: Observable<IRSVaultImage | undefined>;
  selectedPoolId$?: Observable<string | undefined>;
  selectedFixedAPYs$?: Observable<TranchePtAPYs200Response | undefined>;
  ptCoin$: Observable<cosmosclient.proto.cosmos.base.v1beta1.ICoin | undefined>;
  tranchePtAmount$: Observable<number>;
  ptValue$: Observable<number | undefined>;
  txMode$: Observable<'deposit' | 'redeem'>;

  utAmountForMintPt$: BehaviorSubject<EstimationInfo | undefined>;
  estimateMintPt$: Observable<number | undefined>;
  ptAmountForRedeemPt$: BehaviorSubject<EstimationInfo | undefined>;
  estimateRedeemPt$: Observable<number | undefined>;
  afterPtAmount$: Observable<number>;
  afterPtValue$: Observable<number>;
  actualFixedAPYs$: Observable<TranchePtAPYs200Response | undefined>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private readonly walletService: WalletService,
    private readonly bankQuery: BankQueryService,
    private readonly irsQuery: IrsQueryService,
    private readonly irsAppService: IrsApplicationService,
    private readonly bankService: BankService,
    private readonly configS: ConfigService,
  ) {
    const selectPoolId$ = this.route.queryParams.pipe(map((params) => params.tranche));
    this.txMode$ = this.route.queryParams.pipe(map((params) => params.tx || 'deposit'));
    this.address$ = this.walletService.currentStoredWallet$.pipe(
      filter((wallet): wallet is StoredWallet => wallet !== undefined && wallet !== null),
      map((wallet) => wallet.address),
    );
    this.contractAddress$ = this.route.params.pipe(map((params) => params.contract));
    this.vault$ = this.contractAddress$.pipe(
      mergeMap((contract) => this.irsQuery.getVaultByContract$(contract)),
    );
    this.tranches$ = this.contractAddress$.pipe(
      mergeMap((contract) => this.irsQuery.listTranchesByContract$(contract)),
    );
    this.selectedPoolId$ = combineLatest([this.tranches$, selectPoolId$]).pipe(
      map(([tranches, selected]) => {
        if (selected) {
          return selected;
        }
        return tranches ? tranches[0].id : undefined;
      }),
    );
    this.selectedFixedAPYs$ = this.selectedPoolId$.pipe(
      mergeMap((poolId) => (poolId ? this.irsQuery.getTranchePtAPYs$(poolId) : of(undefined))),
    );

    this.trancheFixedAPYs$ = this.tranches$.pipe(
      mergeMap((tranches) =>
        Promise.all(
          tranches
            ? tranches.map(async (tranche) =>
                tranche.id ? await this.irsQuery.getTranchePtAPYs(tranche.id) : undefined,
              )
            : [],
        ),
      ),
    );
    this.denomBalancesMap$ = this.address$.pipe(
      mergeMap((address) => this.bankQuery.getDenomBalanceMap$(address)),
    );
    this.ptCoin$ = combineLatest([this.selectedPoolId$, this.denomBalancesMap$]).pipe(
      map(([poolId, denomBalancesMap]) => {
        const denom = `irs/tranche/${poolId}/pt`;
        const coin = denomBalancesMap[denom];
        if (!coin) {
          return undefined;
        }
        return coin;
      }),
    );
    this.tranchePtAmount$ = this.ptCoin$.pipe(
      map((coin) => {
        if (!coin?.denom) {
          return 0;
        }
        const exponent = getDenomExponent(coin.denom);
        return Number(coin.amount) / Math.pow(10, exponent);
      }),
    );
    this.ptValue$ = combineLatest([this.ptCoin$, this.selectedFixedAPYs$]).pipe(
      map(([ptCoin, fixedAPYs]) => {
        if (!ptCoin?.amount || !fixedAPYs?.pt_rate_per_deposit) {
          return 0;
        }
        return Number(ptCoin.amount) / Number(fixedAPYs.pt_rate_per_deposit);
      }),
    );
    const images$ = this.configS.config$.pipe(map((config) => config?.irsVaultsImages ?? []));
    this.vaultImage$ = combineLatest([this.contractAddress$, images$]).pipe(
      map(([contract, images]) => images.find((image) => image.contract === contract)),
    );

    this.utAmountForMintPt$ = new BehaviorSubject<EstimationInfo | undefined>(undefined);
    this.ptAmountForRedeemPt$ = new BehaviorSubject<EstimationInfo | undefined>(undefined);
    this.estimateMintPt$ = this.utAmountForMintPt$.asObservable().pipe(
      mergeMap((info) => {
        if (!info) {
          return of(undefined);
        }
        return this.irsQuery.estimateSwapInPool$(info.poolId, info.denom, info.amount);
      }),
      map((coin) => {
        if (!coin) {
          return undefined;
        }
        return Number(coin.amount);
      }),
    );
    this.estimateRedeemPt$ = this.ptAmountForRedeemPt$.asObservable().pipe(
      mergeMap((info) => {
        if (!info) {
          return of(undefined);
        }
        return this.irsQuery.estimateSwapInPool$(info.poolId, info.denom, info.amount);
      }),
      map((coin) => {
        if (!coin) {
          return undefined;
        }
        return Number(coin.amount);
      }),
    );
    this.afterPtAmount$ = combineLatest([
      this.ptCoin$,
      this.ptAmountForRedeemPt$.asObservable(),
      this.estimateMintPt$,
    ]).pipe(
      map(
        ([ptCoin, redeemPt, mintPt]) =>
          Number(ptCoin?.amount || 0) - Number(redeemPt?.amount || 0) + (mintPt || 0),
      ),
    );
    this.afterPtValue$ = combineLatest([
      this.ptValue$,
      this.tranches$,
      this.selectedPoolId$,
      this.trancheFixedAPYs$,
      this.ptAmountForRedeemPt$.asObservable(),
      this.estimateMintPt$,
    ]).pipe(
      map(([ptValue, tranches, id, fixedAPYs, redeemPt, mintPt]) => {
        const index = tranches?.findIndex((tranche) => tranche?.id === id);
        if (index == undefined || !fixedAPYs[index]?.pt_rate_per_deposit) {
          return ptValue || 0;
        }
        const rate = Number(fixedAPYs[index]?.pt_rate_per_deposit);
        return (ptValue || 0) + (mintPt || 0) / rate - Number(redeemPt?.amount || 0) / rate;
      }),
    );
    this.actualFixedAPYs$ = combineLatest([
      this.selectedPoolId$,
      this.utAmountForMintPt$.asObservable(),
    ]).pipe(
      mergeMap(([poolId, depositAmount]) => {
        if (!poolId || !depositAmount) {
          return of(undefined);
        }
        return this.irsQuery.getTranchePtAPYs$(poolId, depositAmount.amount);
      }),
    );
  }

  ngOnInit(): void {}

  onMintPT(data: MintPtRequest) {
    // swap DepositToken -> PT
    this.irsAppService.mintPT(data);
  }
  onChangeMintPT(data: ReadableEstimationInfo) {
    const coin = this.bankService.convertDenomReadableAmountMapToCoins({
      [data.denom]: data.readableAmount,
    })[0];
    this.utAmountForMintPt$.next({
      poolId: data.poolId,
      denom: data.denom,
      amount: coin.amount || '0',
    });
  }
  onRedeemPT(data: RedeemPtRequest) {
    // swap PT -> DepositToken
    this.irsAppService.redeemPT(data);
  }
  onChangeRedeemPT(data: ReadableEstimationInfo) {
    const coin = this.bankService.convertDenomReadableAmountMapToCoins({
      [data.denom]: data.readableAmount,
    })[0];
    this.ptAmountForRedeemPt$.next({
      poolId: data.poolId,
      denom: data.denom,
      amount: coin.amount || '0',
    });
  }
  onDeleteDeposit(data: {}) {
    this.utAmountForMintPt$.next(undefined);
  }
  onDeleteWithdraw(data: {}) {
    this.ptAmountForRedeemPt$.next(undefined);
  }
  onSelectTranche(id: string) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        tranche: id,
      },
      queryParamsHandling: 'merge',
    });
  }
  onChangeTxMode(mode: string) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        tx: mode,
      },
      queryParamsHandling: 'merge',
    });
  }
}
