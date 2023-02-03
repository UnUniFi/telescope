import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import ununificlient from 'ununifi-client';
import { AllPositions200ResponsePositionsInner } from 'ununifi-client/esm/openapi';

@Component({
  selector: 'view-perpetual-futures',
  templateUrl: './perpetual-futures.component.html',
  styleUrls: ['./perpetual-futures.component.css'],
})
export class PerpetualFuturesComponent implements OnInit {
  @Input()
  position?: AllPositions200ResponsePositionsInner | null;

  @Input()
  positionInstance?: ununificlient.proto.ununifi.derivatives.PerpetualFuturesPositionInstance | null;

  @Output()
  closePosition = new EventEmitter();

  positionType = ununificlient.proto.ununifi.derivatives.PositionType;

  constructor() {}

  ngOnInit(): void {}

  onClickClose() {
    this.closePosition.emit();
  }
}