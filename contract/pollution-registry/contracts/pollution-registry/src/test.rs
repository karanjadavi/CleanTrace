#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Bytes, Env, String};

#[test]
fn test_submit_and_get_readings() {
    let env = Env::default();
    let contract_id = env.register(PollutionRegistry, ());
    let client = PollutionRegistryClient::new(&env, &contract_id);

    client.submit_reading(
        &String::from_str(&env, "Accra"),
        &45,
        &String::from_str(&env, "OpenAQ"),
    );

    let readings = client.get_readings();
    assert_eq!(readings.len(), 1);
    assert_eq!(readings.get(0).unwrap().pm25, 45);
}

#[test]
fn test_submit_citizen_report() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(PollutionRegistry, ());
    let client = PollutionRegistryClient::new(&env, &contract_id);
    let reporter = Address::generate(&env);

    client.submit_citizen_report(
        &reporter,
        &String::from_str(&env, "Kumasi"),
        &Bytes::from_array(&env, &[1, 2, 3, 4]),
        &String::from_str(&env, "illegal_dumping"),
    );

    let reports = client.get_reports();
    assert_eq!(reports.len(), 1);
    assert_eq!(reports.get(0).unwrap().category, String::from_str(&env, "illegal_dumping"));
}

#[test]
fn test_alert_threshold() {
    let env = Env::default();
    let contract_id = env.register(PollutionRegistry, ());
    let client = PollutionRegistryClient::new(&env, &contract_id);

    client.submit_reading(
        &String::from_str(&env, "Tema"),
        &200,
        &String::from_str(&env, "sensor-1"),
    );

    let readings = client.get_readings();
    assert_eq!(readings.get(0).unwrap().pm25, 200);
}