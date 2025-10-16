import { useMemo } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { PROGRAM_ID } from '../utils/constants';
import idl from '../idl.json';

export function useProgram() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const provider = useMemo(() => {
    if (!wallet) return null;
    return new AnchorProvider(
      connection,
      wallet,
      { commitment: 'confirmed' }
    );
  }, [connection, wallet]);

  const program = useMemo(() => {
    if (!provider) return null;

    try {
      return new Program(idl, PROGRAM_ID, provider);
    } catch (err) {
      console.error('프로그램 초기화 실패:', err);
      return null;
    }
  }, [provider]);

  return { program, provider, wallet };
}