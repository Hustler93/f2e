import { useState, useCallback } from 'react';
import { PublicKey, Keypair, SystemProgram } from '@solana/web3.js';
import { useProgram } from './useProgram';
import { DEFAULT_REST_TIME } from '../utils/constants';

export function useWorkout() {
  const { program, wallet } = useProgram();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const initializeUser = useCallback(async (username) => {
    if (!program || !wallet.publicKey) {
      throw new Error('지갑을 먼저 연결해주세요');
    }

    setLoading(true);
    setError(null);

    try {
      const [userProfilePda] = await PublicKey.findProgramAddress(
        [
          Buffer.from('user-profile'),
          wallet.publicKey.toBuffer()
        ],
        program.programId
      );

      const tx = await program.methods
        .initializeUser(username, DEFAULT_REST_TIME)
        .accounts({
          userProfile: userProfilePda,
          user: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('✅ 사용자 프로필 생성 완료:', tx);
      return { userProfilePda, tx };

    } catch (err) {
      console.error('프로필 초기화 실패:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [program, wallet]);

  const getUserProfile = useCallback(async () => {
    if (!program || !wallet.publicKey) return null;

    try {
      const [userProfilePda] = await PublicKey.findProgramAddress(
        [
          Buffer.from('user-profile'),
          wallet.publicKey.toBuffer()
        ],
        program.programId
      );

      const profile = await program.account.userProfile.fetch(userProfilePda);
      return profile;

    } catch (err) {
      if (err.message.includes('Account does not exist')) {
        return null;
      }
      console.error('프로필 가져오기 실패:', err);
      return null;
    }
  }, [program, wallet]);

  const startSession = useCallback(async () => {
    if (!program || !wallet.publicKey) {
      throw new Error('지갑을 먼저 연결해주세요');
    }

    setLoading(true);
    setError(null);

    try {
      const sessionKeypair = Keypair.generate();

      const [userProfilePda] = await PublicKey.findProgramAddress(
        [
          Buffer.from('user-profile'),
          wallet.publicKey.toBuffer()
        ],
        program.programId
      );

      const tx = await program.methods
        .startSession()
        .accounts({
          session: sessionKeypair.publicKey,
          userProfile: userProfilePda,
          user: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([sessionKeypair])
        .rpc();

      console.log('✅ 세션 시작:', tx);
      return { sessionPubkey: sessionKeypair.publicKey, tx };

    } catch (err) {
      console.error('세션 시작 실패:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [program, wallet]);

  const addSet = useCallback(async (
    sessionPubkey,
    exerciseName,
    weightKg,
    reps,
    durationSeconds
  ) => {
    if (!program || !wallet.publicKey) {
      throw new Error('지갑을 먼저 연결해주세요');
    }

    setLoading(true);
    setError(null);

    try {
      const setKeypair = Keypair.generate();

      const [userProfilePda] = await PublicKey.findProgramAddress(
        [
          Buffer.from('user-profile'),
          wallet.publicKey.toBuffer()
        ],
        program.programId
      );

      const tx = await program.methods
        .addSet(exerciseName, weightKg, reps, durationSeconds)
        .accounts({
          exerciseSet: setKeypair.publicKey,
          session: sessionPubkey,
          userProfile: userProfilePda,
          owner: wallet.publicKey,
          user: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([setKeypair])
        .rpc();

      console.log('✅ 세트 추가:', tx);
      return { setPubkey: setKeypair.publicKey, tx };

    } catch (err) {
      console.error('세트 추가 실패:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [program, wallet]);

  const completeSession = useCallback(async (sessionPubkey) => {
    if (!program || !wallet.publicKey) {
      throw new Error('지갑을 먼저 연결해주세요');
    }

    setLoading(true);
    setError(null);

    try {
      const tx = await program.methods
        .completeSession()
        .accounts({
          session: sessionPubkey,
          owner: wallet.publicKey,
        })
        .rpc();

      console.log('✅ 세션 완료:', tx);
      return tx;

    } catch (err) {
      console.error('세션 완료 실패:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [program, wallet]);

  return {
    initializeUser,
    getUserProfile,
    startSession,
    addSet,
    completeSession,
    loading,
    error,
  };
}