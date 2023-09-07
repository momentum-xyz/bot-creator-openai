import { useEffect } from 'react';
import { initializeConnector } from '@web3-react/core';
import { MetaMask } from '@web3-react/metamask';

export const [metaMask, hooks] = initializeConnector<MetaMask>(
  (actions) => new MetaMask({ actions })
);
const {
  useChainId,
  useAccounts,
  useIsActivating,
  useIsActive,
  useProvider,
  useENSNames,
} = hooks;

export const useWallet = () => {
  const chainId = useChainId();
  const accounts = useAccounts();
  const isActivating = useIsActivating();

  const isActive = useIsActive();

  const provider = useProvider();
  const ENSNames = useENSNames(provider);

  console.log('MetaMask useWallet', {
    chainId,
    accounts,
    isActivating,
    isActive,
    provider,
    ENSNames,
  });

  return {
    account: accounts?.[0],
    accountHex: accounts?.[0],
    isInstalled: true,
    web3Library: provider,
    chainId,
    activate: metaMask.activate,
    isActive,
    connect: () => metaMask.activate(),
    signChallenge: async (challenge: string) => {
      console.log('useWallet connect', challenge);
      return provider?.send('personal_sign', [challenge, accounts?.[0]]);
    },
  };
};
