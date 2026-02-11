use anchor_lang::prelude::*;

use ephemeral_vrf_sdk::anchor::vrf;
use ephemeral_vrf_sdk::instructions::{create_request_randomness_ix, RequestRandomnessParams};
use ephemeral_vrf_sdk::types::SerializableAccountMeta;

use crate::instruction::CallbackVrf;
use crate::{UserAccount, ID};

#[vrf]
#[derive(Accounts)]
pub struct SendVrfReq<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(seeds = [b"user-acc", user.key().as_ref()], bump = user_acc.bump)]
    pub user_acc: Account<'info, UserAccount>,
    /// CHECK: The oracle queue
    #[account(mut, address = ephemeral_vrf_sdk::consts::DEFAULT_QUEUE)]
    pub oracle_queue: AccountInfo<'info>,
}

impl<'info> SendVrfReq<'info> {
    pub fn send_req(self: &mut Self, client_seed: u8) -> Result<()> {
        let ix = create_request_randomness_ix(RequestRandomnessParams {
            payer: *self.user.key,
            oracle_queue: *self.oracle_queue.key,
            callback_program_id: ID,
            callback_discriminator: CallbackVrf::DISCRIMINATOR.to_vec(),
            caller_seed: [client_seed; 32],
            accounts_metas: Some(vec![SerializableAccountMeta {
                pubkey: self.user_acc.key(),
                is_signer: false,
                is_writable: true,
            }]),
            ..Default::default()
        });
        self.invoke_signed_vrf(&self.user.to_account_info(), &ix)?;
        Ok(())
    }
}
