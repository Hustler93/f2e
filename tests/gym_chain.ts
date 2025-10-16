import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { GymChain } from "../target/types/gym_chain";
import { assert } from "chai";

describe("gym_chain", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.GymChain as Program<GymChain>;
  
  let userProfilePda: anchor.web3.PublicKey;
  let sessionKeypair: anchor.web3.Keypair;

  it("사용자 프로필 초기화", async () => {
    [userProfilePda] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("user-profile"),
        provider.wallet.publicKey.toBuffer()
      ],
      program.programId
    );

    await program.methods
      .initializeUser("TestUser", 90)
      .accounts({
        userProfile: userProfilePda,
        user: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const userProfile = await program.account.userProfile.fetch(userProfilePda);
    assert.equal(userProfile.username, "TestUser");
    console.log("✅ 사용자 프로필 생성 완료");
  });

  it("운동 세션 시작", async () => {
    sessionKeypair = anchor.web3.Keypair.generate();

    await program.methods
      .startSession()
      .accounts({
        session: sessionKeypair.publicKey,
        userProfile: userProfilePda,
        user: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([sessionKeypair])
      .rpc();

    console.log("✅ 세션 시작 완료");
  });

  it("운동 세트 추가", async () => {
    const setKeypair = anchor.web3.Keypair.generate();

    await program.methods
      .addSet("스쿼트", 20, 10, 45)
      .accounts({
        exerciseSet: setKeypair.publicKey,
        session: sessionKeypair.publicKey,
        userProfile: userProfilePda,
        owner: provider.wallet.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([setKeypair])
      .rpc();

    console.log("✅ 세트 추가 완료");
  });
});