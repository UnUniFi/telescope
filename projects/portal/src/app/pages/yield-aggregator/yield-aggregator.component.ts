import { BankQueryService } from '../../models/cosmos/bank.query.service';
import { YieldAggregatorQueryService } from '../../models/yield-aggregators/yield-aggregator.query.service';
import { Component, OnInit } from '@angular/core';
import { cosmos } from '@cosmos-client/core/esm/proto';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-yield-aggregator',
  templateUrl: './yield-aggregator.component.html',
  styleUrls: ['./yield-aggregator.component.css'],
})
export class YieldAggregatorComponent implements OnInit {
  symbolMetadataMap$: Observable<{ [symbol: string]: cosmos.bank.v1beta1.IMetadata }>;
  availableSymbols$: Observable<string[]>;

  constructor(
    private readonly bankQuery: BankQueryService,
    private readonly iyaQuery: YieldAggregatorQueryService,
  ) {
    this.symbolMetadataMap$ = this.bankQuery.getSymbolMetadataMap$();
    const denomMetadataMap$ = this.bankQuery.getDenomMetadataMap$();

    const allStrategies$ = this.iyaQuery.listStrategies$('');
    this.availableSymbols$ = combineLatest([allStrategies$, denomMetadataMap$]).pipe(
      map(([allStrategies, denomMetadataMap]) => {
        const symbols = allStrategies
          .map((strategy) => {
            const denomMetadata = denomMetadataMap[strategy.denom || ''];
            if (denomMetadata) {
              return denomMetadata.symbol;
            } else {
              return undefined;
            }
          })
          .filter((symbol): symbol is string => typeof symbol == 'string');
        return [...new Set(symbols)];
      }),
    );
  }

  ngOnInit(): void {}
}
