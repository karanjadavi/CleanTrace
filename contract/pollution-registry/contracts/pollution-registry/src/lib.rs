#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Bytes, Env, String, Symbol, Vec};

#[contracttype]
#[derive(Clone)]
pub struct Reading {
    pub location: String,
    pub pm25: u32,
    pub source: String,
    pub timestamp: u64,
}

#[contracttype]
#[derive(Clone)]
pub struct CitizenReport {
    pub location: String,
    pub report_hash: Bytes,
    pub category: String,
    pub reporter: Address,
    pub timestamp: u64,
}

const READINGS: Symbol = symbol_short!("READINGS");
const REPORTS: Symbol = symbol_short!("REPORTS");
const ALERT_THRESHOLD: u32 = 150; // PM2.5 unhealthy threshold

#[contract]
pub struct PollutionRegistry;

#[contractimpl]
impl PollutionRegistry {
    pub fn submit_reading(env: Env, location: String, pm25: u32, source: String) {
        let reading = Reading {
            location: location.clone(),
            pm25,
            source,
            timestamp: env.ledger().timestamp(),
        };

        let mut readings: Vec<Reading> = env
            .storage()
            .persistent()
            .get(&READINGS)
            .unwrap_or(Vec::new(&env));

        readings.push_back(reading);
        env.storage().persistent().set(&READINGS, &readings);

        if pm25 > ALERT_THRESHOLD {
            env.events().publish((symbol_short!("ALERT"),), location);
        }
    }

    pub fn submit_citizen_report(
        env: Env,
        reporter: Address,
        location: String,
        report_hash: Bytes,
        category: String,
    ) {
        reporter.require_auth();

        let report = CitizenReport {
            location,
            report_hash,
            category,
            reporter,
            timestamp: env.ledger().timestamp(),
        };

        let mut reports: Vec<CitizenReport> = env
            .storage()
            .persistent()
            .get(&REPORTS)
            .unwrap_or(Vec::new(&env));

        reports.push_back(report);
        env.storage().persistent().set(&REPORTS, &reports);
    }

    pub fn get_readings(env: Env) -> Vec<Reading> {
        env.storage()
            .persistent()
            .get(&READINGS)
            .unwrap_or(Vec::new(&env))
    }

    pub fn get_reports(env: Env) -> Vec<CitizenReport> {
        env.storage()
            .persistent()
            .get(&REPORTS)
            .unwrap_or(Vec::new(&env))
    }
}

mod test;