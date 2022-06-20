import { StoredWallet } from '../wallet.model';
import { MetaMaskInfrastructureService } from './metamask.infrastructure.service';
import { Injectable } from '@angular/core';
import { cosmosclient, proto } from '@cosmos-client/core';

export interface IMetaMaskInfrastructureService {
  connectWallet: () => Promise<StoredWallet | null | undefined>;
  signTx: (
    txBuilder: cosmosclient.TxBuilder,
    signerBaseAccount: proto.cosmos.auth.v1beta1.BaseAccount,
  ) => Promise<cosmosclient.TxBuilder>;
}

@Injectable({
  providedIn: 'root',
})
export class MetaMaskService {
  private readonly iMetaMaskInfrastructureService: IMetaMaskInfrastructureService;

  constructor(readonly metaMaskInfrastructureService: MetaMaskInfrastructureService) {
    this.iMetaMaskInfrastructureService = this.metaMaskInfrastructureService;
  }

  async connectWallet(): Promise<StoredWallet | null | undefined> {
    return await this.iMetaMaskInfrastructureService.connectWallet();
  }

  async signTx(
    txBuilder: cosmosclient.TxBuilder,
    signerBaseAccount: proto.cosmos.auth.v1beta1.BaseAccount,
  ): Promise<cosmosclient.TxBuilder> {
    return await this.iMetaMaskInfrastructureService.signTx(txBuilder, signerBaseAccount);
  }
}
