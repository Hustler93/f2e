use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, MintTo};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod gym_chain {
    use super::*;

    pub fn initialize_user(
        ctx: Context<InitializeUser>,
        username: String,
        default_rest_time: u16,
    ) -> Result<()> {
        let user_profile = &mut ctx.accounts.user_profile;
        user_profile.owner = ctx.accounts.user.key();
        user_profile.username = username;
        user_profile.total_sessions = 0;
        user_profile.total_sets = 0;
        user_profile.total_volume = 0;
        user_profile.default_rest_time = default_rest_time;
        user_profile.created_at = Clock::get()?.unix_timestamp;
        Ok(())
    }

    pub fn start_session(ctx: Context<StartSession>) -> Result<()> {
        let session = &mut ctx.accounts.session;
        let user_profile = &mut ctx.accounts.user_profile;
        
        session.owner = ctx.accounts.user.key();
        session.date = Clock::get()?.unix_timestamp;
        session.total_sets = 0;
        session.total_volume = 0;
        session.is_completed = false;
        session.completed_at = 0;

        user_profile.total_sessions += 1;

        Ok(())
    }

    pub fn add_set(
        ctx: Context<AddSet>,
        exercise_name: String,
        weight_kg: u32,
        reps: u16,
        duration_seconds: u16,
    ) -> Result<()> {
        // 먼저 key들을 복사 (borrow 충돌 방지)
        let session_key = ctx.accounts.session.key();
        let user_key = ctx.accounts.user.key();
        
        let exercise_set = &mut ctx.accounts.exercise_set;
        let session = &mut ctx.accounts.session;
        let user_profile = &mut ctx.accounts.user_profile;

        exercise_set.owner = user_key;
        exercise_set.session = session_key;
        exercise_set.exercise_name = exercise_name;
        exercise_set.weight_kg = weight_kg;
        exercise_set.reps = reps;
        exercise_set.duration_seconds = duration_seconds;
        exercise_set.completed_at = Clock::get()?.unix_timestamp;

        let volume = (weight_kg as u64) * (reps as u64);
        exercise_set.volume = volume;

        session.total_sets += 1;
        session.total_volume += volume;
        user_profile.total_sets += 1;
        user_profile.total_volume += volume;

        Ok(())
    }

    pub fn complete_session(ctx: Context<CompleteSession>) -> Result<()> {
        let session = &mut ctx.accounts.session;
        
        require!(!session.is_completed, ErrorCode::SessionAlreadyCompleted);
        
        session.is_completed = true;
        session.completed_at = Clock::get()?.unix_timestamp;

        Ok(())
    }
}

#[account]
pub struct UserProfile {
    pub owner: Pubkey,
    pub username: String,
    pub total_sessions: u64,
    pub total_sets: u64,
    pub total_volume: u64,
    pub default_rest_time: u16,
    pub created_at: i64,
}

#[account]
pub struct WorkoutSession {
    pub owner: Pubkey,
    pub date: i64,
    pub total_sets: u32,
    pub total_volume: u64,
    pub is_completed: bool,
    pub completed_at: i64,
}

#[account]
pub struct ExerciseSet {
    pub owner: Pubkey,
    pub session: Pubkey,
    pub exercise_name: String,
    pub weight_kg: u32,
    pub reps: u16,
    pub duration_seconds: u16,
    pub volume: u64,
    pub completed_at: i64,
}

#[derive(Accounts)]
pub struct InitializeUser<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 32 + 36 + 8 + 8 + 8 + 2 + 8,
        seeds = [b"user-profile", user.key().as_ref()],
        bump
    )]
    pub user_profile: Account<'info, UserProfile>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct StartSession<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 32 + 8 + 4 + 8 + 1 + 8
    )]
    pub session: Account<'info, WorkoutSession>,
    #[account(
        mut,
        seeds = [b"user-profile", user.key().as_ref()],
        bump
    )]
    pub user_profile: Account<'info, UserProfile>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddSet<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 32 + 32 + 54 + 4 + 2 + 2 + 8 + 8
    )]
    pub exercise_set: Account<'info, ExerciseSet>,
    #[account(
        mut,
        has_one = owner
    )]
    pub session: Account<'info, WorkoutSession>,
    #[account(
        mut,
        seeds = [b"user-profile", user.key().as_ref()],
        bump
    )]
    pub user_profile: Account<'info, UserProfile>,
    pub owner: Signer<'info>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CompleteSession<'info> {
    #[account(
        mut,
        has_one = owner
    )]
    pub session: Account<'info, WorkoutSession>,
    pub owner: Signer<'info>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("이미 완료된 세션입니다")]
    SessionAlreadyCompleted,
}