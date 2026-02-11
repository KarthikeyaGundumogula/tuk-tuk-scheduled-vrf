pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use instructions::*;
pub use state::*;

declare_id!("CHgyiwT8WLErryk6TEQZw98Q47k13CsZo89N2QuJTzxL");

#[program]
pub mod er_vrf {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        ctx.accounts.handler(ctx.bumps)
    }

    pub fn send_vrf_req(ctx: Context<SendVrfReq>, client_seed: u8) -> Result<()> {
        ctx.accounts.send_req(client_seed)?;
        Ok(())
    }

    pub fn callback_vrf(ctx: Context<CallbackVrf>, randomness: [u8; 32]) -> Result<()> {
        ctx.accounts.callback(randomness)?;
        Ok(())
    }
}

