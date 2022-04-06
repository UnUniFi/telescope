import { WalletGuard } from '../../../models/wallets/wallet.guard';
import { BankComponent } from './bank.component';
import { SendComponent } from './send/send.component';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', component: BankComponent },
  { path: 'send', component: SendComponent, canActivate: [WalletGuard] },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BankRoutingModule {}
