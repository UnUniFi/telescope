import { Clipboard } from '@angular/cdk/clipboard';
import { Component, Input, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { unitInfo } from 'projects/portal/src/app/pages/incentive/units/unit/unit.component';
import { IncentiveUnit200ResponseIncentiveUnit } from 'ununifi-client/esm/openapi';

@Component({
  selector: 'view-unit',
  templateUrl: './unit.component.html',
  styleUrls: ['./unit.component.css'],
})
export class UnitComponent implements OnInit {
  @Input()
  unitId?: string | null;
  @Input()
  unit?: IncentiveUnit200ResponseIncentiveUnit | null;
  constructor(private clipboard: Clipboard, private readonly snackBar: MatSnackBar) {}

  ngOnInit(): void {}

  copyClipboard(value: string) {
    if (value.length > 0) {
      this.clipboard.copy(value);
      this.snackBar.open('Copied to clipboard', undefined, {
        duration: 3000,
      });
    }

    return false;
  }
}
