import 'dotenv/config';
import { APIClient } from '../api/clients/APIClient';
import { SraRequestService } from '../api/requests/SraRequestService';
import { AuthHandler } from '../auth/AuthHandler';
import { loadConfig } from '../utils/config';

async function run() {
  try {
    const cfg = loadConfig('dev');
    const sra = cfg.sra || {};

    const baseUrl = sra.baseURL || process.env.SRA_BASE_URL || cfg.baseURL;
    const email = process.env.SRA_EMAIL || sra.email || process.env.SRA_EMAIL;

    if (!email) {
      console.error('SRA email not set in .env or config. Set SRA_EMAIL and try again.');
      process.exit(1);
    }

    console.log(`Using SRA base URL: ${baseUrl}`);

    const allowInsecure = (process.env.SRA_ALLOW_INSECURE === 'true') || (sra.allowInsecure === true);
    const apiClient = new APIClient(baseUrl, sra.timeout || cfg.timeout || 10000, allowInsecure);

    // AuthHandler is not used by SraRequestService for this flow, but constructor requires it
    const authHandler = new AuthHandler(sra.authURL || cfg.authURL || '', '', '');

    const sraService = new SraRequestService(apiClient, authHandler);

    console.log('Authenticating...');
    const token = await sraService.authenticateSra(email);
    console.log('Token received:', typeof token === 'string' ? token.substring(0, 20) + '...' : token);

    console.log('Fetching SRA Copy Parameters...');
    const resp = await sraService.getSraSprCopyParam(token);

    console.log('Status:', resp.status);
    if (resp && resp.data) {
      if (Array.isArray(resp.data)) {
        console.log('Data count:', resp.data.length);
      } else if (resp.data.data && Array.isArray(resp.data.data)) {
        console.log('Data count:', resp.data.data.length);
      } else {
        console.log('Response data keys:', Object.keys(resp.data));
      }
    }
  } catch (err: any) {
    console.error('Error running SRA test:', err?.status || err?.message || err);
    if (err?.data) console.error('Error data:', err.data);
    process.exit(2);
  }
}

run();
