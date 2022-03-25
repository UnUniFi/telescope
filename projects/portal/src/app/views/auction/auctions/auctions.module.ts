import { MaterialModule } from '../../material.module';
import { AuctionsComponent } from './auctions.component';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule } from '@angular/material/paginator';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [AuctionsComponent],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MaterialModule,
    MatPaginatorModule,
    MatChipsModule,
  ],
  exports: [AuctionsComponent],
})
export class AuctionsModule {}
