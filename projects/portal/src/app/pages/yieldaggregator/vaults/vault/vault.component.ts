import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import cosmosclient from '@cosmos-client/core';
import { BandProtocolService } from 'projects/portal/src/app/models/band-protocols/band-protocol.service';
import { ConfigService } from 'projects/portal/src/app/models/config.service';
import { getDenomExponent } from 'projects/portal/src/app/models/cosmos/bank.model';
import { BankQueryService } from 'projects/portal/src/app/models/cosmos/bank.query.service';
import { WalletApplicationService } from 'projects/portal/src/app/models/wallets/wallet.application.service';
import { StoredWallet } from 'projects/portal/src/app/models/wallets/wallet.model';
import { WalletService } from 'projects/portal/src/app/models/wallets/wallet.service';
import { YieldAggregatorApplicationService } from 'projects/portal/src/app/models/yield-aggregators/yield-aggregator.application.service';
import {
  DepositToVaultRequest,
  VaultInfo,
  WithdrawFromVaultRequest,
  WithdrawFromVaultWithUnbondingRequest,
} from 'projects/portal/src/app/models/yield-aggregators/yield-aggregator.model';
import { YieldAggregatorQueryService } from 'projects/portal/src/app/models/yield-aggregators/yield-aggregator.query.service';
import { YieldAggregatorService } from 'projects/portal/src/app/models/yield-aggregators/yield-aggregator.service';
import { ExternalChain } from 'projects/portal/src/app/views/yieldaggregator/vaults/vault/vault.component';
import { BehaviorSubject, combineLatest, from, Observable, of, timer } from 'rxjs';
import { filter, map, mergeMap } from 'rxjs/operators';
import {
  DenomInfos200ResponseInfoInner,
  EstimateMintAmount200Response,
  EstimateRedeemAmount200Response,
  Vault200Response,
} from 'ununifi-client/esm/openapi';

export type DenomOnChain = DenomInfos200ResponseInfoInner & {
  chain: string;
  chainImg: string;
  ibc: boolean;
};

@Component({
  selector: 'app-vault',
  templateUrl: './vault.component.html',
  styleUrls: ['./vault.component.css'],
})
export class VaultComponent implements OnInit {
  address$: Observable<string>;
  vault$: Observable<Vault200Response>;
  denom$: Observable<string | null | undefined>;
  availableDenoms$: Observable<DenomOnChain[]>;
  symbol$: Observable<string | undefined>;
  denomBalancesMap$: Observable<{ [symbol: string]: cosmosclient.proto.cosmos.base.v1beta1.ICoin }>;
  denomMetadataMap$: Observable<{
    [denom: string]: cosmosclient.proto.cosmos.bank.v1beta1.IMetadata;
  }>;
  symbolImage$: Observable<string | null>;
  mintAmount$: BehaviorSubject<number>;
  burnAmount$: BehaviorSubject<number>;
  totalDepositAmount$: Observable<number>;
  totalBondedAmount$: Observable<number>;
  totalUnbondingAmount$: Observable<number>;
  withdrawReserve$: Observable<number>;
  estimatedMintAmount$: Observable<EstimateMintAmount200Response>;
  estimatedRedeemAmount$: Observable<EstimateRedeemAmount200Response>;
  estimatedDepositedAmount$: Observable<EstimateRedeemAmount200Response>;
  vaultBalance$: Observable<cosmosclient.proto.cosmos.base.v1beta1.ICoin>;
  usdDepositAmount$: Observable<number>;
  vaultInfo$: Observable<VaultInfo>;
  externalWalletAddress: string | undefined;

