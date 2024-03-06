import { DenomOnChain } from '../../pages/yieldaggregator/vaults/vault/vault.component';
import { Config, StrategyInfo } from '../config.service';
import { getDenomExponent } from '../cosmos/bank.model';
import { BankQueryService } from '../cosmos/bank.query.service';
import { BankService } from '../cosmos/bank.service';
import { TxCommonService } from '../cosmos/tx-common.service';
import { OsmosisPoolAPRs } from './osmosis/osmosis-pool.model';
import { OsmosisPoolService } from './osmosis/osmosis-pool.service';
import { VaultInfo } from './yield-aggregator.model';
import { Injectable } from '@angular/core';
import cosmosclient from '@cosmos-client/core';
import Long from 'long';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import ununificlient from 'ununifi-client';
import { Vault200Response } from 'ununifi-client/esm/openapi';

@Injectable({
  providedIn: 'root',
})
export class YieldAggregatorService {
  constructor(
    private readonly bankService: BankService,
    private readonly bankQueryService: BankQueryService,
    private readonly txCommonService: TxCommonService,
    private readonly osmosisPoolService: OsmosisPoolService,
  ) {}

  buildMsgDepositToVault(
    senderAddress: string,
    vaultId: string,
    denom: string,
    readableAmount: number,
  ) {
    const coin = this.bankService.convertDenomReadableAmountMapToCoins({
      [denom]: readableAmount,
    })[0];
    const msg = new ununificlient.proto.ununifi.yieldaggregator.MsgDepositToVault({
      sender: senderAddress,
      vault_id: Long.fromString(vaultId),
      amount: coin,
    });

    return msg;
  }

  buildMsgWithdrawFromVault(
    senderAddress: string,
    vaultId: string,
    denom: string,
    readableAmount: number,
  ) {
    const coin = this.bankService.convertDenomReadableAmountMapToCoins({
      [denom]: readableAmount,
    })[0];
    const msg = new ununificlient.proto.ununifi.yieldaggregator.MsgWithdrawFromVault({
      sender: senderAddress,
      vault_id: Long.fromString(vaultId),
      lp_token_amount: coin.amount,
    });

    return msg;
  }

  buildMsgWithdrawFromVaultWithUnbondingTime(
    senderAddress: string,
    vaultId: string,
    denom: string,
    readableAmount: number,
  ) {
    const coin = this.bankService.convertDenomReadableAmountMapToCoins({
      [denom]: readableAmount,
    })[0];
    const msg =
      new ununificlient.proto.ununifi.yieldaggregator.MsgWithdrawFromVaultWithUnbondingTime({
        sender: senderAddress,
        vault_id: Long.fromString(vaultId),
        lp_token_amount: coin.amount,
      });

    return msg;
  }

  buildMsgCreateVault(
    senderAddress: string,
    symbol: string,
    name: string,
    description: string,
    strategies: { denom: string; id: string; weight: number }[],
    commissionRate: number,
    reserveRate: number,
    fee: cosmosclient.proto.cosmos.base.v1beta1.ICoin,
    deposit: cosmosclient.proto.cosmos.base.v1beta1.ICoin,
    feeCollectorAddress: string,
  ) {
    const strategyWeights = strategies.map((strategy) => {
      return {
        denom: strategy.denom,
        strategy_id: Long.fromString(strategy.id),
        weight: this.txCommonService.numberToDecString(strategy.weight / 100),
      };
    });
    const decCommission = this.txCommonService.numberToDecString(commissionRate / 100);
    const decReserve = this.txCommonService.numberToDecString(reserveRate / 100);
    const msg = new ununificlient.proto.ununifi.yieldaggregator.MsgCreateVault({
      sender: senderAddress,
      symbol: symbol,
      name: name,
      description: description,
      commission_rate: decCommission,
      withdraw_reserve_rate: decReserve,
      strategy_weights: strategyWeights,
      fee,
      deposit,
      fee_collector_address: feeCollectorAddress,
    });
    return msg;
  }

  buildMsgDeleteVault(senderAddress: string, vaultId: string) {
    const msg = new ununificlient.proto.ununifi.yieldaggregator.MsgDeleteVault({
      sender: senderAddress,
      vault_id: Long.fromString(vaultId),
    });

    return msg;
  }

  buildMsgTransferVaultOwnership(senderAddress: string, vaultId: string, recipientAddress: string) {
    const msg = new ununificlient.proto.ununifi.yieldaggregator.MsgTransferVaultOwnership({
      sender: senderAddress,
      vault_id: Long.fromString(vaultId),
      recipient: recipientAddress,
    });

    return msg;
  }

