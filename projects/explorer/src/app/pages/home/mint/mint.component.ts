import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import cosmosclient from '@cosmos-client/core';
import {
  CosmosMintV1beta1QueryAnnualProvisionsResponse,
  CosmosMintV1beta1QueryInflationResponse,
} from '@cosmos-client/core/esm/openapi/api';
import { CosmosSDKService } from 'projects/explorer/src/app/models/cosmos-sdk.service';
import { Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

@Component({
  selector: 'app-mint',
  templateUrl: './mint.component.html',
  styleUrls: ['./mint.component.css'],
})
export class MintComponent implements OnInit {
  inflation$: Observable<CosmosMintV1beta1QueryInflationResponse>;
  annualProvisions$: Observable<CosmosMintV1beta1QueryAnnualProvisionsResponse>;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly cosmosSDK: CosmosSDKService,
  ) {
    this.inflation$ = this.cosmosSDK.sdk$.pipe(
      mergeMap((sdk) => cosmosclient.rest.mint.inflation(sdk.rest).then((res) => res.data)),
    );
    this.annualProvisions$ = this.cosmosSDK.sdk$.pipe(
      mergeMap((sdk) => cosmosclient.rest.mint.annualProvisions(sdk.rest).then((res) => res.data)),
    );
  }

  ngOnInit(): void { }
}
