import { MaterialModule } from '../../../../material.module';
import { LenderNftComponent } from './lender-nft.component';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [LenderNftComponent],
  imports: [CommonModule, RouterModule, FormsModule, MaterialModule],
  exports: [LenderNftComponent],
})
export class LenderNftModule {}