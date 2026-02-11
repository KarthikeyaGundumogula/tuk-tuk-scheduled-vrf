pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("CHgyiwT8WLErryk6TEQZw98Q47k13CsZo89N2QuJTzxL");

#[program]
pub mod tuk_tuk_scheduled_vrf {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        initialize::handler(ctx)
    }
}
