use anchor_lang::prelude::*;

use crate::UserAccount;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        init,
        payer= user,
        space = UserAccount::INIT_SPACE,
        seeds = [b"user-acc",user.key().as_ref()],
        bump
    )]
    pub user_account: Account<'info, UserAccount>,
    pub system_program: Program<'info, System>,
}
impl<'info> Initialize<'info> {
    pub fn handler(self: &mut Self, bumps: InitializeBumps) -> Result<()> {
        self.user_account.set_inner(UserAccount {
            user: *self.user.key,
            data: 0,
            bump: bumps.user_account,
        });
        msg!("User Account is Initialized");
        Ok(())
    }
}
