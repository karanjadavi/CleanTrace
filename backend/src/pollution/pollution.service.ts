import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Keypair,
  Contract,
  rpc,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  nativeToScVal,
  scValToNative,
} from '@stellar/stellar-sdk';
import axios from 'axios';

const RPC_URL = 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = Networks.TESTNET;

// Maps a friendly city key to a known OpenAQ v3 PM2.5 sensor ID
const CITY_SENSOR_MAP: Record<string, number> = {
  accra: 10330993, // Kwame Nkrumah Circle, Accra (Breathe Accra / Clarity)
};

function convertBigInts(obj: any): any {
  if (typeof obj === 'bigint') return Number(obj);
  if (Array.isArray(obj)) return obj.map(convertBigInts);
  if (obj !== null && typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      result[key] = convertBigInts(obj[key]);
    }
    return result;
  }
  return obj;
}

@Injectable()
export class PollutionService {
  private server = new rpc.Server(RPC_URL);
  private contract: Contract;
  private deployerSecret: string;
  private openaqApiKey: string;

  constructor(private config: ConfigService) {
    const contractId = this.config.get<string>('CONTRACT_ID');
    this.deployerSecret = this.config.get<string>('DEPLOYER_SECRET')!;
    this.openaqApiKey = this.config.get<string>('OPENAQ_API_KEY')!;
    this.contract = new Contract(contractId!);
  }

  private async submitTx(fnName: string, args: any[]) {
    const keypair = Keypair.fromSecret(this.deployerSecret);
    const account = await this.server.getAccount(keypair.publicKey());

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(this.contract.call(fnName, ...args))
      .setTimeout(100)
      .build();

    const prepared = await this.server.prepareTransaction(tx);
    prepared.sign(keypair);

    const result = await this.server.sendTransaction(prepared);
    return result;
  }

  private async readContract(fnName: string, args: any[] = []) {
    const keypair = Keypair.fromSecret(this.deployerSecret);
    const account = await this.server.getAccount(keypair.publicKey());

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(this.contract.call(fnName, ...args))
      .setTimeout(100)
      .build();

    const sim = await this.server.simulateTransaction(tx);
    if (rpc.Api.isSimulationSuccess(sim)) {
      return scValToNative(sim.result!.retval);
    }
    throw new Error('Simulation failed');
  }

  async submitReading(location: string, pm25: number, source: string) {
    return this.submitTx('submit_reading', [
      nativeToScVal(location, { type: 'string' }),
      nativeToScVal(pm25, { type: 'u32' }),
      nativeToScVal(source, { type: 'string' }),
    ]);
  }

  async getReadings() {
    const result = await this.readContract('get_readings');
    return convertBigInts(result);
  }

  async getReports() {
    const result = await this.readContract('get_reports');
    return convertBigInts(result);
  }

  async ingestFromOpenAQ(city: string) {
    const cityKey = city.toLowerCase();
    const sensorId = CITY_SENSOR_MAP[cityKey];

    if (!sensorId) {
      return {
        message: `No known OpenAQ sensor mapped for "${city}"`,
        knownCities: Object.keys(CITY_SENSOR_MAP),
      };
    }

    const res = await axios.get(
      `https://api.openaq.org/v3/sensors/${sensorId}/measurements`,
      {
        params: { limit: 1 },
        headers: { 'X-API-Key': this.openaqApiKey },
      },
    );

    const results = res.data.results;
    if (!results || results.length === 0) {
      return { message: 'No recent measurements found', city };
    }

    const pm25Value = results[0].value;
    await this.submitReading(city, Math.round(pm25Value), 'OpenAQ');
    return { city, pm25: pm25Value, submitted: true };
  }
}