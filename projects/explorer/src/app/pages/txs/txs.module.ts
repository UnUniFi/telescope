import { TxModule } from '../../views/txs/tx/tx.module';
import { TxComponent } from './tx/tx.component';
import { TxsRoutingModule } from './txs-routing.module';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TxsComponent } from './txs.component';
import { TxsModule } from '../../views/txs/txs.module';
import { TxCommonModule } from '../../views/txs/tx/tx-common/tx-common.module';


@NgModule({
  declarations: [TxComponent, TxsComponent],
  imports: [CommonModule, TxsRoutingModule, TxsModule, TxModule, TxCommonModule],
})
export class AppTxsModule { }
