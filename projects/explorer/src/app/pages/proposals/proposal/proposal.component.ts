import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import cosmosclient from '@cosmos-client/core';
import {
  Proposals200ResponseProposalsInner,
  Deposits200ResponseDepositsInner,
  Proposals200ResponseProposalsInnerFinalTallyResult,
  Votes200ResponseVotesInner,
  GovParams200ResponseDepositParams,
  GovParams200ResponseTallyParams,
  GovParams200ResponseVotingParams,
} from '@cosmos-client/core/esm/openapi';
import { CosmosSDKService } from 'projects/explorer/src/app/models/cosmos-sdk.service';
import { txParseProposalContent } from 'projects/explorer/src/app/utils/tx-parser';
import { combineLatest, Observable, of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';

@Component({
  selector: 'app-proposal',
  templateUrl: './proposal.component.html',
  styleUrls: ['./proposal.component.css'],
})
export class ProposalComponent implements OnInit {
  proposal$: Observable<Proposals200ResponseProposalsInner | undefined>;
  proposalType$: Observable<string | undefined>;
  proposalContent$: Observable<cosmosclient.proto.cosmos.gov.v1beta1.TextProposal | undefined>;
  deposits$: Observable<Deposits200ResponseDepositsInner[] | undefined>;
  depositParams$: Observable<GovParams200ResponseDepositParams | undefined>;
  tally$: Observable<Proposals200ResponseProposalsInnerFinalTallyResult | undefined>;
  tallyParams$: Observable<GovParams200ResponseTallyParams | undefined>;
  votes$: Observable<Votes200ResponseVotesInner[] | undefined>;
  votingParams$: Observable<GovParams200ResponseVotingParams | undefined>;

  constructor(private route: ActivatedRoute, private cosmosSDK: CosmosSDKService) {
    const proposalID$ = this.route.params.pipe(map((params) => params.id));

    const combined$ = combineLatest([this.cosmosSDK.sdk$, proposalID$]);
    this.proposal$ = combined$.pipe(
      mergeMap(([sdk, address]) => cosmosclient.rest.gov.proposal(sdk.rest, address)),
      map((result) => result.data.proposal!),
      catchError((error) => {
        console.error(error);
        return of(undefined);
      }),
    );

    this.proposalType$ = this.proposal$.pipe(
      map((proposal) => {
        if (proposal && proposal.content) {
          return (proposal.content as any)['@type'];
        }
      }),
    );

    this.proposalContent$ = this.proposal$.pipe(
      map((proposal) => txParseProposalContent(proposal?.content!)),
    );

    this.deposits$ = combined$.pipe(
      mergeMap(([sdk, address]) => cosmosclient.rest.gov.deposits(sdk.rest, address)),
      map((result) => result.data.deposits!),
      catchError((error) => {
        console.error(error);
        return of(undefined);
      }),
    );

    this.depositParams$ = this.cosmosSDK.sdk$.pipe(
      mergeMap((sdk) => cosmosclient.rest.gov.params(sdk.rest, 'deposit')),
      map((result) => result.data.deposit_params),
    );

    this.tally$ = combined$.pipe(
      mergeMap(([sdk, address]) => cosmosclient.rest.gov.tallyresult(sdk.rest, address)),
      map((result) => result.data.tally!),
      catchError((error) => {
        console.error(error);
        return of(undefined);
      }),
    );

    this.tallyParams$ = this.cosmosSDK.sdk$.pipe(
      mergeMap((sdk) => cosmosclient.rest.gov.params(sdk.rest, 'tallying')),
      map((result) => result.data.tally_params),
      catchError((error) => {
        console.error(error);
        return of(undefined);
      }),
    );

    this.votes$ = combined$.pipe(
      mergeMap(([sdk, address]) => cosmosclient.rest.gov.votes(sdk.rest, address)),
      map((result) => result.data.votes!),
      catchError((error) => {
        console.error(error);
        return of(undefined);
      }),
    );

    this.votingParams$ = this.cosmosSDK.sdk$.pipe(
      mergeMap((sdk) => cosmosclient.rest.gov.params(sdk.rest, 'voting')),
      map((result) => result.data.voting_params),
      catchError((error) => {
        console.error(error);
        return of(undefined);
      }),
    );
  }

  ngOnInit(): void {}
}
