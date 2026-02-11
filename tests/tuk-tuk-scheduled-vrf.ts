import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TukTukScheduledVrf } from "../target/types/tuk_tuk_scheduled_vrf";

describe("tuk-tuk-scheduled-vrf", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.tukTukScheduledVrf as Program<TukTukScheduledVrf>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });
});
