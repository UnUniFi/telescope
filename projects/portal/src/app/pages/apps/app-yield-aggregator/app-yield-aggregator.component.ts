import { AppNavigation, ConfigService } from '../../../models/config.service';
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-app-yield-aggregator',
  templateUrl: './app-yield-aggregator.component.html',
  styleUrls: ['./app-yield-aggregator.component.css'],
})
export class AppYieldAggregatorComponent implements OnInit {
  apps$: Observable<AppNavigation[] | undefined>;
  navigations$: Observable<{ name: string; link: string; icon: string }[] | undefined>;

  constructor(private readonly configS: ConfigService) {
    const config$ = this.configS.config$;
    this.apps$ = config$.pipe(map((conf) => conf?.apps));
    this.navigations$ = config$.pipe(
      map((config) => {
        const navigation = config?.extension?.navigations.slice();
        if (config?.extension?.developer?.enabled) {
          navigation?.unshift({
            name: 'Developers',
            link: '/portal/developers',
            icon: 'build',
          });
        }
        if (config?.extension?.nftMint?.enabled) {
          navigation?.unshift({
            name: 'NFT Mint',
            link: '/portal/nfts/mint',
            icon: 'add_photo_alternate',
          });
        }
        if (config?.extension?.faucet?.filter((faucet) => faucet.hasFaucet == true).length) {
          navigation?.unshift({
            name: 'Faucet',
            link: '/portal/faucet',
            icon: 'clean_hands',
          });
        }
        if (config?.extension?.monitor != undefined) {
          navigation?.unshift({
            name: 'Monitor',
            link: '/portal/monitor',
            icon: 'monitor',
          });
        }
        return navigation;
      }),
    );
  }

  ngOnInit(): void {}
}
