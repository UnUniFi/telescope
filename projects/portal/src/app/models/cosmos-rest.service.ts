import { CosmosSDKService } from './cosmos-sdk.service';
import { Injectable } from '@angular/core';
import cosmosclient from '@cosmos-client/core';
import { CosmosSDK } from '@cosmos-client/core/cjs/sdk';
import {
  CosmosDistributionV1beta1QueryDelegationTotalRewardsResponse as DelegationTotalRewardsResponse,
  CosmosDistributionV1beta1QueryValidatorSlashesResponse as ValidatorSlashesResponse,
  CosmosTxV1beta1GetTxsEventResponse as TxsEventResponse,
  InlineResponse20012 as InlineResponse,
  InlineResponse20022,
  InlineResponse2003Balances as InlineResponseBalances,
  QueryValidatorCommissionResponseIsTheResponseTypeForTheQueryValidatorCommissionRPCMethod as ValidatorCommissionResponse,
} from '@cosmos-client/core/esm/openapi';
import { Observable, of } from 'rxjs';
import { catchError, map, mergeMap, pluck, tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class CosmosRestService {
  private restSdk$: Observable<CosmosSDK>;

  constructor(private cosmosSDK: CosmosSDKService) {
    this.restSdk$ = this.cosmosSDK.sdk$.pipe(pluck('rest'));
  }

  getNodeInfo$(): Observable<InlineResponse> {
    return this.restSdk$.pipe(
      mergeMap((sdk) => cosmosclient.rest.tendermint.getNodeInfo(sdk)),
      map((res) => res.data),
    );
  }

  allBalances$(
    cosmosAccAddress: cosmosclient.AccAddress,
  ): Observable<InlineResponseBalances[] | undefined> {
    return this.restSdk$.pipe(
      mergeMap((sdk) => cosmosclient.rest.bank.allBalances(sdk, cosmosAccAddress)),
      map((res) => res.data.balances),
      catchError(this._handleError),
    );
  }

  getAccount$(cosmosAccAddress: cosmosclient.AccAddress): Observable<InlineResponse | undefined> {
    return this.restSdk$.pipe(
      mergeMap((sdk) => cosmosclient.rest.auth.account(sdk, cosmosAccAddress)),
      tap((res) => console.log(res.data.account)),
      map((res) => res.data.account),
      map((account) => {
        const { protoJSONToInstance, castProtoJSONOfProtoAny } = cosmosclient.codec;
        return (account && protoJSONToInstance(castProtoJSONOfProtoAny(account))) as InlineResponse;
      }),
      catchError(this._handleError),
    );
  }

  getAccountTxsEvent$(address: string): Observable<TxsEventResponse | undefined> {
    return this.restSdk$.pipe(
      mergeMap((sdk) =>
        cosmosclient.rest.tx.getTxsEvent(
          sdk,
          [`message.sender='${address}'`],
          undefined,
          undefined,
          undefined,
          true,
        ),
      ),
      map((res) => res.data),
      catchError(this._handleError),
    );
  }

  getDelegationTotalRewards$(
    accAddress: cosmosclient.AccAddress,
  ): Observable<DelegationTotalRewardsResponse | undefined> {
    return this.restSdk$.pipe(
      mergeMap((sdk) => cosmosclient.rest.distribution.delegationTotalRewards(sdk, accAddress)),
      map((res) => res.data),
      catchError(this._handleError),
    );
  }

  getValidatorCommission$(
    validatorAddress: cosmosclient.ValAddress,
  ): Observable<ValidatorCommissionResponse | undefined> {
    return this.restSdk$.pipe(
      mergeMap((sdk) => cosmosclient.rest.distribution.validatorCommission(sdk, validatorAddress)),
      map((res) => res.data),
      catchError(this._handleError),
    );
  }

  getValidatorOutstandingRewards$(
    valAddress: cosmosclient.ValAddress,
  ): Observable<InlineResponse20022 | undefined> {
    return this.restSdk$.pipe(
      mergeMap((sdk) =>
        cosmosclient.rest.distribution.validatorOutstandingRewards(sdk, valAddress),
      ),
      map((res) => res.data),
      catchError(this._handleError),
    );
  }

  getValidatorSlashes$(
    valAddress: cosmosclient.ValAddress,
    startingHeight?: string,
    endingHeight?: string,
  ): Observable<ValidatorSlashesResponse | undefined> {
    return this.restSdk$.pipe(
      mergeMap((sdk) =>
        cosmosclient.rest.distribution.validatorSlashes(
          sdk,
          valAddress,
          startingHeight,
          endingHeight,
        ),
      ),
      map((res) => res.data),
      catchError(this._handleError),
    );
  }

  private _handleError(error: any): Observable<undefined> {
    console.error(error);
    return of(undefined);
  }
}
