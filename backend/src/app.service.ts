import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo() {
    return {
      name: 'CleanTrace API',
      description:
        'On-chain verified pollution monitoring backend for Ghana, built on Soroban/Stellar.',
      endpoints: {
        'GET /pollution/readings': 'All on-chain pollution readings',
        'GET /pollution/reports': 'All on-chain citizen reports',
        'POST /pollution/readings': 'Submit a new reading',
        'GET /pollution/ingest/:city': 'Pull live OpenAQ data for a city and submit on-chain',
      },
      contract:
        'https://stellar.expert/explorer/testnet/contract/CBCJXJQQZN474BFXRWNCIDJI3EG7TW2QOKQ66F6X5QTQZHCKICIVRDGJ',
      frontend: 'https://clean-trace.vercel.app',
    };
  }
}
