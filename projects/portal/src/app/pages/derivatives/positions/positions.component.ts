import { DerivativesQueryService } from '../../../models/derivatives/derivatives.query.service';
import { StoredWallet } from '../../../models/wallets/wallet.model';
import { WalletService } from '../../../models/wallets/wallet.service';
import { Component, OnInit } from '@angular/core';
import cosmosclient from '@cosmos-client/core';
import { filter, map, mergeMap } from 'rxjs/operators';

@Component({
  selector: 'app-positions',
  templateUrl: './positions.component.html',
  styleUrls: ['./positions.component.css'],
})
export class PositionsComponent implements OnInit {
  address$ = this.walletService.currentStoredWallet$.pipe(
    filter((wallet): wallet is StoredWallet => wallet !== undefined && wallet !== null),
    map((wallet) => cosmosclient.AccAddress.fromString(wallet.address)),
  );
  positions$ = this.address$.pipe(
    mergeMap((address) => this.derivativesQuery.listAddressPositions$(address.toString())),
  );

  constructor(
    private readonly walletService: WalletService,
    private readonly derivativesQuery: DerivativesQueryService,
  ) {}

  ngOnInit(): void {}
}