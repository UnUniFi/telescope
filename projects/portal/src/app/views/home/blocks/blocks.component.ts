import { Component, Input, OnInit } from '@angular/core';
import { InlineResponse20011 } from '@cosmos-client/core/esm/openapi';

@Component({
  selector: 'view-blocks',
  templateUrl: './blocks.component.html',
  styleUrls: ['./blocks.component.css'],
})
export class BlocksComponent implements OnInit {
  @Input()
  //latestBlocks?: InlineResponse20011[] | null | undefined;
  latestBlocks?: bigint[] | null | undefined;

  constructor() {}

  ngOnInit(): void {}
}