  estimateMintAmount$(
    vault: Vault200Response,
    mintAmount: number,
  ): Observable<cosmosclient.proto.cosmos.base.v1beta1.ICoin> {
    const lpDenom = 'yieldaggregator/vaults/' + vault?.vault?.id;
    const exponent = getDenomExponent(vault.vault?.symbol);
    const mintDenomAmount = mintAmount * Math.pow(10, exponent);
    const totalAmountInVault =
      Number(vault.total_bonded_amount) +
      Number(vault.total_unbonding_amount) +
      Number(vault.withdraw_reserve);
    const supplyLp$ = this.bankQueryService.getSupply$(lpDenom);
    return supplyLp$.pipe(
      map((supplyLp) => {
        if (!totalAmountInVault || !supplyLp || !supplyLp.amount || !parseInt(supplyLp.amount)) {
          return { denom: lpDenom, amount: mintDenomAmount.toString() };
        }
        // lpAmount = lpSupply * (principalAmountToMint / principalAmountInVault)
        const mintLp = (mintDenomAmount * parseInt(supplyLp.amount)) / totalAmountInVault;
        return { denom: lpDenom, amount: mintLp.toString() };
      }),
    );
  }

  estimateRedeemAmount$(
    vault: Vault200Response,
    burnAmount: number,
  ): Observable<cosmosclient.proto.cosmos.base.v1beta1.ICoin> {
    const denom = vault.vault?.symbol;
    const lpDenom = 'yieldaggregator/vaults/' + vault?.vault?.id;
    const exponent = getDenomExponent(lpDenom);
    const burnDenomAmount = burnAmount * Math.pow(10, exponent);
    const totalAmountInVault =
      Number(vault.total_bonded_amount) +
      Number(vault.total_unbonding_amount) +
      Number(vault.withdraw_reserve);
    const supplyLp$ = this.bankQueryService.getSupply$(lpDenom);
    return supplyLp$.pipe(
      map((supplyLp) => {
        if (!totalAmountInVault || !supplyLp || !supplyLp.amount || !parseInt(supplyLp.amount)) {
          return { denom: denom, amount: '0' };
        }
        // principalAmount = principalAmountInVault * (lpAmountToBurn / lpSupply)
        const redeemAmount = (burnDenomAmount * totalAmountInVault) / parseInt(supplyLp.amount);
        return { denom: denom, amount: redeemAmount.toString() };
      }),
    );
  }

  async getStrategyAPR(strategyInfo?: StrategyInfo): Promise<OsmosisPoolAPRs> {
    if (!strategyInfo) {
      return { totalAPR: 0 };
    }
    if (strategyInfo.poolInfo) {
      if (strategyInfo.poolInfo.type === 'osmosis') {
        if (strategyInfo.poolInfo.apr) {
          console.log('strategyInfo.poolInfo.apr', strategyInfo.poolInfo.apr);

          return { totalAPR: strategyInfo.poolInfo.apr };
        }
        const apr = await this.osmosisPoolService.getPoolAPR(strategyInfo.poolInfo.poolId);
        return apr;
      }
    }
    return { totalAPR: strategyInfo.minApy };
  }

  async getStrategySuperfluidAPR(strategyInfo?: StrategyInfo): Promise<number | undefined> {
    if (!strategyInfo) {
      return;
    }
    if (strategyInfo.poolInfo) {
      if (strategyInfo.poolInfo.type === 'osmosis') {
        return this.osmosisPoolService.getSuperfluidAPR(strategyInfo.poolInfo.poolId);
      }
    }
    return;
  }

  async calcVaultAPY(vault: Vault200Response, config: Config): Promise<VaultInfo> {
    if (!vault.vault?.strategy_weights) {
      return {
        id: vault.vault?.id || '',
        minApy: 0,
        certainty: false,
        poolInfos: [],
      };
    }
    let vaultAPY = 0;
    let vaultAPYCertainty = false;
    let poolInfos: (StrategyInfo & { weight?: string })[] = [];

    for (const strategyWeight of vault.vault.strategy_weights) {
      const strategyInfo = config?.strategiesInfo?.find(
        (strategyInfo) =>
          strategyInfo.id === strategyWeight.strategy_id &&
          strategyInfo.denom === strategyWeight.denom,
      );
      if (!strategyInfo || !strategyInfo.poolInfo) {
        continue;
      }
      const poolInfo = strategyInfo.poolInfo;
      if (poolInfo.type === 'osmosis') {
        poolInfos.push({ ...strategyInfo, weight: strategyWeight.weight });
        if (poolInfo.apr) {
          vaultAPY += poolInfo.apr * Number(strategyWeight.weight);
          continue;
        }
        const poolAPRs = await this.osmosisPoolService.getPoolAPR(poolInfo.poolId);
        vaultAPY += poolAPRs.totalAPR * Number(strategyWeight.weight);
      }
    }

    return {
      id: vault.vault?.id || '',
      symbol: vault.vault?.symbol,
      name: vault.vault?.name,
      description: vault.vault?.description,
      minApy: vaultAPY,
      maxApy: vaultAPY,
      certainty: vaultAPYCertainty,
      poolInfos,
    };
  }

  addOtherChainsTokens(denoms: DenomOnChain[], symbol: string): DenomOnChain[] {
    if (symbol === 'ATOM') {
      denoms.push({
        denom: 'uatom',
        symbol: 'ATOM',
        chain: 'Cosmos',
        chainImg:
          'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/svg/color/atom.svg',
        ibc: true,
      });
    }
    if (symbol === 'OSMO') {
      denoms.push({
        denom: 'uosmo',
        symbol: 'OSMO',
        chain: 'Osmosis',
        chainImg: 'assets/osmosis-logo.svg',
        ibc: true,
      });
    }
    return denoms;
  }
}
