import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BandProtocolService } from 'projects/portal/src/app/models/band-protocols/band-protocol.service';
import { BankQueryService } from 'projects/portal/src/app/models/cosmos/bank.query.service';
import { CosmwasmQueryService } from 'projects/portal/src/app/models/cosmwasm/cosmwasm.query.service';
import { StoredWallet } from 'projects/portal/src/app/models/wallets/wallet.model';
import { WalletService } from 'projects/portal/src/app/models/wallets/wallet.service';
import { YieldAggregatorQueryService } from 'projects/portal/src/app/models/yield-aggregators/yield-aggregator.query.service';
import { Observable, combineLatest } from 'rxjs';
import { filter, map, mergeMap } from 'rxjs/operators';
import {
  EstimateRedeemAmount200Response,
  StrategyAll200ResponseStrategiesInner,
  VaultAll200ResponseVaultsInner,
} from 'ununifi-client/esm/openapi';

export type VaultBalance = {
  vaultId: string;
  amount: string;
};

@Component({
  selector: 'app-deposit',
  templateUrl: './deposit.component.html',
  styleUrls: ['./deposit.component.css'],
})
export class DepositComponent implements OnInit {
  address$: Observable<string>;
  owner$: Observable<string>;
  vaultBalances$: Observable<VaultBalance[]>;
  vaults$: Observable<VaultAll200ResponseVaultsInner[]>;
  symbols$: Observable<{ symbol: string; display: string; img: string }[]>;
  estimatedRedeemAmounts$: Observable<EstimateRedeemAmount200Response[]>;
  usdDepositAmount$: Observable<number[]>;
  usdTotalAmount$: Observable<number>;
  strategies$: Observable<
    {
      strategy: StrategyAll200ResponseStrategiesInner;
      amount?: string;
    }[]
  >;

  constructor(
    private route: ActivatedRoute,
    private readonly walletService: WalletService,
    private readonly bankQuery: BankQueryService,
    private readonly iyaQuery: YieldAggregatorQueryService,
    private readonly bandProtocolService: BandProtocolService,
    private readonly wasmQuery: CosmwasmQueryService,
  ) {
    this.address$ = this.walletService.currentStoredWallet$.pipe(
      filter((wallet): wallet is StoredWallet => wallet !== undefined && wallet !== null),
      map((wallet) => wallet.address),
    );
    this.owner$ = this.route.params.pipe(map((params) => params.address));
    const balances$ = this.owner$.pipe(mergeMap((owner) => this.bankQuery.getBalance$(owner)));
    this.vaultBalances$ = balances$.pipe(
      map((balance) =>
        balance
          .filter((balance) => balance.denom?.includes('yieldaggregator/vaults/'))
          .map((balance) => {
            return {
              vaultId: balance.denom?.replace('yieldaggregator/vaults/', '')!,
              amount: balance.amount!,
            };
          }),
      ),
    );
    this.vaults$ = combineLatest([this.iyaQuery.listVaults$(), this.vaultBalances$]).pipe(
      map(([vaults, balances]) =>
        vaults.filter((vault) => balances.some((balance) => balance.vaultId === vault.vault?.id)),
      ),
    );
    const denomMetadataMap$ = this.bankQuery.getDenomMetadataMap$();
    const symbolMetadataMap$ = this.bankQuery.getSymbolMetadataMap$();
    this.symbols$ = combineLatest([this.vaults$, symbolMetadataMap$]).pipe(
      map(([vaults, symbolMetadataMap]) =>
        vaults.map((vault) => {
          const symbol = vault.vault?.symbol || '';
          const display = symbolMetadataMap?.[symbol]?.display || symbol;
          const img = this.bankQuery.getSymbolImageMap()[symbol];
          return { symbol: symbol, display: display, img: img };
        }),
      ),
    );
    this.estimatedRedeemAmounts$ = this.vaultBalances$.pipe(
      mergeMap((vaultBalances) =>
        Promise.all(
          vaultBalances.map(async (balance) => {
            const amount = await this.iyaQuery.getEstimatedRedeemAmount(
              balance.vaultId,
              balance.amount,
            );
            return amount;
          }),
        ),
      ),
    );
    this.usdDepositAmount$ = this.estimatedRedeemAmounts$.pipe(
      mergeMap((redeemAmounts) =>
        Promise.all(
          redeemAmounts.map(async (redeemAmount) => {
            return this.bandProtocolService.convertToUSDAmount(
              redeemAmount.symbol || '',
              redeemAmount.total_amount || '',
            );
          }),
        ),
      ),
    );
    this.usdTotalAmount$ = this.usdDepositAmount$.pipe(
      map((usdDepositAmount) => usdDepositAmount.reduce((a, b) => a + b, 0)),
    );

    const allStrategies$ = this.iyaQuery.listStrategies$();
    this.strategies$ = combineLatest([allStrategies$, this.address$]).pipe(
      mergeMap(([strategies, address]) =>
        Promise.all(
          strategies.map(async (strategy) => {
            if (!strategy.strategy?.contract_address) {
              return { strategy, unbonding: undefined };
            }
            const unbonding = await this.wasmQuery.getUnbonding(
              strategy.strategy?.contract_address,
              address,
            );
            return { strategy, unbonding: unbonding };
          }),
        ),
      ),
    );
  }

  ngOnInit(): void {}
}
