import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TxComponent } from './tx/tx.component';

@NgModule({
  declarations: [TxComponent],
  imports: [CommonModule],
  exports: [TxComponent],
})
export class TxsViewModule {}
