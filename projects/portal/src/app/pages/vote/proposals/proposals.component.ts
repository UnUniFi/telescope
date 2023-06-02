import { GovApplicationService } from '../../../models/cosmos/gov.application.service';
import { ProposalsUseCaseService } from './proposals.usecase.service';
import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { Router, ActivatedRoute } from '@angular/router';
import cosmosclient from '@cosmos-client/core';
import { Proposals200ResponseProposalsInner } from '@cosmos-client/core/esm/openapi/api';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-proposals',
  templateUrl: './proposals.component.html',
  styleUrls: ['./proposals.component.css'],
})
export class ProposalsComponent implements OnInit {
  paginatedProposals$: Observable<Proposals200ResponseProposalsInner[]>;
  tallies$: Observable<
    { yes: number; no: number; abstain: number; noWithVeto: number; max: number }[]
  >;
  pageSize$: Observable<number>;
  pageNumber$: Observable<number>;
  pageLength$: Observable<number | undefined>;
  pageSizeOptions = [5, 10, 15];

  private proposals$: Observable<Proposals200ResponseProposalsInner[]>;
  private defaultPageSize = this.pageSizeOptions[1];
  private defaultPageNumber = 1;

  constructor(
    private router: Router,
    private usecase: ProposalsUseCaseService,
    private readonly route: ActivatedRoute,
    private readonly govAppService: GovApplicationService,
  ) {
    this.proposals$ = this.usecase.proposals$;
    this.pageLength$ = this.usecase.pageLength$(this.proposals$);
    this.pageSize$ = this.route.queryParams.pipe(
      map((params) => {
        const pageSize = Number(params.perPage);
        if (this.pageSizeOptions.includes(pageSize)) {
          return pageSize;
        } else {
          return this.defaultPageSize;
        }
      }),
    );
    this.pageNumber$ = combineLatest([
      this.pageLength$,
      this.pageSize$,
      this.route.queryParams,
    ]).pipe(
      map(([pageLength, pageSize, params]) => {
        if (pageLength === undefined) {
          return this.defaultPageNumber;
        }
        const pages = Number(params.pages);
        if (!pages) return this.defaultPageNumber;
        if (pages > pageLength / pageSize + 1) return this.defaultPageNumber;
        return pages;
      }),
    );
    this.paginatedProposals$ = this.usecase.paginatedProposals$(
      this.proposals$,
      this.pageNumber$,
      this.pageSize$,
    );
    this.tallies$ = this.usecase.tallies$(this.proposals$, this.pageNumber$, this.pageSize$).pipe(
      map((tallies) =>
        tallies.map((tally) => {
          const yes = this.lnValue(tally?.yes);
          const no = this.lnValue(tally?.no);
          const abstain = this.lnValue(tally?.abstain);
          const noWithVeto = this.lnValue(tally?.no_with_veto);
          const max = Math.max(yes, no, abstain, noWithVeto);
          return { yes, no, abstain, noWithVeto, max };
        }),
      ),
    );
  }

  ngOnInit(): void {}

  appPaginationChanged(pageEvent: PageEvent): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        perPage: pageEvent.pageSize,
        pages: pageEvent.pageIndex + 1,
      },
      queryParamsHandling: 'merge',
    });
  }

  onVoteProposal(proposalID: number) {
    this.govAppService.openVoteFormDialog(proposalID);
  }

  getPaginatedProposals(
    proposals: Proposals200ResponseProposalsInner[],
    pageNumber: number,
    pageSize: number,
  ): Proposals200ResponseProposalsInner[] {
    const max = proposals.length - (pageNumber - 1) * pageSize;
    const min = max - pageSize;
    return proposals.filter((_, i) => min <= i && i < max).reverse();
  }

  lnValue(value?: string) {
    if (!value) {
      return 0;
    } else if (!Number(value)) {
      return 0;
    } else {
      return Math.log(Number(value));
    }
  }
}
