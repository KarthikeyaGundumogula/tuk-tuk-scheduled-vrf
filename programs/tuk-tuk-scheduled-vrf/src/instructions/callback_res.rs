use crate::UserAccount;
use anchor_lang::prelude::*;
use ephemeral_vrf_sdk;

#[derive(Accounts)]
pub struct CallbackVrf<'info> {
    #[account(address = ephemeral_vrf_sdk::consts::VRF_PROGRAM_IDENTITY)]
    pub vrf_program_identity: Signer<'info>,
    #[account(mut)]
    pub user_acc: Account<'info, UserAccount>,
}

impl<'info> CallbackVrf<'info> {
    // Consume Randomness
    pub fn callback(self: &mut Self, randomness: [u8; 32]) -> Result<()> {
        let rnd_u8 = ephemeral_vrf_sdk::rnd::random_u8_with_range(&randomness, 1, 6);
        msg!("Consuming random number: {:?}", rnd_u8);
        let user = &mut self.user_acc;
        user.data = rnd_u8 as u64;
        Ok(())
    }
}
