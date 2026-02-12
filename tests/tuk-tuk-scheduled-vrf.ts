import * as anchor from "@coral-xyz/anchor";
import { Program,web3 } from "@coral-xyz/anchor";
import { TukTukScheduledVrf } from "../target/types/tuk_tuk_scheduled_vrf";

describe("tuk-tuk-scheduled-vrf", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.tukTukScheduledVrf as Program<TukTukScheduledVrf>;

  xit("Initialized user!", async () => {
    const tx = await program.methods.initialize().rpc({ skipPreflight: true });
    console.log("Your transaction signature", tx);
  });

  it("Send request", async () => {
    const tx = await program.methods.sendVrfReq(0).rpc({ skipPreflight: true });
    console.log("Your transaction signature", tx);
    const user_acc = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("user-acc"), anchor.getProvider().publicKey.toBytes()],
      program.programId,
    )[0];
    let user_account = await program.account.userAccount.fetch(user_acc, "processed");
    console.log("user accout: ", user_acc.toBase58());
    console.log("user_account: ", user_account);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    user_account = await program.account.userAccount.fetch(user_acc, "processed");
    console.log("user_account: ", user_account);
  });
});
