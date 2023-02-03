import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import cosmosclient from '@cosmos-client/core';
import ununificlient from 'ununifi-client';

declare const TradingView: any;

export type OpenPositionEvent = {};

@Component({
  selector: 'view-market',
  templateUrl: './market.component.html',
  styleUrls: ['./market.component.css'],
})
export class MarketComponent implements OnInit, AfterViewInit, OnChanges {
  @Input()
  baseSymbol?: string | null;

  @Input()
  quoteSymbol?: string | null;

  @Input()
  params?: ununificlient.proto.ununifi.derivatives.IPerpetualFuturesParams | null;

  @Input()
  info?: ununificlient.proto.ununifi.derivatives.IQueryPerpetualFuturesMarketResponse;

  @Input()
  symbolBalancesMap?: { [symbol: string]: number } | null;

  @Input()
  symbolMetadataMap?: { [symbol: string]: cosmosclient.proto.cosmos.bank.v1beta1.IMetadata } | null;

  @Output()
  openPosition = new EventEmitter<OpenPositionEvent>();

  leverage = 1;
  margin = 0;
  maxMargin = 100;
  minMargin = 0;
  marginDenom?: string | null;

  positionType = ununificlient.proto.ununifi.derivatives.PositionType;
  tradingViewConfig: { [market: string]: any } = {
    'ETH/USD': {
      autosize: true,
      symbol: 'COINBASE:ETHUSD',
      interval: '60',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      toolbar_bg: '#f1f3f6',
      enable_publishing: false,
      hide_legend: true,
      save_image: false,
      container_id: 'tradingview_5b3c4',
    },
    'BTC/USD': {
      autosize: true,
      symbol: 'COINBASE:BTCUSD',
      interval: '60',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      toolbar_bg: '#f1f3f6',
      enable_publishing: false,
      hide_legend: true,
      save_image: false,
      container_id: 'tradingview_5b3c4',
    },
    'ATOM/USD': {
      autosize: true,
      symbol: 'COINBASE:ATOMUSD',
      interval: '60',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      toolbar_bg: '#f1f3f6',
      enable_publishing: false,
      hide_legend: true,
      save_image: false,
      container_id: 'tradingview_5b3c4',
    },
  };

  constructor() {}

  ngOnInit(): void {}

  updateTradingView() {
    const getMarket = (baseSymbol?: string | null, quoteSymbol?: string | null) =>
      `${baseSymbol}/${quoteSymbol}`;

    const market = getMarket(this.baseSymbol, this.quoteSymbol);
    if (this.tradingViewConfig[market]) {
      TradingView.widget(this.tradingViewConfig[market]);
    }
  }

  ngAfterViewInit(): void {
    this.updateTradingView();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.baseSymbol || changes.quoteSymbol) {
      this.updateTradingView();

      if (changes.balancesMap) {
        const metadata = this.symbolMetadataMap?.[this.quoteSymbol || ''];
        const quoteDenom = metadata?.base;
        const exponent =
          metadata?.denom_units?.find((unit) => unit.denom === quoteDenom)?.exponent ?? 0;
        this.maxMargin = this.symbolBalancesMap?.[this.quoteSymbol || ''] ?? 0;
      }
    }
  }

  onTogglePositionType(positionType: ununificlient.proto.ununifi.derivatives.PositionType) {
    switch (positionType) {
      case ununificlient.proto.ununifi.derivatives.PositionType.LONG:
        this.marginDenom = this.quoteSymbol;
        break;
      case ununificlient.proto.ununifi.derivatives.PositionType.SHORT:
        this.marginDenom = this.baseSymbol;
        break;
    }
  }

  onClickSetMargin(size: number, leverage: number) {
    this.margin = size / leverage;
  }

  onSubmit(size: number, leverage: number, margin: number) {
    this.openPosition.emit({
      size,
      leverage,
      margin,
    });
  }
}