  constructor(
    private route: ActivatedRoute,
    private readonly iyaQuery: YieldAggregatorQueryService,
    private readonly iyaApp: YieldAggregatorApplicationService,
    private readonly iyaService: YieldAggregatorService,
    private readonly walletService: WalletService,
    private readonly walletApp: WalletApplicationService,
    private readonly bankQuery: BankQueryService,
    private readonly bandProtocolService: BandProtocolService,
    private readonly configService: ConfigService,
  ) {
    const vaultId$ = this.route.params.pipe(map((params) => params.vault_id));
    this.vault$ = vaultId$.pipe(mergeMap((id) => this.iyaQuery.getVault$(id)));
    this.symbol$ = this.vault$.pipe(map((vault) => vault.vault?.symbol));
    this.address$ = this.walletService.currentStoredWallet$.pipe(
      filter((wallet): wallet is StoredWallet => wallet !== undefined && wallet !== null),
      map((wallet) => wallet.address),
    );
    this.denomBalancesMap$ = this.address$.pipe(
      mergeMap((address) => this.bankQuery.getDenomBalanceMap$(address)),
    );
    this.denomMetadataMap$ = this.bankQuery.getDenomMetadataMap$();
    const symbolMetadataMap$ = this.bankQuery.getSymbolMetadataMap$();
    this.denom$ = combineLatest([this.symbol$, symbolMetadataMap$]).pipe(
      map(([symbol, symbolMetadataMap]) => symbolMetadataMap?.[symbol || '']?.base),
    );
    const denomInfos$ = this.iyaQuery.listDenomInfos$();
    this.availableDenoms$ = combineLatest([this.symbol$, denomInfos$]).pipe(
      map(([symbol, infos]) => {
        const denoms = infos
          .filter((info) => info.symbol === symbol)
          .map((info) => ({
            ...info,
            chain: 'UnUniFi',
            chainImg: 'assets/UnUniFi-logo.png',
            ibc: false,
          }));
        return symbol ? this.iyaService.addOtherChainsTokens(denoms, symbol) : denoms;
      }),
    );

    const timer$ = timer(0, 1000 * 60);
    this.totalDepositAmount$ = combineLatest([timer$, this.vault$]).pipe(
      mergeMap(([_, vault]) =>
        this.bandProtocolService.convertToUSDAmount(
          vault.vault?.symbol!,
          (
            Number(vault.total_bonded_amount) +
            Number(vault.total_unbonding_amount) +
            Number(vault.withdraw_reserve)
          ).toString(),
        ),
      ),
    );
    this.totalBondedAmount$ = combineLatest([timer$, this.vault$]).pipe(
      mergeMap(([_, vault]) =>
        this.bandProtocolService.convertToUSDAmount(
          vault.vault?.symbol!,
          vault.total_bonded_amount!,
        ),
      ),
    );
    this.totalUnbondingAmount$ = combineLatest([timer$, this.vault$]).pipe(
      mergeMap(([_, vault]) =>
        this.bandProtocolService.convertToUSDAmount(
          vault.vault?.symbol!,
          vault.total_unbonding_amount!,
        ),
      ),
    );
    this.withdrawReserve$ = combineLatest([timer$, this.vault$]).pipe(
      mergeMap(([_, vault]) =>
        this.bandProtocolService.convertToUSDAmount(vault.vault?.symbol!, vault.withdraw_reserve!),
      ),
    );

    this.symbolImage$ = this.symbol$.pipe(
      map((symbol) => (symbol ? this.bankQuery.getSymbolImageMap()[symbol] || '' : null)),
    );
    this.mintAmount$ = new BehaviorSubject(0);
    this.burnAmount$ = new BehaviorSubject(0);
    this.estimatedMintAmount$ = combineLatest([
      this.vault$,
      this.mintAmount$.asObservable(),
      this.denom$,
    ]).pipe(
      mergeMap(([vault, deposit, denom]) => {
        // return this.iyaService.estimateMintAmount$(vault, deposit);
        const id = vault.vault?.id;
        if (!id) {
          return of({ mint_amount: { amount: '0', denom: '' } });
        }
        const exponent = getDenomExponent(denom || '');
        return this.iyaQuery.getEstimatedMintAmount$(id, (deposit * 10 ** exponent).toString());
      }),
    );
    this.estimatedRedeemAmount$ = combineLatest([
      this.vault$,
      this.burnAmount$.asObservable(),
    ]).pipe(
      mergeMap(([vault, burn]) => {
        // return this.iyaService.estimateRedeemAmount$(vault, burn);
        const id = vault.vault?.id || '';
        const exponent = getDenomExponent('yieldaggregator/vaults/' + id);
        return this.iyaQuery.getEstimatedRedeemAmount$(id, (burn * 10 ** exponent).toString());
      }),
    );
    this.vaultInfo$ = combineLatest([this.vault$, this.configService.config$]).pipe(
      mergeMap(([vault, config]) => this.iyaService.calcVaultAPY(vault, config!)),
    );
    const balances$ = this.address$.pipe(mergeMap((addr) => this.bankQuery.getBalance$(addr)));
    this.vaultBalance$ = combineLatest([vaultId$, balances$]).pipe(
      map(([id, balances]) => {
        const balance = balances.find((balance) =>
          balance.denom?.includes('yieldaggregator/vaults/' + id),
        );
        if (!balance) {
          return {
            denom: 'yieldaggregator/vaults/' + id,
            amount: '0',
          };
        }
        return balance;
      }),
    );
    this.estimatedDepositedAmount$ = combineLatest([vaultId$, this.vaultBalance$]).pipe(
      mergeMap(([id, balance]) =>
        this.iyaQuery.getEstimatedRedeemAmount(id, balance?.amount || undefined),
      ),
    );
    this.usdDepositAmount$ = this.estimatedDepositedAmount$.pipe(
      mergeMap((depositedAmount) =>
        this.bandProtocolService.convertToUSDAmount(
          depositedAmount.symbol || '',
          depositedAmount.total_amount || '0',
        ),
      ),
    );
  }

  ngOnInit(): void {}

  onChangeDeposit(amount: number) {
    this.mintAmount$.next(amount);
  }

  onSubmitDeposit(data: DepositToVaultRequest) {
    this.iyaApp.depositToVault(data.vaultId, data.denom, data.readableAmount);
  }

  onChangeWithdraw(amount: number) {
    this.burnAmount$.next(amount);
  }

  onSubmitWithdraw(data: WithdrawFromVaultRequest) {
    this.iyaApp.withdrawFromVault(
      data.vaultId,
      data.lp_denom,
      data.readableAmount,
      data.redeemAmount,
      data.feeAmount,
      data.symbol,
    );
  }

  onSubmitWithdrawWithUnbonding(data: WithdrawFromVaultWithUnbondingRequest) {
    this.iyaApp.withdrawFromVaultWithUnbonding(data.vaultId, data.lp_denom, data.readableAmount);
  }

  async onClickChain(chain: ExternalChain) {
    this.externalWalletAddress = await this.walletApp.getExternalWallet(chain);
  }
}
