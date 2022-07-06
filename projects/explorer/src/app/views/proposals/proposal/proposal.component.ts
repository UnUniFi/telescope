import { ProposalContent } from '../proposals.component';
import { Component, Input, OnInit } from '@angular/core';
import cosmosclient from '@cosmos-client/core';
import {
  InlineResponse20027Proposals,
  InlineResponse20029Deposits,
  InlineResponse20027FinalTallyResult,
  InlineResponse20032Votes,
  InlineResponse20026DepositParams,
  InlineResponse20026TallyParams,
  InlineResponse20026VotingParams,
} from '@cosmos-client/core/esm/openapi';

@Component({
  selector: 'view-proposal',
  templateUrl: './proposal.component.html',
  styleUrls: ['./proposal.component.css'],
})
export class ProposalComponent implements OnInit {
  @Input()
  proposal?: InlineResponse20027Proposals | null;
  @Input()
  proposalType?: string | null;
  @Input()
  deposits?: InlineResponse20029Deposits[] | null;
  @Input()
  depositParams?: InlineResponse20026DepositParams | null;
  @Input()
  tally?: InlineResponse20027FinalTallyResult | null;
  @Input()
  tallyParams?: InlineResponse20026TallyParams | null;
  @Input()
  votes?: InlineResponse20032Votes[] | null;
  @Input()
  votingParams?: InlineResponse20026VotingParams | null;

  constructor() { }

  ngOnInit(): void { }

  unpackContent(value: any) {
    try {
      return cosmosclient.codec.protoJSONToInstance(value) as ProposalContent;
    } catch {
      return null;
    }
  }

  toNumber(str: string) {
    return Number(str);
  }
}
