#![allow(deprecated)]
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use instructions::*;
pub use state::*;

declare_id!("hS5bMz3KJtAfN5fHsXn8HGsNt64diPwPzCeyHLbo8jZ");

#[program]
pub mod tuk_tuk_scheduled_vrf {
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

    pub fn schedule(ctx: Context<Schedule>, task_id: u16, client_seed: u8) -> Result<()> {
        ctx.accounts.schedule(task_id, ctx.bumps, client_seed)?;
        Ok(())
    }
}
